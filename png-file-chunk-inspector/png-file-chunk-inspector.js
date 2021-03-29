/*
 * PNG file chunk inspector (compiled from TypeScript)
 *
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/png-file-chunk-inspector
 */
"use strict";
var app;
(function (app) {
    function initialize() {
        let fileElem = requireType(document.querySelector("article input[type=file]"), HTMLInputElement);
        fileElem.onchange = () => {
            const files = fileElem.files;
            if (files === null || files.length < 1)
                return;
            let reader = new FileReader();
            reader.onload = () => {
                const bytes = requireType(reader.result, ArrayBuffer);
                visualizeFile(new Uint8Array(bytes));
            };
            reader.readAsArrayBuffer(files[0]);
        };
    }
    setTimeout(initialize);
    function visualizeFile(fileBytes) {
        let table = requireType(document.querySelector("article table"), HTMLElement);
        table.classList.remove("errors");
        let tbody = requireType(table.querySelector("tbody"), HTMLElement);
        while (tbody.firstChild !== null)
            tbody.removeChild(tbody.firstChild);
        for (const part of parseFile(fileBytes)) {
            let tr = appendElem(tbody, "tr");
            appendElem(tr, "td", uintToStrWithThousandsSeparators(part.offset));
            {
                let td = appendElem(tr, "td");
                let hex = [];
                const bytes = part.bytes;
                function pushHex(index) {
                    hex.push(bytes[index].toString(16).padStart(2, "0"));
                }
                if (bytes.length <= 100) {
                    for (let i = 0; i < bytes.length; i++)
                        pushHex(i);
                }
                else {
                    for (let i = 0; i < 70; i++)
                        pushHex(i);
                    hex.push("...");
                    for (let i = bytes.length - 30; i < bytes.length; i++)
                        pushHex(i);
                }
                appendElem(td, "code", hex.join(" "));
            }
            for (const list of [part.outerNotes, part.innerNotes, part.errorNotes]) {
                let td = appendElem(tr, "td");
                let ul = appendElem(td, "ul");
                for (const item of list) {
                    if (list == part.errorNotes)
                        table.classList.add("errors");
                    let li = appendElem(ul, "li");
                    if (typeof item == "string")
                        li.textContent = item;
                    else if (item instanceof Node)
                        li.appendChild(item);
                    else
                        throw "Assertion error";
                }
            }
        }
    }
    function parseFile(fileBytes) {
        let fileParts = [];
        let offset = 0;
        { // Parse file signature
            const bytes = fileBytes.slice(offset, Math.min(offset + SignaturePart.FILE_SIGNATURE.length, fileBytes.length));
            fileParts.push(new SignaturePart(offset, bytes));
            offset += bytes.length;
        }
        // Parse chunks but carefully handle erroneous file structures
        while (offset < fileBytes.length) {
            // Begin by assuming that the next chunk is invalid
            let bytes = fileBytes.slice(offset, fileBytes.length);
            if (fileParts[0].errorNotes.length > 0) { // Signature is wrong
                fileParts.push(new UnknownPart(offset, bytes));
                offset += bytes.length;
            }
            else {
                const remain = bytes.length;
                if (remain >= 4) {
                    const innerLen = readUint32(fileBytes, offset);
                    const outerLen = innerLen + 12;
                    if (innerLen <= ChunkPart.MAX_DATA_LENGTH && outerLen <= remain)
                        bytes = fileBytes.slice(offset, offset + outerLen); // Chunk is now valid with respect to length
                }
                fileParts.push(new ChunkPart(offset, bytes));
                offset += bytes.length;
            }
        }
        { // Annotate chunks
            let earlierChunks = [];
            for (const part of fileParts) {
                if (part instanceof ChunkPart) {
                    part.annotate(earlierChunks);
                    earlierChunks.push(part);
                }
            }
        }
        if (offset != fileBytes.length)
            throw "Assertion error";
        return fileParts;
    }
    class FilePart {
        constructor(offset, bytes) {
            this.offset = offset;
            this.bytes = bytes;
            this.outerNotes = [];
            this.innerNotes = [];
            this.errorNotes = [];
        }
    }
    class SignaturePart extends FilePart {
        constructor(offset, bytes) {
            super(offset, bytes);
            this.outerNotes.push("Special: File signature");
            this.outerNotes.push(`Length: ${uintToStrWithThousandsSeparators(bytes.length)} bytes`);
            this.innerNotes.push(`\u201C${bytesToReadableString(bytes)}\u201D`);
            for (let i = 0; i < SignaturePart.FILE_SIGNATURE.length && this.errorNotes.length == 0; i++) {
                if (i >= bytes.length)
                    this.errorNotes.push("Premature EOF");
                else if (bytes[i] != SignaturePart.FILE_SIGNATURE[i])
                    this.errorNotes.push("Value mismatch");
            }
        }
    }
    SignaturePart.FILE_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    class UnknownPart extends FilePart {
        constructor(offset, bytes) {
            super(offset, bytes);
            this.outerNotes.push("Special: Unknown");
            this.outerNotes.push(`Length: ${uintToStrWithThousandsSeparators(bytes.length)} bytes`);
            this.errorNotes.push("Unknown format");
        }
    }
    class ChunkPart extends FilePart {
        constructor(offset, bytes) {
            super(offset, bytes);
            this.typeCodeStr = "";
            this.data = new Uint8Array();
            if (bytes.length < 4) {
                this.outerNotes.push("Data length: Unfinished");
                this.errorNotes.push("Premature EOF");
                return;
            }
            const dataLen = readUint32(bytes, 0);
            this.outerNotes.push(`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
            if (dataLen > ChunkPart.MAX_DATA_LENGTH)
                this.errorNotes.push("Length out of range");
            else if (bytes.length < dataLen + 12)
                this.errorNotes.push("Premature EOF");
            if (bytes.length < 8) {
                this.outerNotes.push("Type code: Unfinished");
                return;
            }
            const typeCodeBytes = bytes.slice(4, 8);
            const typeCodeStr = bytesToReadableString(typeCodeBytes);
            this.outerNotes.push("Type code: " + typeCodeStr);
            let typeName = null;
            for (const [code, name, _] of ChunkPart.TYPE_HANDLERS) {
                if (code == typeCodeStr) {
                    if (typeName !== null)
                        throw "Table has duplicate keys";
                    typeName = name;
                }
            }
            if (typeName === null)
                typeName = "Unknown";
            this.outerNotes.push("Name: " + typeName);
            this.outerNotes.push((typeCodeBytes[0] & 0x20) == 0 ? "Critical (0)" : "Ancillary (1)");
            this.outerNotes.push((typeCodeBytes[1] & 0x20) == 0 ? "Public (0)" : "Private (1)");
            this.outerNotes.push((typeCodeBytes[2] & 0x20) == 0 ? "Reserved (0)" : "Unknown (1)");
            this.outerNotes.push((typeCodeBytes[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)");
            if (dataLen > ChunkPart.MAX_DATA_LENGTH)
                return;
            if (bytes.length < dataLen + 12) {
                this.outerNotes.push("CRC-32: Unfinished");
                return;
            }
            const storedCrc = readUint32(bytes, bytes.length - 4);
            this.outerNotes.push(`CRC-32: ${storedCrc.toString(16).padStart(8, "0").toUpperCase()}`);
            const dataCrc = calcCrc32(bytes.slice(4, bytes.length - 4));
            if (dataCrc != storedCrc)
                this.errorNotes.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8, "0").toUpperCase()})`);
            this.typeCodeStr = typeCodeStr;
            this.data = bytes.slice(8, bytes.length - 4);
        }
        annotate(earlierChunks) {
            if (this.innerNotes.length > 0)
                throw "Already annotated";
            for (const [code, _, func] of ChunkPart.TYPE_HANDLERS) {
                if (code == this.typeCodeStr) {
                    func(this, earlierChunks);
                    return;
                }
            }
        }
    }
    // The maximum length of a chunk's payload data, in bytes.
    // Although this number does not fit in a signed 32-bit integer type,
    // the PNG specification says that lengths "must not exceed 2^31 bytes".
    ChunkPart.MAX_DATA_LENGTH = 0x80000000;
    ChunkPart.TYPE_HANDLERS = [
        ["bKGD", "Background color", function (chunk, earlier) { }],
        ["cHRM", "Primary chromaticities", function (chunk, earlier) {
                if (chunk.data.length != 32) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                let offset = 0;
                for (const item of ["White point", "Red", "Green", "Blue"]) {
                    for (const axis of ["x", "y"]) {
                        const val = readUint32(chunk.data, offset);
                        let s = val.toString().padStart(6, "0");
                        s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
                        // s basically equals (val/100000).toFixed(5)
                        chunk.innerNotes.push(`${item} ${axis}: ${s}`);
                        offset += 4;
                    }
                }
            }],
        ["gAMA", "Image gamma", function (chunk, earlier) {
                if (chunk.data.length != 4) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const gamma = readUint32(chunk.data, 0);
                let s = gamma.toString().padStart(6, "0");
                s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
                // s basically equals (gamma/100000).toFixed(5)
                chunk.innerNotes.push(`Gamma: ${s}`);
            }],
        ["hIST", "Palette histogram", function (chunk, earlier) {
                if (chunk.data.length % 2 != 0 || chunk.data.length / 2 > 256) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
            }],
        ["iCCP", "Embedded ICC profile", function (chunk, earlier) { }],
        ["IDAT", "Image data", function (chunk, earlier) { }],
        ["IEND", "Image trailer", function (chunk, earlier) {
                if (chunk.data.length != 0)
                    chunk.errorNotes.push("Non-empty data");
            }],
        ["IHDR", "Image header", function (chunk, earlier) {
                if (chunk.data.length != 13) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const width = readUint32(chunk.data, 0);
                const height = readUint32(chunk.data, 4);
                const bitDepth = chunk.data[8];
                const colorType = chunk.data[9];
                const compMeth = chunk.data[10];
                const filtMeth = chunk.data[11];
                const laceMeth = chunk.data[12];
                chunk.innerNotes.push(`Width: ${width} pixels`);
                if (width == 0 || width > 0x80000000)
                    chunk.errorNotes.push("Width out of range");
                chunk.innerNotes.push(`Height: ${height} pixels`);
                if (height == 0 || height > 0x80000000)
                    chunk.errorNotes.push("Height out of range");
                {
                    let colorTypeStr;
                    let validBitDepths;
                    const temp = lookUpTable(colorType, [
                        [0, ["Grayscale", [1, 2, 4, 8, 16]]],
                        [2, ["RGB", [8, 16]]],
                        [3, ["Palette", [1, 2, 4, 8]]],
                        [4, ["Grayscale+Alpha", [8, 16]]],
                        [6, ["RGBA", [8, 16]]],
                    ]);
                    colorTypeStr = temp !== null ? temp[0] : "Unknown";
                    validBitDepths = temp !== null ? temp[1] : [];
                    chunk.innerNotes.push(`Bit depth: ${bitDepth} bits per ${colorType != 3 ? "channel" : "pixel"}`);
                    chunk.innerNotes.push(`Color type: ${colorTypeStr} (${colorType})`);
                    if (temp === null)
                        chunk.errorNotes.push("Unknown color type");
                    else if (!validBitDepths.includes(bitDepth))
                        chunk.errorNotes.push("Invalid bit depth");
                }
                {
                    let s = lookUpTable(compMeth, [
                        [0, "DEFLATE"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown compression method");
                    }
                    chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
                }
                {
                    let s = lookUpTable(filtMeth, [
                        [0, "Adaptive"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown filter method");
                    }
                    chunk.innerNotes.push(`Filter method: ${s} (${filtMeth})`);
                }
                {
                    let s = lookUpTable(laceMeth, [
                        [0, "None"],
                        [1, "Adam7"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown interlace method");
                    }
                    chunk.innerNotes.push(`Interlace method: ${s} (${laceMeth})`);
                }
            }],
        ["iTXt", "International textual data", function (chunk, earlier) { }],
        ["pHYs", "Physical pixel dimensions", function (chunk, earlier) {
                if (chunk.data.length != 9) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const horzRes = readUint32(chunk.data, 0);
                const vertRes = readUint32(chunk.data, 4);
                const unit = chunk.data[8];
                chunk.innerNotes.push(`Horizontal resolution: ${horzRes} pixels per unit${unit == 1 ? " (\u2248 " + (horzRes * 0.0254).toFixed(0) + " DPI)" : ""}`);
                chunk.innerNotes.push(`Vertical resolution: ${vertRes} pixels per unit${unit == 1 ? " (\u2248 " + (vertRes * 0.0254).toFixed(0) + " DPI)" : ""}`);
                {
                    let s = lookUpTable(unit, [
                        [0, "Arbitrary (aspect ratio only)"],
                        [1, "Metre"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown unit specifier");
                    }
                    chunk.innerNotes.push(`Unit specifier: ${s} (${unit})`);
                }
            }],
        ["PLTE", "Palette", function (chunk, earlier) { }],
        ["sBIT", "Significant bits", function (chunk, earlier) {
                if (chunk.data.length == 0 || chunk.data.length > 4)
                    chunk.errorNotes.push("Invalid data length");
                let temp = [];
                for (let i = 0; i < chunk.data.length; i++)
                    temp.push(chunk.data[i].toString());
                chunk.innerNotes.push(`Significant bits per channel: ${temp.join(", ")}`);
            }],
        ["sPLT", "Suggested palette", function (chunk, earlier) { }],
        ["sRGB", "Standard RGB color space", function (chunk, earlier) {
                if (chunk.data.length != 1) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const renderIntent = chunk.data[0];
                let s = lookUpTable(renderIntent, [
                    [0, "Perceptual"],
                    [1, "Relative colorimetric"],
                    [2, "Saturation"],
                    [3, "Absolute colorimetric"],
                ]);
                if (s === null) {
                    s = "Unknown";
                    chunk.errorNotes.push("Unknown rendering intent");
                }
                chunk.innerNotes.push(`Rendering intent: ${s} (${renderIntent})`);
            }],
        ["tEXt", "Textual data", function (chunk, earlier) { }],
        ["tIME", "Image last-modification time", function (chunk, earlier) {
                if (chunk.data.length != 7) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const year = readUint16(chunk.data, 0);
                const month = chunk.data[2];
                const day = chunk.data[3];
                const hour = chunk.data[4];
                const minute = chunk.data[5];
                const second = chunk.data[6];
                chunk.innerNotes.push(`Year: ${year}`);
                chunk.innerNotes.push(`Month: ${month}`);
                chunk.innerNotes.push(`Day: ${day}`);
                chunk.innerNotes.push(`Hour: ${hour}`);
                chunk.innerNotes.push(`Minute: ${minute}`);
                chunk.innerNotes.push(`Second: ${second}`);
            }],
        ["tRNS", "Transparency", function (chunk, earlier) { }],
        ["zTXt", "Compressed textual data", function (chunk, earlier) { }],
    ];
    function calcCrc32(bytes) {
        let crc = ~0;
        for (const b of bytes) {
            for (let i = 0; i < 8; i++) {
                crc ^= (b >>> i) & 1;
                crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
            }
        }
        return ~crc >>> 0;
    }
    function bytesToReadableString(bytes) {
        let result = "";
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            let cc = b;
            if (b < 0x20)
                cc += 0x2400;
            else if (b == 0x7F)
                cc = 0x2421;
            else if (0x80 <= b && b < 0xA0)
                cc = 0x25AF;
            result += String.fromCharCode(cc);
        }
        return result;
    }
    function uintToStrWithThousandsSeparators(val) {
        if (val < 0 || Math.floor(val) != val)
            throw "Invalid unsigned integer";
        let result = val.toString();
        for (let i = result.length - 3; i > 0; i -= 3)
            result = result.substring(0, i) + "\u00A0" + result.substring(i);
        return result;
    }
    function appendElem(container, tagName, text) {
        let result = document.createElement(tagName);
        container.appendChild(result);
        if (text !== undefined)
            result.textContent = text;
        return result;
    }
    function lookUpTable(key, table) {
        let result = null;
        for (const [k, v] of table) {
            if (k == key) {
                if (result !== null)
                    throw "Table has duplicate keys";
                result = v;
            }
        }
        return result;
    }
    function readUint16(bytes, offset) {
        if (bytes.length - offset < 2)
            throw "Index out of range";
        return bytes[offset + 0] << 8
            | bytes[offset + 1] << 0;
    }
    function readUint32(bytes, offset) {
        if (bytes.length - offset < 4)
            throw "Index out of range";
        return (bytes[offset + 0] << 24
            | bytes[offset + 1] << 16
            | bytes[offset + 2] << 8
            | bytes[offset + 3] << 0) >>> 0;
    }
    function requireType(val, type) {
        if (val instanceof type)
            return val;
        else
            throw "Invalid value type";
    }
})(app || (app = {}));
