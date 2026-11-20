# Lyric Display Motion

`src/LyricMotion.ts` is copied from https://github.com/binimum/am-lyrics,
version 1.9.1. The upstream MPL-2.0 license is retained in `LICENSE`.

Only the standalone spring-animation math is retained. Flixer's Vue
`SyncedLyrics.vue` uses it for staggered sliding transitions, alongside its own
existing parsed lyrics and playback state. No upstream renderer, runtime,
lyric providers, translations, or network code is included.