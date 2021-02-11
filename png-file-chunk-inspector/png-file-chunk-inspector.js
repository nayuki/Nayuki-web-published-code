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
        constructor(name) {
            this.name = name;
            this.data = [];
            this.errors = [];
        }
    }
    let tbody = requireType(document.querySelector("article tbody"), HTMLElement);
    function parseFile(fileBytes) {
        while (tbody.firstChild !== null)
            tbody.removeChild(tbody.firstChild);
        let offset = 0;
        {
            const chunk = fileBytes.slice(offset, Math.min(offset + SIGNATURE_LENGTH, fileBytes.length));
            const [dec, valid] = parseFileSignature(chunk);
            appendRow(0, chunk, null, dec);
            offset += chunk.length;
            if (!valid) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                let dec = new DecodedChunk("Unsupported");
                dec.errors.push("Unsupported format");
                appendRow(offset, chunk, null, dec);
                offset += chunk.length;
                return;
            }
        }
        function renderProperties(typeCode) {
            let result = document.createDocumentFragment();
            result.appendChild(document.createTextNode("Properties:"));
            let ul = appendElem(result, "ul");
            appendElem(ul, "li", ((typeCode[0] & 0x20) == 0 ? "Critical (0)" : "Ancillary (1)"));
            appendElem(ul, "li", ((typeCode[1] & 0x20) == 0 ? "Public (0)" : "Private (1)"));
            appendElem(ul, "li", ((typeCode[2] & 0x20) == 0 ? "Reserved (0)" : "Unsupported (1)"));
            appendElem(ul, "li", ((typeCode[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)"));
            return result;
        }
        while (offset < fileBytes.length) {
            const remain = fileBytes.length - offset;
            let typeCodeStr = null;
            if (remain < 4) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                let dec = new DecodedChunk("Unfinished");
                dec.errors.push("Premature EOF");
                appendRow(offset, chunk, typeCodeStr, dec);
                break;
            }
            const dataLen = (fileBytes[offset + 0] << 24
                | fileBytes[offset + 1] << 16
                | fileBytes[offset + 2] << 8
                | fileBytes[offset + 3] << 0) >>> 0;
            let typeCodeProps = null;
            if (remain >= 8) {
                const typeCodeBytes = fileBytes.slice(offset + 4, offset + 8);
                typeCodeStr = bytesToReadableString(typeCodeBytes);
                typeCodeProps = renderProperties(typeCodeBytes);
            }
            if (dataLen >= 0x80000000) {
                const chunk = fileBytes.slice(offset, Math.min(offset + 8, fileBytes.length));
                let dec = new DecodedChunk("Invalid");
                dec.data.splice(0, 0, `Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
                if (typeCodeProps !== null)
                    dec.data.push(typeCodeProps);
                dec.errors.push("Length out of range");
                appendRow(offset, chunk, typeCodeStr, dec);
                break;
            }
            if (remain < 12 + dataLen) {
                const chunk = fileBytes.slice(offset, fileBytes.length);
                let dec = new DecodedChunk("Unfinished");
                dec.data.splice(0, 0, `Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
                if (typeCodeProps !== null)
                    dec.data.push(typeCodeProps);
                dec.errors.push("Premature EOF");
                appendRow(offset, chunk, typeCodeStr, dec);
                break;
            }
            const chunk = fileBytes.slice(offset, offset + 12 + dataLen);
            const storedCrc = (chunk[chunk.length - 4] << 24
                | chunk[chunk.length - 3] << 16
                | chunk[chunk.length - 2] << 8
                | chunk[chunk.length - 1] << 0) >>> 0;
            const dataCrc = calcCrc32(chunk.slice(4, chunk.length - 4));
            if (dataCrc != storedCrc) {
                let dec = new DecodedChunk("Invalid");
                dec.data.push(`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
                dec.data.push(requireType(typeCodeProps, Node));
                dec.data.push(`CRC-32: ${storedCrc.toString(16).padStart(8, "0").toUpperCase()}`);
                dec.errors.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8, "0").toUpperCase()})`);
                appendRow(offset, chunk, typeCodeStr, dec);
                break;
            }
            const data = chunk.slice(8, chunk.length - 4);
            let dec;
            switch (typeCodeStr) {
                case "IDAT":
                    dec = parse_IDAT_Chunk(data);
                    break;
                case "IEND":
                    dec = parse_IEND_Chunk(data);
                    break;
                case "IHDR":
                    dec = parse_IHDR_Chunk(data);
                    break;
                case "pHYs":
                    dec = parse_pHYs_Chunk(data);
                    break;
                default:
                    dec = new DecodedChunk("Unknown");
                    break;
            }
            dec.data.splice(0, 0, `Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`, requireType(typeCodeProps, Node));
            dec.data.push(`CRC-32: ${storedCrc.toString(16).padStart(8, "0").toUpperCase()}`);
            appendRow(offset, chunk, typeCodeStr, dec);
            offset += chunk.length;
        }
    }
    function appendRow(startOffset, rawBytes, chunkTypeCode, decodedChunk) {
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
        appendElem(tr, "td", decodedChunk.name + (chunkTypeCode != null ? ` (${chunkTypeCode})` : ""));
        {
            let td = appendElem(tr, "td");
            let ul = appendElem(td, "ul");
            decodedChunk.data.forEach(item => {
                let li = appendElem(ul, "li");
                if (typeof item == "string")
                    li.textContent = item;
                else if (item instanceof Node)
                    li.appendChild(item);
                else
                    throw "Assertion error";
            });
        }
        {
            let td = appendElem(tr, "td");
            let ul = appendElem(td, "ul");
            decodedChunk.errors.forEach(item => {
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
        let dec = new DecodedChunk("File signature");
        let valid = true;
        const expected = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        for (let i = 0; valid && i < expected.length; i++) {
            if (i >= bytes.length) {
                dec.errors.push("Premature EOF");
                valid = false;
            }
            else if (bytes[i] != expected[i]) {
                dec.errors.push("Value mismatch");
                valid = false;
            }
        }
        dec.data.push(`\u201C${bytesToReadableString(bytes)}\u201D`);
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
    function parse_IDAT_Chunk(data) {
        return new DecodedChunk("Image data");
    }
    function parse_IEND_Chunk(data) {
        return new DecodedChunk("Image trailer");
    }
    function parse_IHDR_Chunk(data) {
        return new DecodedChunk("Image header");
    }
    function parse_pHYs_Chunk(data) {
        return new DecodedChunk("Physical pixel dimensions");
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
    function requireType(val, type) {
        if (val instanceof type)
            return val;
        else
            throw "Invalid value type";
    }
})(app || (app = {}));
