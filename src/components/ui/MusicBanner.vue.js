import { computed, useId } from 'vue';
const { defineProps, } = {};
const props = defineProps();
const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
const W = 1600;
const H = 500;
function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++)
        h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
}
const random = computed(() => {
    let state = hash(props.seed || 'flixer') || 1;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
    };
});
// Each seed nudges the palette around violet so neighbouring albums don't look identical.
const hue = computed(() => Math.round(-24 + random.value() * 48));
function y(wave, x) {
    return wave.base + wave.amp * Math.sin((x / W) * wave.freq * Math.PI * 2 + wave.phase);
}
function slope(wave, x) {
    return ((wave.amp * wave.freq * Math.PI * 2) / W) * Math.cos((x / W) * wave.freq * Math.PI * 2 + wave.phase);
}
const waves = computed(() => {
    const r = random.value;
    return [
        { base: 70 + r() * 30, amp: 45 + r() * 25, freq: 0.7 + r() * 0.3, phase: r() * 6 },
        { base: 400 - r() * 30, amp: 50 + r() * 30, freq: 0.8 + r() * 0.4, phase: r() * 6 },
    ];
});
function path(wave, offset) {
    const points = [];
    for (let x = -20; x <= W + 20; x += 40)
        points.push(`${x === -20 ? 'M' : 'L'}${x} ${(y(wave, x) + offset).toFixed(1)}`);
    return points.join(' ');
}
const staves = computed(() => waves.value.flatMap((wave, w) => [0, 9, 18, 27, 36].map((offset, i) => ({ id: `${w}-${i}`, d: path(wave, offset), opacity: 0.1 + (i === 2 ? 0.08 : 0) }))));
const notes = computed(() => {
    const r = random.value;
    const result = [];
    waves.value.forEach((wave, w) => {
        const count = 15;
        for (let i = 0; i < count; i++) {
            const x = ((i + 0.5 + (r() - 0.5) * 0.6) / count) * W;
            // Notes thin out and fade toward the middle of the banner so titles stay readable.
            const edge = Math.abs(((x / W) % 1) - 0.5) * 2;
            const ghost = r() < 0.22;
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
            });
        }
    });
    return result;
});
// Eased stops make the banner dissolve into the page instead of ending in a visible band.
const fade = `linear-gradient(to bottom, transparent 0%, ${[
    [0.04, 12],
    [0.15, 25],
    [0.3, 42],
    [0.5, 62],
    [0.7, 80],
    [0.87, 93],
    [1, 100],
]
    .map(([stop, pct]) => `color-mix(in srgb, var(--color-flixer-background) ${pct}%, transparent) ${stop * 100}%`)
    .join(', ')})`;
