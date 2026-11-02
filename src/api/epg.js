export const EPG_FEED_URL = 'https://raw.githubusercontent.com/dp247/Freeview-EPG/master/epg.xml';
export function parseXmltvTimestamp(value) {
    const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?$/.exec(value.trim());
    if (!match)
        return undefined;
    const [, year, month, day, hour, minute, second, sign, offsetHour, offsetMinute] = match;
    const parts = [year, month, day, hour, minute, second].map(Number);
    const [yearNumber, monthNumber, dayNumber, hourNumber, minuteNumber, secondNumber] = parts;
    const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber, hourNumber, minuteNumber, secondNumber));
    if (date.getUTCFullYear() !== yearNumber || date.getUTCMonth() !== monthNumber - 1 || date.getUTCDate() !== dayNumber || hourNumber > 23 || minuteNumber > 59 || secondNumber > 59) {
        return undefined;
    }
    const zoneHour = Number(offsetHour ?? 0);
    const zoneMinute = Number(offsetMinute ?? 0);
    if (zoneHour > 23 || zoneMinute > 59)
        return undefined;
    const offset = (zoneHour * 60 + zoneMinute) * (sign === '+' ? 1 : -1);
    return date.getTime() - offset * 60_000;
}
function childText(element, name) {
    return (Array.from(element.children)
        .find((child) => child.tagName === name)
        ?.textContent?.trim() || undefined);
}
export function parseXmltv(xml) {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.querySelector('parsererror') || document.documentElement.tagName !== 'tv') {
        throw new Error('The programme guide feed is not valid XMLTV data.');
    }
    const channels = [];
    for (const element of Array.from(document.getElementsByTagName('channel'))) {
        const id = element.getAttribute('id')?.trim();
        const name = childText(element, 'display-name');
        if (!id || !name)
            continue;
        const icon = Array.from(element.children)
            .find((child) => child.tagName === 'icon')
            ?.getAttribute('src')
            ?.trim();
        channels.push({ id, name, ...(icon ? { icon } : {}) });
    }
    const channelIds = new Set(channels.map((channel) => channel.id));
    const programmes = [];
    for (const element of Array.from(document.getElementsByTagName('programme'))) {
        const channelId = element.getAttribute('channel')?.trim() ?? '';
        const start = parseXmltvTimestamp(element.getAttribute('start') ?? '');
        const stop = parseXmltvTimestamp(element.getAttribute('stop') ?? '');
        const title = childText(element, 'title');
        if (!channelIds.has(channelId) || start === undefined || stop === undefined || stop <= start || !title)
            continue;
        const subtitle = childText(element, 'sub-title');
        const description = childText(element, 'desc');
        const category = childText(element, 'category');
        programmes.push({
            channelId,
            start,
            stop,
            title,
            ...(subtitle ? { subtitle } : {}),
            ...(description ? { description } : {}),
            ...(category ? { category } : {}),
        });
    }
    programmes.sort((left, right) => left.start - right.start);
    if (channels.length === 0 || programmes.length === 0) {
        throw new Error('The programme guide feed does not contain any channels or listings.');
    }
    return { channels, programmes };
}
export async function fetchEpg(signal) {
    const response = await fetch(EPG_FEED_URL, { signal });
    if (!response.ok)
        throw new Error(`The programme guide feed returned HTTP ${response.status}.`);
    return parseXmltv(await response.text());
}
export function programmesInWindow(programmes, start, stop) {
    return programmes.filter((programme) => programme.start < stop && programme.stop > start);
}
export function visibleGuideTimeChunks(scrollLeft, viewportWidth, timelineWidth, windowDuration, chunkDuration, prefetchChunks = 1) {
    if (!Number.isFinite(scrollLeft) || !Number.isFinite(viewportWidth) || !Number.isFinite(timelineWidth) || !Number.isFinite(windowDuration) || !Number.isFinite(chunkDuration) || timelineWidth <= 0 || windowDuration <= 0 || chunkDuration <= 0) {
        return [];
    }
    const chunkCount = Math.ceil(windowDuration / chunkDuration);
    const visibleStart = Math.max(0, Math.min(scrollLeft, timelineWidth));
    const visibleEnd = Math.max(visibleStart, Math.min(scrollLeft + Math.max(0, viewportWidth), timelineWidth));
    const first = Math.min(chunkCount - 1, Math.floor(((visibleStart / timelineWidth) * windowDuration) / chunkDuration));
    const lastVisible = Math.min(chunkCount - 1, Math.floor(((Math.max(visibleStart, visibleEnd - 1) / timelineWidth) * windowDuration) / chunkDuration));
    const last = Math.min(chunkCount - 1, lastVisible + Math.max(0, Math.floor(prefetchChunks)));
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}
export function programmeProgress(programme, now) {
    if (now <= programme.start)
        return 0;
    if (now >= programme.stop)
        return 100;
    return Math.round(((now - programme.start) / (programme.stop - programme.start)) * 100);
}
