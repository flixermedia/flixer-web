<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { callPluginOperation, canPluginControlPlayback, listPluginSlots, type PluginSlotEntry, type PluginSlotLocation } from '../../api'

const props = defineProps<{ location: PluginSlotLocation; context: Record<string, string | boolean | null> }>()
const emit = defineEmits<{ playback: [command: { action: 'play' | 'pause' | 'toggle' | 'seek'; position?: number }] }>()
const slots = ref<PluginSlotEntry[]>([])
const frames = new Map<string, HTMLIFrameElement>()
const inFlight = new Map<string, number>()
const channel = 'flixer-slot-v1'
let mounted = true

function key(slot: PluginSlotEntry) { return `${slot.pluginId}:${slot.id}` }

function base64(value: string) {
    return btoa(Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join(''))
}

function frameDocument(slot: PluginSlotEntry) {
    const context = base64(JSON.stringify({ ...props.context, location: props.location, slot: slot.id }))
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>html,body{margin:0;background:#17171d;color:white;color-scheme:dark;font:14px sans-serif}button{background:#292930;color:white;border:1px solid #666;padding:6px 10px;border-radius:4px;cursor:pointer}.row{display:flex;align-items:center;gap:8px}.column{display:flex;flex-direction:column;gap:8px}</style></head><body><div id="root"></div><script>
const decode=(value)=>new TextDecoder().decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0)));
const workerBootstrap="const waiting=new Map();let sequence=0,actionHandler=null;self.flixer=Object.freeze({context:JSON.parse("+JSON.stringify(decode('${context}'))+"),render:tree=>postMessage({type:'render',tree}),onAction:handler=>{if(typeof handler==='function')actionHandler=handler},playback:(action,position)=>postMessage({type:'playback',action,position}),invoke:(operation,body={})=>new Promise((resolve,reject)=>{const id=String(++sequence);waiting.set(id,{resolve,reject});postMessage({type:'invoke',id,operation,body});setTimeout(()=>{if(waiting.has(id)){waiting.delete(id);reject(new Error('Plugin operation timed out'))}},15000)})});self.addEventListener('message',event=>{const message=event.data;if(!message||typeof message!=='object')return;if(message.type==='action'){if(actionHandler)actionHandler(message.id);return}if(message.type!=='result')return;const pending=waiting.get(message.id);if(!pending)return;waiting.delete(message.id);message.ok?pending.resolve(message.result):pending.reject(new Error('Plugin operation failed'))});\\n";
const worker=new Worker(URL.createObjectURL(new Blob([workerBootstrap,decode('${slot.source}')],{type:'text/javascript'})));
function node(value,depth,budget){if(!value||typeof value!=='object'||depth>6||budget.count++>=100)return document.createTextNode('');const type=value.type;if(type==='text'){const element=document.createElement('span');element.textContent=typeof value.text==='string'?value.text.slice(0,1000):'';return element}if(type==='button'){const element=document.createElement('button');element.type='button';element.textContent=typeof value.label==='string'?value.label.slice(0,100):'';element.disabled=value.disabled===true;if(typeof value.id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(value.id))element.addEventListener('click',()=>worker.postMessage({type:'action',id:value.id}));return element}if(type==='row'||type==='column'){const element=document.createElement('div');element.className=type;for(const child of Array.isArray(value.children)?value.children.slice(0,30):[])element.appendChild(node(child,depth+1,budget));return element}return document.createTextNode('')}
worker.addEventListener('message',event=>{const message=event.data;if(!message||typeof message!=='object')return;if(message.type==='render'){document.getElementById('root').replaceChildren(node(message.tree,0,{count:0}));return}if(message.type==='invoke'||message.type==='playback')parent.postMessage({...message,channel:'${channel}'},'*')});
window.addEventListener('message',event=>{const message=event.data;if(event.source===parent&&message&&message.channel==='${channel}'&&message.type==='result')worker.postMessage(message)});
<\/script></body></html>`
}

function setFrame(slot: PluginSlotEntry, element: unknown) {
    if (element instanceof HTMLIFrameElement) frames.set(key(slot), element)
    else frames.delete(key(slot))
}

async function onMessage(event: MessageEvent) {
    const slot = slots.value.find((entry) => frames.get(key(entry))?.contentWindow === event.source)
    if (!slot || !event.data || typeof event.data !== 'object') return
    const message = event.data as Record<string, unknown>
    if (message.channel === channel && message.type === 'playback' && props.location === 'player.controls' && slot.playbackControl === true) {
        const validAction = message.action === 'play' || message.action === 'pause' || message.action === 'toggle' || (message.action === 'seek' && typeof message.position === 'number' && Number.isFinite(message.position) && message.position >= 0)
        const frameKey = key(slot)
        if (!validAction || (inFlight.get(frameKey) ?? 0) >= 4) return
        inFlight.set(frameKey, (inFlight.get(frameKey) ?? 0) + 1)
        let allowed = false
        try { allowed = await canPluginControlPlayback(slot.pluginId, slot.id) } catch { return }
        finally { inFlight.set(frameKey, Math.max(0, (inFlight.get(frameKey) ?? 1) - 1)) }
        if (!allowed || frames.get(key(slot))?.contentWindow !== event.source) return
        if (message.action === 'play' || message.action === 'pause' || message.action === 'toggle') emit('playback', { action: message.action })
        else if (message.action === 'seek' && typeof message.position === 'number' && Number.isFinite(message.position) && message.position >= 0) emit('playback', { action: 'seek', position: message.position })
        return
    }
    if (message.channel !== channel || message.type !== 'invoke' || typeof message.id !== 'string' || !/^[0-9]{1,16}$/.test(message.id) || typeof message.operation !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(message.operation) || !message.body || typeof message.body !== 'object' || Array.isArray(message.body)) return
    const frameKey = key(slot)
    if ((inFlight.get(frameKey) ?? 0) >= 4) return
    let size: number
    try { size = new TextEncoder().encode(JSON.stringify(message.body)).length } catch { return }
    if (size > 16 * 1024) return
    inFlight.set(frameKey, (inFlight.get(frameKey) ?? 0) + 1)
    let result: unknown
    let ok = false
    try {
        result = await callPluginOperation(slot.pluginId, message.operation, message.body as Record<string, unknown>)
        ok = true
    } catch { result = null }
    finally { inFlight.set(frameKey, Math.max(0, (inFlight.get(frameKey) ?? 1) - 1)) }
    if (frames.get(frameKey)?.contentWindow === event.source) {
        frames.get(frameKey)?.contentWindow?.postMessage({ channel, type: 'result', id: message.id, ok, result }, '*')
    }
}

onMounted(async () => {
    window.addEventListener('message', onMessage)
    try {
        const result = await listPluginSlots(props.location)
        if (mounted && Array.isArray(result)) slots.value = result.filter((slot) => typeof slot.source === 'string' && /^[A-Za-z0-9+/=]+$/.test(slot.source) && slot.source.length <= 350000)
    } catch { slots.value = [] }
})
onBeforeUnmount(() => { mounted = false; window.removeEventListener('message', onMessage); frames.clear() })
</script>

<template>
    <div v-if="slots.length"
        :class="location === 'player.controls' ? 'flex max-w-full gap-2 overflow-x-auto' : 'space-y-3'">
        <iframe v-for="slot in slots" :key="key(slot)" :ref="(element) => setFrame(slot, element)"
            sandbox="allow-scripts" :title="slot.title" :srcdoc="frameDocument(slot)" class="block border-0"
            :class="location === 'player.controls' ? 'h-10 w-36 shrink-0' : 'h-28 w-full'" />
    </div>
</template>