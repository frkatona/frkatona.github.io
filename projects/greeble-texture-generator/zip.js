const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) {
        value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    return value >>> 0;
});

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
    return (crc ^ 0xffffffff) >>> 0;
}

export async function zipPngs(files) {
    const encoder = new TextEncoder();
    const entries = [];
    const directory = [];
    let offset = 0;
    let directorySize = 0;

    // PNGs are already compressed, so ZIP stores their bytes as-is.
    for (const { name, blob } of files) {
        const path = encoder.encode(name);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const crc = crc32(bytes);
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(12, 33, true); // 1980-01-01 in DOS date format
        local.setUint32(14, crc, true);
        local.setUint32(18, bytes.length, true);
        local.setUint32(22, bytes.length, true);
        local.setUint16(26, path.length, true);
        entries.push(local.buffer, path, blob);

        const central = new DataView(new ArrayBuffer(46));
        central.setUint32(0, 0x02014b50, true);
        central.setUint16(4, 20, true);
        central.setUint16(6, 20, true);
        central.setUint16(14, 33, true);
        central.setUint32(16, crc, true);
        central.setUint32(20, bytes.length, true);
        central.setUint32(24, bytes.length, true);
        central.setUint16(28, path.length, true);
        central.setUint32(42, offset, true);
        directory.push(central.buffer, path);

        offset += local.byteLength + path.length + bytes.length;
        directorySize += central.byteLength + path.length;
    }

    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...entries, ...directory, end.buffer], { type: 'application/zip' });
}
