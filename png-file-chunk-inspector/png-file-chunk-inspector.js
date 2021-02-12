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
                parseFile(new Uint8Array(bytes));
            };
            reader.readAsArrayBuffer(files[0]);
        };
    }
    setTimeout(initialize);
    class DecodedChunk {
        constructor() {
            this.data = [];
            this.errors = [];
        }
    }
    let table = requireType(document.querySelector("article table"), HTMLElement);
    let tbody = requireType(table.querySelector("tbody"), HTMLElement);
    function parseFile(fileBytes) {
        table.classList.remove("errors");
        while (tbody.firstChild !== null)
            tbody.removeChild(tbody.firstChild);
        let offset = 0;
        {
            const chunk = fileBytes.slice(offset, Math.min(offset + SIGNATURE_LENGTH, fileBytes.length));
            const [dec, valid] = parseFileSignature(chunk);
            appendRow(0, chunk, ["Special: File signature", `Length: ${uintToStrWithThousandsSeparators(chunk.length)} bytes`], dec);
            offset += chunk.length;
            if (!valid) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                let dec = new DecodedChunk();
                dec.errors.push("Unknown format");
                appendRow(offset, chunk, ["Special: Unknown", `Length: ${uintToStrWithThousandsSeparators(chunk.length)} bytes`], dec);
                offset += chunk.length;
                return;
            }
        }
        while (offset < fileBytes.length) {
            const remain = fileBytes.length - offset;
            let chunkOutside = [];
            let dec = new DecodedChunk();
            if (remain < 12) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                chunkOutside.push("Special: Unfinished");
                dec.errors.push("Premature EOF");
                appendRow(offset, chunk, chunkOutside, dec);
                break;
            }
            const typeCodeBytes = fileBytes.slice(offset + 4, offset + 8);
            const typeCodeStr = bytesToReadableString(typeCodeBytes);
            const typeNameAndFunc = CHUNK_TYPES.get(typeCodeStr);
            chunkOutside.push("Name: " + (typeNameAndFunc !== undefined ? typeNameAndFunc[0] : "Unknown"));
            chunkOutside.push("Type code: " + typeCodeStr);
            chunkOutside.push((typeCodeBytes[0] & 0x20) == 0 ? "Critical (0)" : "Ancillary (1)");
            chunkOutside.push((typeCodeBytes[1] & 0x20) == 0 ? "Public (0)" : "Private (1)");
            chunkOutside.push((typeCodeBytes[2] & 0x20) == 0 ? "Reserved (0)" : "Unknown (1)");
            chunkOutside.push((typeCodeBytes[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)");
            const dataLen = readUint32(fileBytes, offset);
            chunkOutside.push(`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
            if (dataLen > 0x80000000) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                dec.errors.push("Length out of range");
                appendRow(offset, chunk, chunkOutside, dec);
                break;
            }
            if (remain < 12 + dataLen) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                dec.errors.push("Premature EOF");
                appendRow(offset, chunk, chunkOutside, dec);
                break;
            }
            const chunk = fileBytes.slice(offset, offset + 12 + dataLen);
            const storedCrc = readUint32(chunk, chunk.length - 4);
            chunkOutside.push(`CRC-32: ${storedCrc.toString(16).padStart(8, "0").toUpperCase()}`);
            const dataCrc = calcCrc32(chunk.slice(4, chunk.length - 4));
            if (dataCrc != storedCrc) {
                dec.errors.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8, "0").toUpperCase()})`);
                appendRow(offset, chunk, chunkOutside, dec);
            }
            else {
                const data = chunk.slice(8, chunk.length - 4);
                if (typeNameAndFunc !== undefined)
                    typeNameAndFunc[1](data, dec);
                appendRow(offset, chunk, chunkOutside, dec);
            }
            offset += chunk.length;
        }
    }
    function appendRow(startOffset, rawBytes, chunkOutside, decodedChunk) {
        let tr = appendElem(tbody, "tr");
        appendElem(tr, "td", uintToStrWithThousandsSeparators(startOffset));
        {
            let td = appendElem(tr, "td");
            let hex = [];
            if (rawBytes.length <= 100) {
                for (let i = 0; i < rawBytes.length; i++)
                    hex.push(rawBytes[i].toString(16).padStart(2, "0"));
            }
            else {
                for (let i = 0; i < 70; i++)
                    hex.push(rawBytes[i].toString(16).padStart(2, "0"));
                hex.push("...");
                for (let i = rawBytes.length - 30; i < rawBytes.length; i++)
                    hex.push(rawBytes[i].toString(16).padStart(2, "0"));
            }
            appendElem(td, "code", hex.join(" "));
        }
        for (const list of [chunkOutside, decodedChunk.data, decodedChunk.errors]) {
            let td = appendElem(tr, "td");
            let ul = appendElem(td, "ul");
            list.forEach(item => {
                if (list == decodedChunk.errors)
                    table.classList.add("errors");
                let li = appendElem(ul, "li");
                if (typeof item == "string")
                    li.textContent = item;
                else if (item instanceof Node)
                    li.appendChild(item);
                else
                    throw "Assertion error";
            });
        }
    }
    const SIGNATURE_LENGTH = 8;
    function parseFileSignature(bytes) {
        let dec = new DecodedChunk();
        dec.data.push(`\u201C${bytesToReadableString(bytes)}\u201D`);
        const EXPECTED = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        let valid = true;
        for (let i = 0; valid && i < EXPECTED.length; i++) {
            if (i >= bytes.length) {
                dec.errors.push("Premature EOF");
                valid = false;
            }
            else if (bytes[i] != EXPECTED[i]) {
                dec.errors.push("Value mismatch");
                valid = false;
            }
        }
        return [dec, valid];
    }
    function calcCrc32(bytes) {
        let crc = ~0;
        for (let i = 0; i < bytes.length; i++) {
            for (let b = bytes[i], j = 0; j < 8; j++) {
                crc ^= (b >>> j) & 1;
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
    let CHUNK_TYPES = new Map();
    CHUNK_TYPES.set("bKGD", ["Background color", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("cHRM", ["Primary chromaticities", function (bytes, dec) {
            if (bytes.length != 32) {
                dec.errors.push("Invalid data length");
                return;
            }
            let offset = 0;
            for (const item of ["White point", "Red", "Green", "Blue"]) {
                for (const axis of ["x", "y"]) {
                    const val = readUint32(bytes, offset);
                    let s = val.toString().padStart(6, "0");
                    s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
                    // s basically equals (val/100000).toFixed(5)
                    dec.data.push(`${item} ${axis}: ${s}`);
                    offset += 4;
                }
            }
        }]);
    CHUNK_TYPES.set("gAMA", ["Image gamma", function (bytes, dec) {
            if (bytes.length != 4) {
                dec.errors.push("Invalid data length");
                return;
            }
            const gamma = readUint32(bytes, 0);
            let s = gamma.toString().padStart(6, "0");
            s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
            // s basically equals (gamma/100000).toFixed(5)
            dec.data.push(`Gamma: ${s}`);
        }]);
    CHUNK_TYPES.set("hIST", ["Palette histogram", function (bytes, dec) {
            if (bytes.length % 2 != 0 || bytes.length / 2 > 256) {
                dec.errors.push("Invalid data length");
                return;
            }
        }]);
    CHUNK_TYPES.set("iCCP", ["Embedded ICC profile", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("IDAT", ["Image data", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("IEND", ["Image trailer", function (bytes, dec) {
            if (bytes.length != 0)
                dec.errors.push("Non-empty data");
        }]);
    CHUNK_TYPES.set("IHDR", ["Image header", function (bytes, dec) {
            if (bytes.length != 13) {
                dec.errors.push("Invalid data length");
                return;
            }
            const width = readUint32(bytes, 0);
            const height = readUint32(bytes, 4);
            const bitDepth = bytes[8];
            const colorType = bytes[9];
            const compMeth = bytes[10];
            const filtMeth = bytes[11];
            const laceMeth = bytes[12];
            dec.data.push(`Width: ${width} pixels`);
            if (width == 0 || width > 0x80000000)
                dec.errors.push("Width out of range");
            dec.data.push(`Height: ${height} pixels`);
            if (height == 0 || height > 0x80000000)
                dec.errors.push("Width out of range");
            let colorTypeStr;
            let validBitDepths;
            switch (colorType) {
                case 0:
                    colorTypeStr = "Grayscale";
                    validBitDepths = [1, 2, 4, 8, 16];
                    break;
                case 2:
                    colorTypeStr = "RGB";
                    validBitDepths = [8, 16];
                    break;
                case 3:
                    colorTypeStr = "Palette";
                    validBitDepths = [1, 2, 4, 8];
                    break;
                case 4:
                    colorTypeStr = "Grayscale+Alpha";
                    validBitDepths = [8, 16];
                    break;
                case 6:
                    colorTypeStr = "RGBA";
                    validBitDepths = [8, 16];
                    break;
                default:
                    colorTypeStr = "Unknown";
                    validBitDepths = [];
                    break;
            }
            dec.data.push(`Bit depth: ${bitDepth} bits per ${colorType != 3 ? "channel" : "pixel"}`);
            if (!validBitDepths.includes(bitDepth))
                dec.errors.push("Invalid bit depth");
            dec.data.push(`Color type: ${colorTypeStr} (${colorType})`);
            if (colorTypeStr == "Unknown")
                dec.errors.push("Unknown color type");
            if (compMeth == 0)
                dec.data.push(`Compression method: DEFLATE (${compMeth})`);
            else {
                dec.data.push(`Compression method: Unknown (${compMeth})`);
                dec.errors.push("Unknown compression method");
            }
            if (filtMeth == 0)
                dec.data.push(`Filter method: Adaptive (${filtMeth})`);
            else {
                dec.data.push(`Filter method: Unknown (${filtMeth})`);
                dec.errors.push("Unknown filter method");
            }
            if (laceMeth == 0)
                dec.data.push(`Interlace method: None (${laceMeth})`);
            else if (laceMeth == 1)
                dec.data.push(`Interlace method: Adam7 (${laceMeth})`);
            else {
                dec.data.push(`Interlace method: Unknown (${laceMeth})`);
                dec.errors.push("Unknown interlace method");
            }
        }]);
    CHUNK_TYPES.set("iTXt", ["International textual data", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("pHYs", ["Physical pixel dimensions", function (bytes, dec) {
            if (bytes.length != 9) {
                dec.errors.push("Invalid data length");
                return;
            }
            const horzRes = readUint32(bytes, 0);
            const vertRes = readUint32(bytes, 4);
            const unit = bytes[8];
            dec.data.push(`Horizontal resolution: ${horzRes} pixels per unit${unit == 1 ? " (\u2248 " + (horzRes * 0.0254).toFixed(0) + " DPI)" : ""}`);
            dec.data.push(`Vertical resolution: ${vertRes} pixels per unit${unit == 1 ? " (\u2248 " + (vertRes * 0.0254).toFixed(0) + " DPI)" : ""}`);
            if (unit == 0)
                dec.data.push(`Unit specifier: Arbitrary (aspect ratio only) (${unit})`);
            else if (unit == 1)
                dec.data.push(`Unit specifier: Metre (${unit})`);
            else {
                dec.data.push(`Unit specifier: Unknown (${unit})`);
                dec.errors.push("Unknown unit specifier");
            }
        }]);
    CHUNK_TYPES.set("PLTE", ["Palette", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("sBIT", ["Significant bits", function (bytes, dec) {
            if (bytes.length == 0 || bytes.length > 4)
                dec.errors.push("Invalid data length");
            let temp = [];
            for (let i = 0; i < bytes.length; i++)
                temp.push(bytes[i].toString());
            dec.data.push(`Significant bits per channel: ${temp.join(", ")}`);
        }]);
    CHUNK_TYPES.set("sPLT", ["Suggested palette", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("sRGB", ["Standard RGB color space", function (bytes, dec) {
            if (bytes.length != 1) {
                dec.errors.push("Invalid data length");
                return;
            }
            const renderIntent = bytes[0];
            let s;
            switch (renderIntent) {
                case 0:
                    s = "Perceptual";
                    break;
                case 1:
                    s = "Relative colorimetric";
                    break;
                case 2:
                    s = "Saturation";
                    break;
                case 3:
                    s = "Absolute colorimetric";
                    break;
                default:
                    s = "Unknown";
                    dec.errors.push("Unknown rendering intent");
                    break;
            }
            dec.data.push(`Rendering intent: ${s} (${renderIntent})`);
        }]);
    CHUNK_TYPES.set("tEXt", ["Textual data", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("tIME", ["Image last-modification time", function (bytes, dec) {
            if (bytes.length != 7) {
                dec.errors.push("Invalid data length");
                return;
            }
            const year = readUint16(bytes, 0);
            const month = bytes[2];
            const day = bytes[3];
            const hour = bytes[4];
            const minute = bytes[5];
            const second = bytes[6];
            dec.data.push(`Year: ${year}`);
            dec.data.push(`Month: ${month}`);
            dec.data.push(`Day: ${day}`);
            dec.data.push(`Hour: ${hour}`);
            dec.data.push(`Minute: ${minute}`);
            dec.data.push(`Second: ${second}`);
        }]);
    CHUNK_TYPES.set("tRNS", ["Transparency", function (bytes, dec) {
        }]);
    CHUNK_TYPES.set("zTXt", ["Compressed textual data", function (bytes, dec) {
        }]);
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
