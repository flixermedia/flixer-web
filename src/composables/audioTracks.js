import { languageName } from './subtitles';
function languageKey(language) {
    const primary = language.trim().replaceAll('_', '-').split('-')[0]?.toLowerCase() ?? '';
    if (!primary || primary === 'und')
        return '';
    try {
        return new Intl.DisplayNames(['en'], { type: 'language' }).of(primary)?.toLowerCase() ?? primary;
    }
    catch {
        return primary;
    }
}
/** Returns the matching preferred track, or the container's default/first track. */
export function preferredAudioTrack(tracks, language) {
    if (language) {
        const preferred = languageKey(language);
        if (preferred) {
            const match = tracks.find((track) => track.language && languageKey(track.language) === preferred);
            if (match)
                return match;
        }
    }
    return tracks.find((track) => track.default) ?? tracks[0];
}
/** Creates a readable label while keeping alternate tracks distinguishable. */
export function audioTrackLabel(track, locale) {
    const language = track.language && track.language !== 'und' ? languageName(track.language, locale) : '';
    const details = [language, track.title?.trim()].filter(Boolean).join(' · ');
    return track.channels ? `${details}${details ? ' · ' : ''}${track.channels} ch` : details;
}
/** The streamer maps the first audio stream by default; only alternate streams need a query. */
export function selectedAudioStreamIndex(tracks, selectedIndex) {
    if (selectedIndex === null || selectedIndex === tracks[0]?.index)
        return undefined;
    return tracks.some((track) => track.index === selectedIndex) ? selectedIndex : undefined;
}
