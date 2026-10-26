<script setup lang="ts">
import { computed, useId } from 'vue'

// A decorative banner for music pages with no artwork: a glowing purple field with notes riding on staff lines.
const props = defineProps<{ seed?: string }>()

const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
const W = 1600
const H = 500

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

const random = computed(() => {
  let state = hash(props.seed || 'flixer') || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
})

// Each seed nudges the palette around violet so neighbouring albums don't look identical.
const hue = computed(() => Math.round(-24 + random.value() * 48))

interface Wave {
  base: number
  amp: number
  freq: number
  phase: number
}

function y(wave: Wave, x: number) {
  return wave.base + wave.amp * Math.sin((x / W) * wave.freq * Math.PI * 2 + wave.phase)
}

function slope(wave: Wave, x: number) {
  return ((wave.amp * wave.freq * Math.PI * 2) / W) * Math.cos((x / W) * wave.freq * Math.PI * 2 + wave.phase)
}

const waves = computed<Wave[]>(() => {
  const r = random.value
  return [
    { base: 70 + r() * 30, amp: 45 + r() * 25, freq: 0.7 + r() * 0.3, phase: r() * 6 },
    { base: 400 - r() * 30, amp: 50 + r() * 30, freq: 0.8 + r() * 0.4, phase: r() * 6 },
  ]
})

function path(wave: Wave, offset: number) {
  const points: string[] = []
  for (let x = -20; x <= W + 20; x += 40) points.push(`${x === -20 ? 'M' : 'L'}${x} ${(y(wave, x) + offset).toFixed(1)}`)
  return points.join(' ')
}

const staves = computed(() => waves.value.flatMap((wave, w) => [0, 9, 18, 27, 36].map((offset, i) => ({ id: `${w}-${i}`, d: path(wave, offset), opacity: 0.1 + (i === 2 ? 0.08 : 0) }))))

interface Note {
  id: string
  x: number
  y: number
  rotate: number
  scale: number
  opacity: number
  kind: 'single' | 'pair' | 'triple'
  ghost: boolean
  drift: number
  delay: number
  dx: number
  dy: number
}

const notes = computed<Note[]>(() => {
  const r = random.value
  const result: Note[] = []
  waves.value.forEach((wave, w) => {
    const count = 15
    for (let i = 0; i < count; i++) {
      const x = ((i + 0.5 + (r() - 0.5) * 0.6) / count) * W
      // Notes thin out and fade toward the middle of the banner so titles stay readable.
      const edge = Math.abs(((x / W) % 1) - 0.5) * 2
      const ghost = r() < 0.22
      result.push({
        id: `${w}-${i}`,
        x,
        y: y(wave, x) + 18 + (r() - 0.5) * 36,
        rotate: (Math.atan(slope(wave, x)) * 180) / Math.PI + (r() - 0.5) * 18,
        scale: 0.7 + r() * 1.1,
        opacity: ghost ? 0.12 : 0.3 + edge * 0.4,
        kind: r() < 0.4 ? 'single' : r() < 0.75 ? 'pair' : 'triple',
        ghost,
        drift: 7 + r() * 8,
        delay: -r() * 15,
        dx: (r() - 0.5) * 30,
        dy: 8 + r() * 14,
      })
    }
  })
  return result
})

const sparkles = computed(() => {
  const r = random.value
  return Array.from({ length: 46 }, (_, i) => ({ id: i, x: r() * W, y: r() * H, size: 0.8 + r() * 2.2, opacity: 0.25 + r() * 0.65 }))
})
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-[#12062e]" aria-hidden="true" :style="{ filter: `hue-rotate(${hue}deg) saturate(0.8)` }">
    <div class="absolute inset-0 bg-[linear-gradient(135deg,#140636_0%,#2a0f66_45%,#3f1580_75%,#5a1f90_100%)]"></div>
    <div class="absolute -left-24 bottom-[-30%] size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(236,100,200,0.3),transparent_65%)] blur-2xl"></div>
    <div class="absolute -right-20 -top-1/3 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(255,170,120,0.22),transparent_65%)] blur-2xl"></div>
    <div class="absolute left-1/3 top-1/4 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(110,80,255,0.22),transparent_70%)] blur-3xl"></div>

    <svg class="absolute inset-0 size-full opacity-70" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient :id="`${uid}-note`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffd7a8" />
          <stop offset="0.55" stop-color="#ff9ad6" />
          <stop offset="1" stop-color="#b97bff" />
        </linearGradient>
        <filter :id="`${uid}-glow`" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <g :id="`${uid}-single`">
          <ellipse cx="0" cy="0" rx="9" ry="6.5" transform="rotate(-20)" />
          <rect x="6.5" y="-34" width="2.6" height="34" rx="1" />
          <path d="M9 -34 C 17 -28, 22 -22, 19 -12 C 18 -20, 14 -23, 9 -24 Z" />
        </g>
        <g :id="`${uid}-pair`">
          <ellipse cx="0" cy="0" rx="9" ry="6.5" transform="rotate(-20)" />
          <ellipse cx="26" cy="-5" rx="9" ry="6.5" transform="rotate(-20 26 -5)" />
          <rect x="6.5" y="-36" width="2.6" height="36" rx="1" />
          <rect x="32.5" y="-41" width="2.6" height="36" rx="1" />
          <path d="M6.5 -36 L35.1 -41 L35.1 -33 L6.5 -28 Z" />
        </g>
        <g :id="`${uid}-triple`">
          <ellipse cx="0" cy="0" rx="9" ry="6.5" transform="rotate(-20)" />
          <ellipse cx="24" cy="-3" rx="9" ry="6.5" transform="rotate(-20 24 -3)" />
          <ellipse cx="48" cy="-6" rx="9" ry="6.5" transform="rotate(-20 48 -6)" />
          <rect x="6.5" y="-36" width="2.6" height="36" rx="1" />
          <rect x="30.5" y="-39" width="2.6" height="36" rx="1" />
          <rect x="54.5" y="-42" width="2.6" height="36" rx="1" />
          <path d="M6.5 -36 L57.1 -42 L57.1 -34 L6.5 -28 Z" />
        </g>
      </defs>

      <g fill="none" stroke="#f0d4ff" stroke-width="1">
        <path v-for="line in staves" :key="line.id" :d="line.d" :opacity="line.opacity" />
      </g>

      <g fill="#ffffff">
        <circle v-for="sparkle in sparkles" :key="sparkle.id" :cx="sparkle.x" :cy="sparkle.y" :r="sparkle.size" :opacity="sparkle.opacity" />
      </g>

      <g v-for="note in notes" :key="note.id" :transform="`translate(${note.x.toFixed(1)} ${note.y.toFixed(1)}) rotate(${note.rotate.toFixed(1)}) scale(${note.scale.toFixed(2)})`" :opacity="note.opacity" :filter="note.ghost ? undefined : `url(#${uid}-glow)`" :fill="note.ghost ? '#7a4fd6' : `url(#${uid}-note)`">
        <g class="note-float" :style="{ '--dx': `${note.dx}px`, '--dy': `${note.dy}px`, animationDuration: `${note.drift}s`, animationDelay: `${note.delay}s` }">
          <use :href="`#${uid}-${note.kind}`" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.note-float {
  animation: note-float ease-in-out infinite alternate;
}

@keyframes note-float {
  from {
    transform: translate(0, 0) rotate(-4deg);
  }
  to {
    transform: translate(var(--dx), calc(var(--dy) * -1)) rotate(4deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .note-float {
    animation: none;
  }
}
</style>