const sparkles = computed(() => {
    const r = random.value;
    return Array.from({ length: 46 }, (_, i) => ({ id: i, x: r() * W, y: r() * H, size: 0.8 + r() * 2.2, opacity: 0.25 + r() * 0.65 }));
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    void {};
    /** @type {__VLS_StyleScopedClasses['note-float']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute inset-0 overflow-hidden bg-[#12062e]" },
        'aria-hidden': "true",
        ...{ style: ({ filter: `hue-rotate(${__VLS_unwrap(hue, {})}deg) saturate(0.8)` }) },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-[#12062e]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute inset-0 bg-[linear-gradient(135deg,#140636_0%,#2a0f66_45%,#3f1580_75%,#5a1f90_100%)]" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-[linear-gradient(135deg,#140636_0%,#2a0f66_45%,#3f1580_75%,#5a1f90_100%)]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute -left-24 bottom-[-30%] size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(236,100,200,0.3),transparent_65%)] blur-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['-left-24']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-[-30%]']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-[34rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-[radial-gradient(circle,rgba(236,100,200,0.3),transparent_65%)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute -right-20 -top-1/3 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(255,170,120,0.22),transparent_65%)] blur-2xl" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['-right-20']} */ ;
    /** @type {__VLS_StyleScopedClasses['-top-1/3']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-[36rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-[radial-gradient(circle,rgba(255,170,120,0.22),transparent_65%)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-2xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute left-1/3 top-1/4 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(110,80,255,0.22),transparent_70%)] blur-3xl" },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['left-1/3']} */ ;
    /** @type {__VLS_StyleScopedClasses['top-1/4']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-[28rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-[radial-gradient(circle,rgba(110,80,255,0.22),transparent_70%)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-3xl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        ...{ class: "absolute inset-0 size-full opacity-70 blur-[1.5px]" },
        viewBox: (`0 0 ${__VLS_unwrap(W, {})} ${__VLS_unwrap(H, {})}`),
        preserveAspectRatio: "xMidYMid slice",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
    /** @type {__VLS_StyleScopedClasses['blur-[1.5px]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.defs, __VLS_intrinsics.defs)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.linearGradient, __VLS_intrinsics.linearGradient)({
        id: (`${__VLS_unwrap(uid, {})}-note`),
        x1: "0",
        y1: "0",
        x2: "1",
        y2: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.stop)({
        offset: "0",
        'stop-color': "#ffd7a8",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.stop)({
        offset: "0.55",
        'stop-color': "#ff9ad6",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.stop)({
        offset: "1",
        'stop-color': "#b97bff",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.filter, __VLS_intrinsics.filter)({
        id: (`${__VLS_unwrap(uid, {})}-glow`),
        x: "-80%",
        y: "-80%",
        width: "260%",
        height: "260%",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.feGaussianBlur)({
        stdDeviation: "1.2",
        result: "blur",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.feMerge, __VLS_intrinsics.feMerge)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.feMergeNode)({
        in: "blur",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.feMergeNode)({
        in: "SourceGraphic",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
        id: (`${__VLS_unwrap(uid, {})}-single`),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.ellipse)({
        cx: "0",
        cy: "0",
        rx: "9",
        ry: "6.5",
        transform: "rotate(-20)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "6.5",
        y: "-34",
        width: "2.6",
        height: "34",
        rx: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M9 -34 C 17 -28, 22 -22, 19 -12 C 18 -20, 14 -23, 9 -24 Z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
        id: (`${__VLS_unwrap(uid, {})}-pair`),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.ellipse)({
        cx: "0",
        cy: "0",
        rx: "9",
        ry: "6.5",
        transform: "rotate(-20)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.ellipse)({
        cx: "26",
        cy: "-5",
        rx: "9",
        ry: "6.5",
        transform: "rotate(-20 26 -5)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "6.5",
        y: "-36",
        width: "2.6",
        height: "36",
        rx: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "32.5",
        y: "-41",
        width: "2.6",
        height: "36",
        rx: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M6.5 -36 L35.1 -41 L35.1 -33 L6.5 -28 Z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
        id: (`${__VLS_unwrap(uid, {})}-triple`),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.ellipse)({
        cx: "0",
        cy: "0",
        rx: "9",
        ry: "6.5",
        transform: "rotate(-20)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.ellipse)({
        cx: "24",
        cy: "-3",
        rx: "9",
        ry: "6.5",
        transform: "rotate(-20 24 -3)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.ellipse)({
        cx: "48",
        cy: "-6",
        rx: "9",
        ry: "6.5",
        transform: "rotate(-20 48 -6)",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "6.5",
        y: "-36",
        width: "2.6",
        height: "36",
        rx: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "30.5",
        y: "-39",
        width: "2.6",
        height: "36",
        rx: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "54.5",
        y: "-42",
        width: "2.6",
        height: "36",
        rx: "1",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M6.5 -36 L57.1 -42 L57.1 -34 L6.5 -28 Z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
        fill: "none",
        stroke: "#f0d4ff",
        'stroke-width': "1",
    });
    const __VLS_0 = __VLS_tryAsConstant((__VLS_unwrap(staves, {})));
    for (const [line] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            key: (line.id),
            d: (line.d),
            opacity: (line.opacity),
        });
        // @ts-ignore
        [hue, W, H, uid, uid, uid, uid, uid, staves,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
        fill: "#ffffff",
    });
    const __VLS_1 = __VLS_tryAsConstant((__VLS_unwrap(sparkles, {})));
    for (const [sparkle] of __VLS_vFor(__VLS_nonNull(__VLS_1))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            key: (sparkle.id),
            cx: (sparkle.x),
            cy: (sparkle.y),
            r: (sparkle.size),
            opacity: (sparkle.opacity),
        });
        // @ts-ignore
        [sparkles,];
    }
    const __VLS_2 = __VLS_tryAsConstant((__VLS_unwrap(notes, {})));
    for (const [note] of __VLS_vFor(__VLS_nonNull(__VLS_2))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
            key: (note.id),
            transform: (`translate(${note.x.toFixed(1)} ${note.y.toFixed(1)}) rotate(${note.rotate.toFixed(1)}) scale(${note.scale.toFixed(2)})`),
            opacity: (note.opacity),
            filter: (note.ghost ? undefined : `url(#${__VLS_unwrap(uid, {})}-glow)`),
            fill: (note.ghost ? '#7a4fd6' : `url(#${__VLS_unwrap(uid, {})}-note)`),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.g, __VLS_intrinsics.g)({
            ...{ class: "note-float" },
            ...{ style: ({ '--dx': `${note.dx}px`, '--dy': `${note.dy}px`, animationDuration: `${note.drift}s`, animationDelay: `${note.delay}s` }) },
        });
        /** @type {__VLS_StyleScopedClasses['note-float']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.use)({
            href: (`#${__VLS_unwrap(uid, {})}-${note.kind}`),
        });
        // @ts-ignore
        [uid, uid, uid, notes,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "absolute inset-x-0 bottom-0 h-full" },
        ...{ style: ({ background: __VLS_unwrap(fade, {}) }) },
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    // @ts-ignore
    [fade,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
