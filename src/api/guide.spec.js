import { describe, expect, it } from 'vitest';
import { toEpgData } from './guide';
describe('backend programme guide data', () => {
    it('converts ISO programme times while retaining channel playback and regional metadata', () => {
        const guide = {
            channels: [
                {
                    id: 'channel-id',
                    name: 'BBC One',
                    icon: null,
                    alternateNames: ['BBC One London'],
                    variantCount: 2,
                    iptvChannelId: 'iptv-id',
                    watchable: true,
                    sortOrder: 3,
                },
            ],
            programmes: [
                {
                    channelExternalId: 'bbc-one',
                    channelId: 'channel-id',
                    start: '2026-10-31T20:00:00.000Z',
                    stop: '2026-10-31T21:00:00.000Z',
                    title: 'The Programme',
                    category: 'Drama',
                },
                {
                    channelExternalId: 'bbc-one',
                    channelId: 'channel-id',
                    start: 1793476800000,
                    stop: 1793480400000,
                    title: 'Numeric timestamp programme',
                },
                {
                    channelExternalId: 'broken',
                    channelId: 'channel-id',
                    start: 'not a date',
                    stop: '2026-10-31T21:00:00.000Z',
                    title: 'Invalid listing',
                },
            ],
            from: '2026-10-31T00:00:00.000Z',
            to: '2026-11-07T00:00:00.000Z',
            totalChannels: 1,
            channelOffset: 0,
            regionalMergeThresholdPercent: 65,
            sources: [],
        };
        const normalized = toEpgData(guide);
        expect(normalized.channels[0]).toMatchObject({
            alternateNames: ['BBC One London'],
            variantCount: 2,
            iptvChannelId: 'iptv-id',
            watchable: true,
            sortOrder: 3,
        });
        expect(normalized.programmes).toEqual([
            {
                ...guide.programmes[0],
                start: Date.parse('2026-10-31T20:00:00.000Z'),
                stop: Date.parse('2026-10-31T21:00:00.000Z'),
            },
            {
                ...guide.programmes[1],
                start: 1793476800000,
                stop: 1793480400000,
            },
        ]);
    });
});
