/** Where the thumbnail for `seconds` sits, scaled so each thumbnail is `displayWidth` pixels wide. */
export function thumbnailAt(manifest, seconds, displayWidth) {
    const perSheet = manifest.columns * manifest.rows;
    const index = Math.min(manifest.count - 1, Math.max(0, Math.floor((seconds * 1000) / manifest.intervalMs)));
    const scale = displayWidth / manifest.thumbWidth;
    const width = Math.round(manifest.thumbWidth * scale);
    const height = Math.round(manifest.thumbHeight * scale);
    const position = index % perSheet;
    return {
        sheet: Math.floor(index / perSheet),
        x: (position % manifest.columns) * width,
        y: Math.floor(position / manifest.columns) * height,
        sheetWidth: manifest.columns * width,
        sheetHeight: manifest.rows * height,
        width,
        height,
    };
}
