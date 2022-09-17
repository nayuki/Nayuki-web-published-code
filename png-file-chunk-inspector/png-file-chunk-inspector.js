/*
 * PNG file chunk inspector (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/png-file-chunk-inspector
 */
"use strict";
var app;
(function (app) {
    /*---- Graphical user interface ----*/
    function initialize() {
        let selectElem = requireType(document.querySelector("article table#input select"), HTMLSelectElement);
        let fileElem = requireType(document.querySelector("article table#input input[type=file]"), HTMLInputElement);
        let ignoreSelect = false;
        let ignoreFile = false;
        selectElem.selectedIndex = 0;
        for (const [valid, topics, fileName] of SAMPLE_FILES) {
            const temp = topics.slice();
            temp.splice(1, 0, (valid ? "Good" : "Bad"));
            let option = requireType(appendElem(selectElem, "option", temp.join(" - ")), HTMLOptionElement);
            option.value = fileName;
        }
        let aElem = requireType(document.querySelector("article table#input a"), HTMLAnchorElement);
        selectElem.onchange = () => {
            if (ignoreSelect)
                return;
            else if (selectElem.selectedIndex == 0)
                aElem.style.display = "none";
            else {
                ignoreFile = true;
                fileElem.value = "";
                ignoreFile = false;
                const filePath = "/res/png-file-chunk-inspector/" + selectElem.value;
                aElem.style.removeProperty("display");
                aElem.href = filePath;
                let xhr = new XMLHttpRequest();
                xhr.onload = () => visualizeFile(xhr.response);
                xhr.open("GET", filePath);
                xhr.responseType = "arraybuffer";
                xhr.send();
            }
        };
        fileElem.onchange = () => {
            if (ignoreFile)
                return;
            ignoreSelect = true;
            selectElem.selectedIndex = 0;
            ignoreSelect = false;
            aElem.style.display = "none";
            const files = fileElem.files;
            if (files === null || files.length < 1)
                return;
            let reader = new FileReader();
            reader.onload = () => visualizeFile(reader.result);
            reader.readAsArrayBuffer(files[0]);
        };
    }
    setTimeout(initialize);
    function visualizeFile(fileArray) {
        const fileBytes = new Uint8Array(requireType(fileArray, ArrayBuffer));
        let table = requireType(document.querySelector("article table#output"), HTMLElement);
        table.classList.remove("errors");
        let tbody = requireType(table.querySelector("tbody"), HTMLElement);
        while (tbody.firstChild !== null)
            tbody.removeChild(tbody.firstChild);
        const parts = parseFile(fileBytes);
        let summary = "";
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part instanceof ChunkPart) {
                if (summary != "")
                    summary += ", ";
                summary += part.typeStr;
                if (part.typeStr == "IDAT") {
                    let count = 1;
                    for (; i + 1 < parts.length; i++, count++) {
                        const nextPart = parts[i + 1];
                        if (!(nextPart instanceof ChunkPart) || nextPart.typeStr != "IDAT")
                            break;
                    }
                    if (count > 1)
                        summary += " \u00D7" + count;
                }
            }
        }
        requireType(document.querySelector("article span#summary"), HTMLElement).textContent = summary;
        for (const part of parts) {
            let tr = appendElem(tbody, "tr");
            appendElem(tr, "td", uintToStrWithThousandsSeparators(part.offset));
            {
                let td = appendElem(tr, "td");
                let hex = [];
                const bytes = part.bytes;
                const pushHex = function (index) {
                    hex.push(bytes[index].toString(16).padStart(2, "0"));
                };
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
                    li.append(item);
                }
            }
        }
    }
    const SAMPLE_FILES = [
        [true, ["Normal", "One black pixel"], "good_normal_one-black-pixel.png"],
        [true, ["Normal", "One black pixel", "Paletted"], "good_normal_one-black-pixel_paletted.png"],
        [true, ["Normal", "Tiny RGB gray"], "good_normal_tiny-rgb-gray.png"],
        [false, ["Signature", "Empty"], "bad_signature_empty.png"],
        [false, ["Signature", "Mismatch, truncated"], "bad_signature_mismatch-truncated.png"],
        [false, ["Signature", "Mismatch"], "bad_signature_mismatch.png"],
        [false, ["Signature", "Truncated"], "bad_signature_truncated.png"],
        [false, ["Chunks", "Empty"], "bad_chunks_empty.png"],
        [false, ["Chunk", "Length", "Truncated"], "bad_chunk_length_truncated.png"],
        [false, ["Chunk", "Length", "Overflow"], "bad_chunk_length_overflow.png"],
        [false, ["Chunk", "Type", "Truncated"], "bad_chunk_type_truncated.png"],
        [false, ["Chunk", "Type", "Wrong characters"], "bad_chunk_type_wrong-characters.png"],
        [false, ["Chunk", "Data", "Truncated"], "bad_chunk_data_truncated.png"],
        [false, ["Chunk", "CRC", "Truncated"], "bad_chunk_crc_truncated.png"],
        [false, ["Chunk", "CRC", "Mismatch"], "bad_chunk_crc_mismatch.png"],
        [true, ["bKGD", "Sans palette"], "good_bkgd_sans-palette.png"],
        [true, ["bKGD", "With palette"], "good_bkgd_with-palette.png"],
        [false, ["bKGD", "Wrong length"], "bad_bkgd_wrong-length.png"],
        [false, ["bKGD", "Wrong color"], "bad_bkgd_wrong-color.png"],
        [false, ["bKGD", "Wrong index"], "bad_bkgd_wrong-index.png"],
        [true, ["cHRM", "Rec. 709"], "good_chrm_rec-709.png"],
        [true, ["cHRM", "Rec. 2020"], "good_chrm_rec-2020.png"],
        [false, ["cHRM", "Wrong length"], "bad_chrm_wrong-length.png"],
        [true, ["gAMA", "0.45455"], "good_gama_0.45455.png"],
        [true, ["gAMA", "1.00000"], "good_gama_1.00000.png"],
        [false, ["gAMA", "Misordered"], "bad_gama_misordered.png"],
        [true, ["hIST"], "good_hist.png"],
        [false, ["hIST", "Wrong length"], "bad_hist_wrong-length.png"],
        [true, ["IDAT", "Multiple"], "good_idat_multiple.png"],
        [true, ["IDAT", "Some empty"], "good_idat_some-empty.png"],
        [false, ["IDAT", "Non-consecutive"], "bad_idat_nonconsecutive.png"],
        [false, ["IHDR", "Wrong length"], "bad_ihdr_wrong-length.png"],
        [false, ["IHDR", "Wrong dimensions"], "bad_ihdr_wrong-dimensions.png"],
        [false, ["IHDR", "Wrong bit depth"], "bad_ihdr_wrong-bit-depth.png"],
        [false, ["IHDR", "Wrong methods"], "bad_ihdr_wrong-methods.png"],
        [true, ["iTXt"], "good_itxt.png"],
        [false, ["iTXt", "Wrong separators"], "bad_itxt_wrong-separators.png"],
        [false, ["iTXt", "Wrong UTF-8"], "bad_itxt_wrong-utf8.png"],
        [false, ["iTXt", "Wrong compression methods"], "bad_itxt_wrong-compression-methods.png"],
        [false, ["iTXt", "Wrong compressed data"], "bad_itxt_wrong-compressed-data.png"],
        [true, ["oFFs", "Micrometre unit"], "good_offs_micrometre-unit.png"],
        [true, ["oFFs", "Pixel unit"], "good_offs_pixel-unit.png"],
        [false, ["oFFs", "Wrong length"], "bad_offs_wrong-length.png"],
        [false, ["oFFs", "Wrong unit"], "bad_offs_wrong-unit.png"],
        [true, ["pHYs", "96 DPI"], "good_phys_96-dpi.png"],
        [true, ["pHYs", "Horizontal stretch"], "good_phys_horizontal-stretch.png"],
        [false, ["pHYs", "Wrong unit"], "bad_phys_wrong-unit.png"],
        [true, ["sBIT"], "good_sbit.png"],
        [false, ["sBIT", "Zero"], "bad_sbit_zero.png"],
        [false, ["sBIT", "Excess"], "bad_sbit_excess.png"],
        [true, ["sPLT"], "good_splt.png"],
        [false, ["sPLT", "Wrong names"], "bad_splt_wrong-names.png"],
        [false, ["sPLT", "Duplicate name"], "bad_splt_duplicate-name.png"],
        [false, ["sPLT", "Wrong bit depth"], "bad_splt_wrong-bit-depth.png"],
        [false, ["sPLT", "Wrong length"], "bad_splt_wrong-length.png"],
        [true, ["sRGB"], "good_srgb.png"],
        [false, ["sRGB", "Wrong length"], "bad_srgb_wrong-length.png"],
        [false, ["sRGB", "Duplicate"], "bad_srgb_duplicate.png"],
        [false, ["sRGB", "Misordered"], "bad_srgb_misordered.png"],
        [true, ["sTER"], "good_ster.png"],
        [false, ["sTER", "Wrong length"], "bad_ster_wrong-length.png"],
        [true, ["tEXt"], "good_text.png"],
        [false, ["tEXt", "Wrong keywords"], "bad_text_wrong-keywords.png"],
        [false, ["tEXt", "Wrong text"], "bad_text_wrong-text.png"],
        [true, ["tIME", "Leap second"], "good_time_leap-second.png"],
        [true, ["tIME", "Unix epoch"], "good_time_unix-epoch.png"],
        [false, ["tIME", "Wrong length"], "bad_time_wrong-length.png"],
        [false, ["tIME", "Wrong fields"], "bad_time_wrong-fields.png"],
        [false, ["tIME", "Wrong day"], "bad_time_wrong-day.png"],
        [false, ["tIME", "Misordered"], "bad_time_misordered.png"],
        [true, ["tRNS", "Sans palette"], "good_trns_sans-palette.png"],
        [true, ["tRNS", "With palette"], "good_trns_with-palette.png"],
        [false, ["tRNS", "Wrong color"], "bad_trns_wrong-color.png"],
        [false, ["tRNS", "Wrong length"], "bad_trns_wrong-length.png"],
        [true, ["zTXt"], "good_ztxt.png"],
        [false, ["zTXt", "Wrong keywords"], "bad_ztxt_wrong-keywords.png"],
        [false, ["zTXt", "Wrong compression methods"], "bad_ztxt_wrong-compression-methods.png"],
        [false, ["zTXt", "Wrong compressed data"], "bad_ztxt_wrong-compressed-data.png"],
    ];
    /*---- PNG file parser ----*/
    function parseFile(fileBytes) {
        let result = [];
        let isSignatureValid;
        let offset = 0;
        { // Parse file signature
            const bytes = fileBytes.subarray(offset, Math.min(offset + SignaturePart.FILE_SIGNATURE.length, fileBytes.length));
            const part = new SignaturePart(offset, bytes);
            result.push(part);
            isSignatureValid = part.errorNotes.length == 0;
            offset += bytes.length;
        }
        if (!isSignatureValid && offset < fileBytes.length) {
            const bytes = fileBytes.subarray(offset, fileBytes.length);
            let part = new UnknownPart(offset, bytes);
            part.errorNotes.push("Unknown format");
            result.push(part);
            offset += bytes.length;
        }
        else if (isSignatureValid) {
            // Parse chunks but carefully handle erroneous file structures
            while (offset < fileBytes.length) {
                // Begin by assuming that the next chunk is invalid
                let bytes = fileBytes.subarray(offset, fileBytes.length);
                const remain = bytes.length;
                if (remain >= 4) {
                    const innerLen = readUint32(fileBytes, offset);
                    const outerLen = innerLen + 12;
                    if (innerLen <= ChunkPart.MAX_DATA_LENGTH && outerLen <= remain)
                        bytes = fileBytes.subarray(offset, offset + outerLen); // Chunk is now valid with respect to length
                }
                result.push(new ChunkPart(offset, bytes));
                offset += bytes.length;
            }
            // Annotate chunks
            let earlierChunks = [];
            let earlierTypes = new Set();
            for (const part of result) {
                if (!(part instanceof ChunkPart))
                    continue;
                const type = part.typeStr;
                if (type != "IHDR" && type != "" && !earlierTypes.has("IHDR"))
                    part.errorNotes.push("Chunk must be after IHDR chunk");
                if (type != "IEND" && type != "" && earlierTypes.has("IEND"))
                    part.errorNotes.push("Chunk must be before IEND chunk");
                const typeInfo = part.getTypeInfo();
                if (typeInfo !== null && !typeInfo[1] && earlierTypes.has(type))
                    part.errorNotes.push("Multiple chunks of this type disallowed");
                part.annotate(earlierChunks);
                earlierChunks.push(part);
                earlierTypes.add(type);
            }
            { // Find, pair up, and annotate dSIG chunks
                let ihdrIndex = 0;
                while (ihdrIndex < result.length && (!(result[ihdrIndex] instanceof ChunkPart) || result[ihdrIndex].typeStr != "IHDR"))
                    ihdrIndex++;
                let iendIndex = 0;
                while (iendIndex < result.length && (!(result[iendIndex] instanceof ChunkPart) || result[iendIndex].typeStr != "IEND"))
                    iendIndex++;
                let processedDsigs = new Set();
                if (ihdrIndex < result.length && iendIndex < result.length) {
                    let start = ihdrIndex + 1;
                    let end = iendIndex - 1;
                    for (; start < end; start++, end--) {
                        const startPart = result[start];
                        const endPart = result[end];
                        if (!(startPart instanceof ChunkPart && startPart.typeStr == "dSIG" &&
                            endPart instanceof ChunkPart && endPart.typeStr == "dSIG"))
                            break;
                        startPart.innerNotes.push("Introductory");
                        endPart.innerNotes.push("Terminating");
                        processedDsigs.add(startPart);
                        processedDsigs.add(endPart);
                    }
                    for (; start < end; start++) {
                        const part = result[start];
                        if (!(part instanceof ChunkPart && part.typeStr == "dSIG"))
                            break;
                        part.innerNotes.push("Introductory");
                        part.errorNotes.push("Missing corresponding terminating dSIG chunk");
                    }
                    for (; start < end; end--) {
                        const part = result[start];
                        if (!(part instanceof ChunkPart && part.typeStr == "dSIG"))
                            break;
                        part.innerNotes.push("Terminating");
                        part.errorNotes.push("Missing corresponding introductory dSIG chunk");
                    }
                }
                for (const part of result) {
                    if (part instanceof ChunkPart && part.typeStr == "dSIG" && !processedDsigs.has(part))
                        part.errorNotes.push("Chunk must be consecutively after IHDR chunk or consecutively before IEND chunk");
                }
            }
            let part = new UnknownPart(offset, new Uint8Array());
            const ihdr = ChunkPart.getValidIhdrData(earlierChunks);
            if (!earlierTypes.has("IHDR"))
                part.errorNotes.push("Missing IHDR chunk");
            if (ihdr !== null && ihdr[9] == 3 && !earlierTypes.has("PLTE"))
                part.errorNotes.push("Missing PLTE chunk");
            if (!earlierTypes.has("IDAT"))
                part.errorNotes.push("Missing IDAT chunk");
            if (!earlierTypes.has("IEND"))
                part.errorNotes.push("Missing IEND chunk");
            if (part.errorNotes.length > 0)
                result.push(part);
        }
        if (offset != fileBytes.length)
            throw new Error("Assertion error");
        return result;
    }
    /*---- Classes representing different file parts ----*/
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
        }
    }
    class ChunkPart extends FilePart {
        constructor(offset, bytes) {
            super(offset, bytes);
            this.typeStr = "";
            this.isDataComplete = false;
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
                this.outerNotes.push("Type: Unfinished");
                return;
            }
            {
                const typeBytes = bytes.subarray(4, 8);
                this.typeStr = bytesToReadableString(typeBytes);
                this.outerNotes.push("Type: " + this.typeStr);
                if (!/^[A-Za-z]{4}$/.test(this.typeStr))
                    this.errorNotes.push("Type contains non-alphabetic characters");
                const typeInfo = this.getTypeInfo();
                const typeName = typeInfo !== null ? typeInfo[0] : "Unknown";
                this.outerNotes.push("Name: " + typeName, (typeBytes[0] & 0x20) == 0 ? "Critical (0)" : "Ancillary (1)", (typeBytes[1] & 0x20) == 0 ? "Public (0)" : "Private (1)", (typeBytes[2] & 0x20) == 0 ? "Reserved (0)" : "Unknown (1)", (typeBytes[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)");
            }
            if (dataLen > ChunkPart.MAX_DATA_LENGTH)
                return;
            if (bytes.length < dataLen + 12)
                this.outerNotes.push("CRC-32: Unfinished");
            else {
                const storedCrc = readUint32(bytes, bytes.length - 4);
                this.outerNotes.push(`CRC-32: ${storedCrc.toString(16).padStart(8, "0").toUpperCase()}`);
                const dataCrc = calcCrc32(bytes.subarray(4, bytes.length - 4));
                if (dataCrc != storedCrc)
                    this.errorNotes.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8, "0").toUpperCase()})`);
            }
            this.isDataComplete = 8 + dataLen <= bytes.length;
            this.data = bytes.subarray(8, Math.min(8 + dataLen, bytes.length));
        }
        annotate(earlierChunks) {
            if (this.innerNotes.length > 0)
                throw new Error("Already annotated");
            if (!this.isDataComplete)
                return;
            const temp = this.getTypeInfo();
            if (temp !== null)
                temp[2](this, earlierChunks);
        }
        getTypeInfo() {
            let result = null;
            for (const [type, name, multiple, func] of ChunkPart.TYPE_HANDLERS) {
                if (type == this.typeStr) {
                    if (result !== null)
                        throw new Error("Table has duplicate keys");
                    result = [name, multiple, func];
                }
            }
            return result;
        }
        /*---- Helper functions ----*/
        static getValidIhdrData(chunks) {
            let result = null;
            let count = 0;
            for (const chunk of chunks) {
                if (chunk.typeStr == "IHDR") {
                    count++;
                    if (chunk.data.length == 13)
                        result = chunk.data;
                }
            }
            if (count != 1)
                result = null;
            return result;
        }
        static getValidPlteNumEntries(chunks) {
            let result = null;
            let count = 0;
            for (const chunk of chunks) {
                if (chunk.typeStr == "PLTE") {
                    count++;
                    if (chunk.data.length % 3 == 0) {
                        const numEntries = chunk.data.length / 3;
                        if (1 <= numEntries && numEntries <= 256)
                            result = numEntries;
                    }
                }
            }
            if (count != 1)
                result = null;
            return result;
        }
        static getSpltNames(chunks) {
            let result = new Set();
            for (const chunk of chunks) {
                if (chunk.typeStr == "sPLT") {
                    let data = [];
                    for (const b of chunk.data)
                        data.push(b);
                    const separatorIndex = data.indexOf(0);
                    if (separatorIndex != -1)
                        data = data.slice(0, separatorIndex);
                    result.add(decodeIso8859_1(data));
                }
            }
            return result;
        }
    }
    // The maximum length of a chunk's payload data, in bytes, inclusive.
    ChunkPart.MAX_DATA_LENGTH = 2147483647;
    /*---- Handlers and metadata for all known PNG chunk types ----*/
    ChunkPart.TYPE_HANDLERS = [
        ["bKGD", "Background color", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                const ihdr = ChunkPart.getValidIhdrData(earlier);
                if (ihdr === null)
                    return;
                const bitDepth = ihdr[8];
                const colorType = ihdr[9];
                if (colorType == 3) {
                    if (chunk.data.length != 1) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    const paletteIndex = chunk.data[0];
                    chunk.innerNotes.push(`Palette index: ${paletteIndex}`);
                    const plteNumEntries = ChunkPart.getValidPlteNumEntries(earlier);
                    if (plteNumEntries === null)
                        return;
                    if (paletteIndex >= plteNumEntries)
                        chunk.errorNotes.push("Color index out of range");
                }
                else {
                    if ((colorType == 0 || colorType == 4) && chunk.data.length != 2)
                        chunk.errorNotes.push("Invalid data length");
                    else if ((colorType == 2 || colorType == 6) && chunk.data.length != 6)
                        chunk.errorNotes.push("Invalid data length");
                    else {
                        if (colorType == 0 || colorType == 4)
                            chunk.innerNotes.push(`White: ${readUint16(chunk.data, 0)}`);
                        else if (colorType == 2 || colorType == 6) {
                            chunk.innerNotes.push(`Red: ${readUint16(chunk.data, 0)}`, `Green: ${readUint16(chunk.data, 2)}`, `Blue: ${readUint16(chunk.data, 4)}`);
                        }
                        for (let i = 0; i < chunk.data.length; i += 2) {
                            if (readUint16(chunk.data, i) >= (1 << bitDepth))
                                chunk.errorNotes.push("Color value out of range");
                        }
                    }
                }
            }],
        ["cHRM", "Primary chromaticities", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
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
        ["dSIG", "Digital signature", true, (chunk, earlier) => { }],
        ["eXIf", "Exchangeable Image File (Exif) Profile", false, (chunk, earlier) => { }],
        ["fRAc", "Fractal image parameters", true, (chunk, earlier) => { }],
        ["gAMA", "Image gamma", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
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
        ["gIFg", "GIF Graphic Control Extension", true, (chunk, earlier) => {
                if (chunk.data.length != 4) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const disposalMethod = chunk.data[0];
                const userInputFlag = chunk.data[1];
                const delayTime = readUint16(chunk.data, 2);
                chunk.innerNotes.push(`Disposal method: ${disposalMethod}`);
                chunk.innerNotes.push(`User input flag: ${userInputFlag}`);
                let s = delayTime.toString().padStart(3, "0");
                s = s.substring(0, s.length - 2) + "." + s.substring(s.length - 2);
                // s basically equals (delayTime/100).toFixed(2)
                chunk.innerNotes.push(`Delay time: ${s} s`);
            }],
        ["gIFt", "GIF Plain Text Extension", true, (chunk, earlier) => {
                if (chunk.data.length < 24) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const gridLeft = readInt32(chunk.data, 0);
                const gridTop = readInt32(chunk.data, 4);
                const gridWidth = readInt32(chunk.data, 8);
                const gridHeight = readInt32(chunk.data, 12);
                const cellWidth = chunk.data[16];
                const cellHeight = chunk.data[17];
                const foregroundColor = chunk.data[18] << 16 | chunk.data[19] << 8 | chunk.data[20] << 0;
                const backgroundColor = chunk.data[21] << 16 | chunk.data[22] << 8 | chunk.data[23] << 0;
                const text = bytesToReadableString(chunk.data.subarray(24));
                chunk.innerNotes.push(`Deprecated`, `Text grid left position: ${gridLeft}`, `Text grid top position: ${gridTop}`, `Text grid width: ${gridWidth}`, `Text grid height: ${gridHeight}`, `Character cell width: ${cellWidth}`, `Character cell height: ${cellHeight}`, `Text foreground color: #${foregroundColor.toString(16).padStart(2, "0")}`, `Text background color: #${backgroundColor.toString(16).padStart(2, "0")}`, `Plain text data: ${text}`);
            }],
        ["gIFx", "GIF Application Extension", true, (chunk, earlier) => {
                if (chunk.data.length < 11) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                chunk.innerNotes.push(`Application identifier: ${bytesToReadableString(chunk.data.subarray(0, 8))}`);
                {
                    let hex = [];
                    for (let i = 0; i < 3; i++)
                        hex.push(chunk.data[8 + i].toString(16).padStart(2, "0"));
                    chunk.innerNotes.push(`Authentication code: ${hex.join(" ")}`);
                }
                {
                    let hex = [];
                    for (const b of chunk.data.subarray(11))
                        hex.push(b.toString(16).padStart(2, "0"));
                    chunk.innerNotes.push(`Application data: ${hex.join(" ")}`);
                }
            }],
        ["hIST", "Palette histogram", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                if (!earlier.some(ch => ch.typeStr == "PLTE"))
                    chunk.errorNotes.push("Chunk requires earlier PLTE chunk");
                if (chunk.data.length % 2 != 0) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const numEntries = chunk.data.length / 2;
                chunk.innerNotes.push(`Number of entries: ${numEntries}`);
                const plteNumEntries = ChunkPart.getValidPlteNumEntries(earlier);
                if (plteNumEntries === null)
                    return;
                if (numEntries != plteNumEntries)
                    chunk.errorNotes.push("Invalid data length");
            }],
        ["iCCP", "Embedded ICC profile", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                addErrorIfHasType(earlier, "sRGB", chunk, "Chunk should not exist because sRGB chunk exists");
            }],
        ["IDAT", "Image data", true, (chunk, earlier) => {
                if (earlier.length > 0 && earlier[earlier.length - 1].typeStr != "IDAT"
                    && earlier.some(ch => ch.typeStr == "IDAT")) {
                    chunk.errorNotes.push("Non-consecutive IDAT chunk");
                }
            }],
        ["IEND", "Image trailer", false, (chunk, earlier) => {
                if (chunk.data.length != 0)
                    chunk.errorNotes.push("Non-empty data");
            }],
        ["IHDR", "Image header", false, (chunk, earlier) => {
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
                if (width == 0 || width > 2147483647)
                    chunk.errorNotes.push("Width out of range");
                chunk.innerNotes.push(`Height: ${height} pixels`);
                if (height == 0 || height > 2147483647)
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
        ["iTXt", "International textual data", true, (chunk, earlier) => {
                let data = [];
                for (const b of chunk.data)
                    data.push(b);
                let dataIndex = 0;
                function parseNullTerminatedBytes() {
                    const nulIndex = data.indexOf(0, dataIndex);
                    if (nulIndex == -1)
                        return [false, data.slice(dataIndex)];
                    else {
                        const bytes = data.slice(dataIndex, nulIndex);
                        dataIndex = nulIndex + 1;
                        return [true, bytes];
                    }
                }
                let compFlag = null;
                let compMeth = null;
                loop: for (let state = 0; state < 6; state++) {
                    switch (state) {
                        case 0: {
                            const [found, bytes] = parseNullTerminatedBytes();
                            const keyword = decodeIso8859_1(bytes);
                            annotateTextKeyword(keyword, "Keyword", "keyword", chunk);
                            if (!found) {
                                chunk.errorNotes.push("Missing null separator");
                                break loop;
                            }
                            break;
                        }
                        case 1: {
                            if (dataIndex == data.length) {
                                chunk.errorNotes.push("Missing compression flag");
                                break loop;
                            }
                            compFlag = data[dataIndex];
                            dataIndex++;
                            let s = lookUpTable(compFlag, [
                                [0, "Uncompressed"],
                                [1, "Compressed"],
                            ]);
                            if (s === null) {
                                s = "Unknown";
                                chunk.errorNotes.push("Unknown compression flag");
                            }
                            chunk.innerNotes.push(`Compression flag: ${s} (${compFlag})`);
                            break;
                        }
                        case 2: {
                            if (dataIndex == data.length) {
                                chunk.errorNotes.push("Missing compression method");
                                break loop;
                            }
                            compMeth = data[dataIndex];
                            dataIndex++;
                            let s = lookUpTable(compMeth, [
                                [0, "DEFLATE"],
                            ]);
                            if (s === null) {
                                s = "Unknown";
                                chunk.errorNotes.push("Unknown compression method");
                            }
                            chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
                            break;
                        }
                        case 3: {
                            const [found, bytes] = parseNullTerminatedBytes();
                            let langTag = null;
                            try {
                                langTag = decodeUtf8(bytes);
                            }
                            catch (e) {
                                chunk.errorNotes.push("Invalid UTF-8 in language tag");
                            }
                            if (langTag !== null)
                                chunk.innerNotes.push(`Language tag: ${langTag}`);
                            if (!found) {
                                chunk.errorNotes.push("Missing null separator");
                                break loop;
                            }
                            break;
                        }
                        case 4: {
                            const [found, bytes] = parseNullTerminatedBytes();
                            let transKey = null;
                            try {
                                transKey = decodeUtf8(bytes);
                            }
                            catch (e) {
                                chunk.errorNotes.push("Invalid UTF-8 in translated keyword");
                            }
                            if (transKey !== null)
                                chunk.innerNotes.push(`Translated keyword: ${transKey}`);
                            if (!found) {
                                chunk.errorNotes.push("Missing null separator");
                                break loop;
                            }
                            break;
                        }
                        case 5: {
                            let textBytes = data.slice(dataIndex);
                            switch (compFlag) {
                                case 0: // Uncompressed
                                    break;
                                case 1:
                                    if (compMeth == 0) {
                                        try {
                                            textBytes = deflate.decompressZlib(textBytes);
                                        }
                                        catch (e) {
                                            chunk.errorNotes.push("Text decompression error: " + e.message);
                                            break loop;
                                        }
                                    }
                                    else
                                        break loop;
                                    break;
                                default:
                                    break loop;
                            }
                            let text;
                            try {
                                text = decodeUtf8(textBytes);
                            }
                            catch (e) {
                                chunk.errorNotes.push("Invalid UTF-8 in text string");
                                break;
                            }
                            let frag = document.createDocumentFragment();
                            frag.append("Text string: ");
                            let span = appendElem(frag, "span", text);
                            span.style.wordBreak = "break-all";
                            chunk.innerNotes.push(frag);
                            break;
                        }
                        default:
                            throw new Error("Assertion error");
                    }
                }
            }],
        ["oFFs", "Image offset", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                if (chunk.data.length != 9) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const xPos = readInt32(chunk.data, 0);
                const yPos = readInt32(chunk.data, 4);
                const unit = chunk.data[8];
                chunk.innerNotes.push(`X position: ${xPos.toString().replace(/-/, "\u2212")} units`);
                chunk.innerNotes.push(`Y position: ${yPos.toString().replace(/-/, "\u2212")} units`);
                {
                    let s = lookUpTable(unit, [
                        [0, "Pixel"],
                        [1, "Micrometre"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown unit specifier");
                    }
                    chunk.innerNotes.push(`Unit specifier: ${s} (${unit})`);
                }
            }],
        ["pCAL", "Calibration of pixel values", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
            }],
        ["pHYs", "Physical pixel dimensions", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                if (chunk.data.length != 9) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const horzRes = readUint32(chunk.data, 0);
                const vertRes = readUint32(chunk.data, 4);
                const unit = chunk.data[8];
                for (const [dir, val] of [["Horizontal", horzRes], ["Vertical", vertRes]]) {
                    let frag = document.createDocumentFragment();
                    frag.append(`${dir} resolution: ${val} pixels per unit`);
                    if (unit == 1) {
                        frag.append(` (\u2248 ${(val * 0.0254).toFixed(0)} `);
                        let abbr = appendElem(frag, "abbr", "DPI");
                        abbr.title = "dots per inch";
                        frag.append(")");
                    }
                    chunk.innerNotes.push(frag);
                }
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
        ["PLTE", "Palette", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "bKGD", chunk, "Chunk must be before bKGD chunk");
                addErrorIfHasType(earlier, "hIST", chunk, "Chunk must be before hIST chunk");
                addErrorIfHasType(earlier, "tRNS", chunk, "Chunk must be before tRNS chunk");
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                if (chunk.data.length % 3 != 0) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const numEntries = Math.ceil(chunk.data.length / 3);
                chunk.innerNotes.push(`Number of entries: ${numEntries}`);
                if (numEntries == 0)
                    chunk.errorNotes.push("Empty palette");
                const ihdr = ChunkPart.getValidIhdrData(earlier);
                if (ihdr === null)
                    return;
                const bitDepth = ihdr[8];
                const colorType = ihdr[9];
                if (colorType == 0 || colorType == 4)
                    chunk.errorNotes.push("Palette disallowed for grayscale color type");
                if (colorType == 3 && numEntries > (1 << bitDepth))
                    chunk.errorNotes.push("Number of palette entries exceeds bit depth");
            }],
        ["sCAL", "Physical scale of image subject", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                if (chunk.data.length == 0) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                {
                    const unit = chunk.data[0];
                    let s = lookUpTable(unit, [
                        [0, "Metre"],
                        [1, "Radian"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown unit specifier");
                    }
                    chunk.innerNotes.push(`Unit specifier: ${s} (${unit})`);
                }
                let index = 1;
                const ASCII_FLOAT = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
                {
                    let strBytes = [];
                    for (; index < chunk.data.length && chunk.data[index] != 0; index++)
                        strBytes.push(chunk.data[index]);
                    const width = decodeIso8859_1(strBytes);
                    chunk.innerNotes.push(`Pixel width: ${width} units`);
                    const match = ASCII_FLOAT.exec(width);
                    if (match === null)
                        chunk.errorNotes.push("Invalid width floating-point string");
                    else if (match[1] == "-" || !/[1-9]/.test(match[2]))
                        chunk.errorNotes.push("Non-positive width");
                }
                if (index == chunk.data.length) {
                    chunk.errorNotes.push("Missing null separator");
                    return;
                }
                index++;
                {
                    let strBytes = [];
                    for (; index < chunk.data.length; index++)
                        strBytes.push(chunk.data[index]);
                    const height = decodeIso8859_1(strBytes);
                    chunk.innerNotes.push(`Pixel height: ${height} units`);
                    const match = ASCII_FLOAT.exec(height);
                    if (match === null)
                        chunk.errorNotes.push("Invalid height floating-point string");
                    else if (match[1] == "-" || !/[1-9]/.test(match[2]))
                        chunk.errorNotes.push("Non-positive height");
                }
            }],
        ["sBIT", "Significant bits", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                const ihdr = ChunkPart.getValidIhdrData(earlier);
                if (ihdr === null)
                    return;
                const colorType = ihdr[9];
                const bitDepth = colorType != 3 ? ihdr[8] : 8;
                const channels = lookUpTable(colorType, [
                    [0, ["White"]],
                    [2, ["Red", "Green", "Blue"]],
                    [3, ["Red", "Green", "Blue"]],
                    [4, ["White", "Alpha"]],
                    [6, ["Red", "Green", "Blue", "Alpha"]],
                ]);
                if (channels === null)
                    return;
                if (chunk.data.length != channels.length) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                let hasChanErr = false;
                channels.forEach((chan, i) => {
                    const bits = chunk.data[i];
                    chunk.innerNotes.push(`${chan} bits: ${bits}`);
                    if (!hasChanErr && !(1 <= bits && bits <= bitDepth)) {
                        chunk.errorNotes.push("Bit depth out of range");
                        hasChanErr = true;
                    }
                });
            }],
        ["sPLT", "Suggested palette", true, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                let index;
                let name;
                {
                    let data = [];
                    for (const b of chunk.data)
                        data.push(b);
                    index = data.indexOf(0);
                    if (index == -1)
                        chunk.errorNotes.push("Missing null separator");
                    else
                        data = data.slice(0, index);
                    name = decodeIso8859_1(data);
                }
                annotateTextKeyword(name, "Palette name", "name", chunk);
                if (ChunkPart.getSpltNames(earlier).has(name))
                    chunk.errorNotes.push("Duplicate palette name");
                if (index == -1)
                    return;
                index++;
                if (index >= chunk.data.length) {
                    chunk.errorNotes.push("Missing sample depth");
                    return;
                }
                const sampDepth = chunk.data[index];
                index++;
                chunk.innerNotes.push(`Sample depth: ${sampDepth}`);
                const bytesPerEntry = lookUpTable(sampDepth, [
                    [8, 6],
                    [16, 10],
                ]);
                if (bytesPerEntry === null)
                    return;
                else if ((chunk.data.length - index) % bytesPerEntry == 0)
                    chunk.innerNotes.push(`Number of entries: ${(chunk.data.length - index) / bytesPerEntry}`);
                else
                    chunk.errorNotes.push("Invalid data length");
            }],
        ["sRGB", "Standard RGB color space", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                addErrorIfHasType(earlier, "iCCP", chunk, "Chunk should not exist because iCCP chunk exists");
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
        ["sTER", "Indicator of Stereo Image", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                if (chunk.data.length != 1) {
                    chunk.errorNotes.push("Invalid data length");
                    return;
                }
                const mode = chunk.data[0];
                let s = lookUpTable(mode, [
                    [0, "Cross-fuse layout"],
                    [1, "Diverging-fuse layout"],
                ]);
                if (s === null) {
                    s = "Unknown";
                    chunk.errorNotes.push("Unknown mode");
                }
                chunk.innerNotes.push(`Mode: ${s} (${mode})`);
            }],
        ["tEXt", "Textual data", true, (chunk, earlier) => {
                let data = [];
                for (const b of chunk.data)
                    data.push(b);
                const separatorIndex = data.indexOf(0);
                if (separatorIndex == -1) {
                    chunk.errorNotes.push("Missing null separator");
                    const keyword = decodeIso8859_1(data);
                    annotateTextKeyword(keyword, "Keyword", "keyword", chunk);
                }
                else {
                    const keyword = decodeIso8859_1(data.slice(0, separatorIndex));
                    annotateTextKeyword(keyword, "Keyword", "keyword", chunk);
                    const text = decodeIso8859_1(data.slice(separatorIndex + 1));
                    chunk.innerNotes.push(`Text string: ${text}`);
                    if (text.includes("\u0000"))
                        chunk.errorNotes.push("Null character in text string");
                    if (text.includes("\uFFFD"))
                        chunk.errorNotes.push("Invalid ISO 8859-1 byte in text string");
                }
            }],
        ["tIME", "Image last-modification time", false, (chunk, earlier) => {
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
                chunk.innerNotes.push(`Year: ${year}`, `Month: ${month}`, `Day: ${day}`, `Hour: ${hour}`, `Minute: ${minute}`, `Second: ${second}`);
                if (!(1 <= month && month <= 12))
                    chunk.errorNotes.push("Invalid month");
                if (!(1 <= day && day <= 31) || 1 <= month && month <= 12 && day > new Date(year, month, 0).getDate())
                    chunk.errorNotes.push("Invalid day");
                if (!(0 <= hour && hour <= 23))
                    chunk.errorNotes.push("Invalid hour");
                if (!(0 <= minute && minute <= 59))
                    chunk.errorNotes.push("Invalid minute");
                if (!(0 <= second && second <= 60))
                    chunk.errorNotes.push("Invalid second");
            }],
        ["tRNS", "Transparency", false, (chunk, earlier) => {
                addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
                const ihdr = ChunkPart.getValidIhdrData(earlier);
                if (ihdr === null)
                    return;
                const bitDepth = ihdr[8];
                const colorType = ihdr[9];
                if (colorType == 4)
                    chunk.errorNotes.push("Transparency chunk disallowed for gray+alpha color type");
                else if (colorType == 6)
                    chunk.errorNotes.push("Transparency chunk disallowed for RGBA color type");
                else if (colorType == 3) {
                    const numEntries = chunk.data.length;
                    chunk.innerNotes.push(`Number of entries: ${numEntries}`);
                    const plteNumEntries = ChunkPart.getValidPlteNumEntries(earlier);
                    if (plteNumEntries === null)
                        return;
                    if (numEntries > plteNumEntries)
                        chunk.errorNotes.push("Number of alpha values exceeds palette size");
                }
                else {
                    if (colorType == 0 && chunk.data.length != 2)
                        chunk.errorNotes.push("Invalid data length");
                    else if (colorType == 2 && chunk.data.length != 6)
                        chunk.errorNotes.push("Invalid data length");
                    else {
                        if (colorType == 0)
                            chunk.innerNotes.push(`White: ${readUint16(chunk.data, 0)}`);
                        else if (colorType == 2) {
                            chunk.innerNotes.push(`Red: ${readUint16(chunk.data, 0)}`, `Green: ${readUint16(chunk.data, 2)}`, `Blue: ${readUint16(chunk.data, 4)}`);
                        }
                        for (let i = 0; i < chunk.data.length; i += 2) {
                            if (readUint16(chunk.data, i) >= (1 << bitDepth))
                                chunk.errorNotes.push("Color value out of range");
                        }
                    }
                }
            }],
        ["zTXt", "Compressed textual data", true, (chunk, earlier) => {
                let data = [];
                for (const b of chunk.data)
                    data.push(b);
                const separatorIndex = data.indexOf(0);
                if (separatorIndex == -1) {
                    chunk.errorNotes.push("Missing null separator");
                    const keyword = decodeIso8859_1(data);
                    annotateTextKeyword(keyword, "Keyword", "keyword", chunk);
                }
                else {
                    const keyword = decodeIso8859_1(data.slice(0, separatorIndex));
                    annotateTextKeyword(keyword, "Keyword", "keyword", chunk);
                    if (separatorIndex + 1 >= data.length)
                        chunk.errorNotes.push("Missing compression method");
                    else {
                        const compMeth = data[separatorIndex + 1];
                        let s = lookUpTable(compMeth, [
                            [0, "DEFLATE"],
                        ]);
                        if (s === null) {
                            s = "Unknown";
                            chunk.errorNotes.push("Unknown compression method");
                        }
                        chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
                        if (compMeth == 0) {
                            try {
                                const textBytes = deflate.decompressZlib(data.slice(separatorIndex + 2));
                                const text = decodeIso8859_1(textBytes);
                                let frag = document.createDocumentFragment();
                                frag.append("Text string: ");
                                let span = appendElem(frag, "span", text);
                                span.style.wordBreak = "break-all";
                                chunk.innerNotes.push(frag);
                                if (text.includes("\uFFFD"))
                                    chunk.errorNotes.push("Invalid ISO 8859-1 byte in text string");
                            }
                            catch (e) {
                                chunk.errorNotes.push("Text decompression error: " + e.message);
                            }
                        }
                    }
                }
            }],
    ];
    /*---- Utility functions ----*/
    function annotateTextKeyword(keyword, noteName, errorName, chunk) {
        chunk.innerNotes.push(`${noteName}: ${keyword}`);
        if (!(1 <= keyword.length && keyword.length <= 79))
            chunk.errorNotes.push(`Invalid ${errorName} length`);
        for (const ch of keyword) {
            const c = ch.codePointAt(0);
            if (0x20 <= c && c <= 0x7E || 0xA1 <= c && c <= 0xFF)
                continue;
            else {
                chunk.errorNotes.push(`Invalid character in ${errorName}`);
                break;
            }
        }
        if (/^ |  | $/.test(keyword))
            chunk.errorNotes.push(`Invalid space in ${errorName}`);
    }
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
        for (const b of bytes) {
            let cc = b;
            if (b < 0x20)
                cc += 0x2400;
            else if (b == 0x7F)
                cc = 0x2421;
            else if (0x80 <= b && b < 0xA0)
                cc = 0x25AF;
            result += String.fromCodePoint(cc);
        }
        return result;
    }
    function decodeIso8859_1(bytes) {
        let result = "";
        for (const b of bytes) {
            if (!(0x00 <= b && b <= 0xFF))
                throw new RangeError("Invalid byte");
            else if (0x80 <= b && b < 0xA0)
                result += "\uFFFD";
            else
                result += String.fromCodePoint(b); // ISO 8859-1 is a subset of Unicode
        }
        return result;
    }
    function decodeUtf8(bytes) {
        let temp = "";
        for (const b of bytes) {
            if (b == "%".codePointAt(0) || b >= 128)
                temp += "%" + b.toString(16).padStart(2, "0");
            else
                temp += String.fromCodePoint(b);
        }
        return decodeURI(temp);
    }
    function uintToStrWithThousandsSeparators(val) {
        if (val < 0 || Math.floor(val) != val)
            throw new RangeError("Invalid unsigned integer");
        let result = val.toString();
        for (let i = result.length - 3; i > 0; i -= 3)
            result = result.substring(0, i) + "\u00A0" + result.substring(i);
        return result;
    }
    function addErrorIfHasType(earlier, type, chunk, message) {
        if (earlier.some(ch => ch.typeStr == type))
            chunk.errorNotes.push(message);
    }
    function appendElem(container, tagName, text) {
        let result = document.createElement(tagName);
        container.append(result);
        if (text !== undefined)
            result.textContent = text;
        return result;
    }
    function lookUpTable(key, table) {
        let result = null;
        for (const [k, v] of table) {
            if (k == key) {
                if (result !== null)
                    throw new RangeError("Table has duplicate keys");
                result = v;
            }
        }
        return result;
    }
    function readUint16(bytes, offset) {
        if (bytes.length - offset < 2)
            throw new RangeError("Index out of range");
        return bytes[offset + 0] << 8
            | bytes[offset + 1] << 0;
    }
    function readUint32(bytes, offset) {
        if (offset < 0 || bytes.length - offset < 4)
            throw new RangeError("Index out of range");
        return (bytes[offset + 0] << 24
            | bytes[offset + 1] << 16
            | bytes[offset + 2] << 8
            | bytes[offset + 3] << 0) >>> 0;
    }
    function readInt32(bytes, offset) {
        return readUint32(bytes, offset) | 0;
    }
    function requireType(val, type) {
        if (val instanceof type)
            return val;
        else
            throw new TypeError("Invalid value type");
    }
})(app || (app = {}));
// See https://www.nayuki.io/page/simple-deflate-decompressor
var deflate;
(function (deflate) {
    function decompressZlib(bytes) {
        if (bytes.length < 2)
            throw new RangeError("Invalid zlib container");
        const compMeth = bytes[0] & 0xF;
        const compInfo = bytes[0] >>> 4;
        const presetDict = (bytes[1] & 0x20) != 0;
        const compLevel = bytes[1] >>> 6;
        if ((bytes[0] << 8 | bytes[1]) % 31 != 0)
            throw new RangeError("zlib header checksum mismatch");
        if (compMeth != 8)
            throw new RangeError(`Unsupported compression method (${compMeth})`);
        if (compInfo > 7)
            throw new RangeError(`Unsupported compression info (${compInfo})`);
        if (presetDict)
            throw new RangeError("Unsupported preset dictionary");
        const [result, input] = decompressDeflate(bytes.slice(2));
        let dataAdler;
        {
            let s1 = 1;
            let s2 = 0;
            for (const b of result) {
                s1 = (s1 + b) % 65521;
                s2 = (s2 + s1) % 65521;
            }
            dataAdler = s2 << 16 | s1;
        }
        let storedAdler = 0;
        input.readUint((8 - input.getBitPosition()) % 8);
        for (let i = 0; i < 4; i++)
            storedAdler = storedAdler << 8 | input.readUint(8);
        if (storedAdler != dataAdler)
            throw new RangeError("Adler-32 mismatch");
        if (input.readBitMaybe() != -1)
            throw new RangeError("Unexpected data after zlib container");
        return result;
    }
    deflate.decompressZlib = decompressZlib;
    function decompressDeflate(bytes) {
        let input = new BitInputStream(bytes);
        let output = [];
        let dictionary = new ByteHistory(32 * 1024);
        while (true) {
            const isFinal = input.readUint(1) != 0;
            const type = input.readUint(2);
            switch (type) {
                case 0:
                    decompressUncompressedBlock();
                    break;
                case 1:
                    decompressHuffmanBlock(FIXED_LITERAL_LENGTH_CODE, FIXED_DISTANCE_CODE);
                    break;
                case 2:
                    const [litLenCode, distCode] = decodeHuffmanCodes();
                    decompressHuffmanBlock(litLenCode, distCode);
                    break;
                case 3:
                    throw new Error("Reserved block type");
                default:
                    throw new Error("Assertion error");
            }
            if (isFinal)
                return [output, input];
        }
        function decodeHuffmanCodes() {
            const numLitLenCodes = input.readUint(5) + 257;
            const numDistCodes = input.readUint(5) + 1;
            const numCodeLenCodes = input.readUint(4) + 4;
            let codeLenCodeLen = [];
            for (let i = 0; i < 19; i++)
                codeLenCodeLen.push(0);
            codeLenCodeLen[16] = input.readUint(3);
            codeLenCodeLen[17] = input.readUint(3);
            codeLenCodeLen[18] = input.readUint(3);
            codeLenCodeLen[0] = input.readUint(3);
            for (let i = 0; i < numCodeLenCodes - 4; i++) {
                const j = (i % 2 == 0) ? (8 + Math.floor(i / 2)) : (7 - Math.floor(i / 2));
                codeLenCodeLen[j] = input.readUint(3);
            }
            const codeLenCode = new CanonicalCode(codeLenCodeLen);
            let codeLens = [];
            while (codeLens.length < numLitLenCodes + numDistCodes) {
                const sym = codeLenCode.decodeNextSymbol(input);
                if (0 <= sym && sym <= 15)
                    codeLens.push(sym);
                else if (sym == 16) {
                    if (codeLens.length == 0)
                        throw new Error("No code length value to copy");
                    const runLen = input.readUint(2) + 3;
                    for (let i = 0; i < runLen; i++)
                        codeLens.push(codeLens[codeLens.length - 1]);
                }
                else if (sym == 17) {
                    const runLen = input.readUint(3) + 3;
                    for (let i = 0; i < runLen; i++)
                        codeLens.push(0);
                }
                else if (sym == 18) {
                    const runLen = input.readUint(7) + 11;
                    for (let i = 0; i < runLen; i++)
                        codeLens.push(0);
                }
                else
                    throw new Error("Symbol out of range");
            }
            if (codeLens.length > numLitLenCodes + numDistCodes)
                throw new Error("Run exceeds number of codes");
            const litLenCode = new CanonicalCode(codeLens.slice(0, numLitLenCodes));
            let distCodeLen = codeLens.slice(numLitLenCodes);
            let distCode;
            if (distCodeLen.length == 1 && distCodeLen[0] == 0)
                distCode = null;
            else {
                const oneCount = distCodeLen.filter(x => x == 1).length;
                const otherPositiveCount = distCodeLen.filter(x => x > 1).length;
                if (oneCount == 1 && otherPositiveCount == 0) {
                    while (distCodeLen.length < 32)
                        distCodeLen.push(0);
                    distCodeLen[31] = 1;
                }
                distCode = new CanonicalCode(distCodeLen);
            }
            return [litLenCode, distCode];
        }
        function decompressUncompressedBlock() {
            input.readUint((8 - input.getBitPosition()) % 8);
            const len = input.readUint(16);
            const nlen = input.readUint(16);
            if ((len ^ 0xFFFF) != nlen)
                throw new Error("Invalid length in uncompressed block");
            for (let i = 0; i < len; i++) {
                const b = input.readUint(8);
                output.push(b);
                dictionary.append(b);
            }
        }
        function decompressHuffmanBlock(litLenCode, distCode) {
            while (true) {
                const sym = litLenCode.decodeNextSymbol(input);
                if (sym == 256)
                    break;
                else if (sym < 256) {
                    output.push(sym);
                    dictionary.append(sym);
                }
                else {
                    const run = decodeRunLength(sym);
                    if (!(3 <= run && run <= 258))
                        throw new Error("Invalid run length");
                    if (distCode === null)
                        throw new Error("Length symbol encountered with empty distance code");
                    const distSym = distCode.decodeNextSymbol(input);
                    const dist = decodeDistance(distSym);
                    if (!(1 <= dist && dist <= 32768))
                        throw new Error("Invalid distance");
                    dictionary.copy(dist, run, output);
                }
            }
        }
        function decodeRunLength(sym) {
            if (!(257 <= sym && sym <= 287))
                throw new RangeError("Invalid run length symbol");
            if (sym <= 264)
                return sym - 254;
            else if (sym <= 284) {
                const numExtraBits = Math.floor((sym - 261) / 4);
                return (((sym - 265) % 4 + 4) << numExtraBits) + 3 + input.readUint(numExtraBits);
            }
            else if (sym == 285)
                return 258;
            else
                throw new RangeError("Reserved length symbol");
        }
        function decodeDistance(sym) {
            if (!(0 <= sym && sym <= 31))
                throw new RangeError("Invalid distance symbol");
            if (sym <= 3)
                return sym + 1;
            else if (sym <= 29) {
                const numExtraBits = Math.floor(sym / 2) - 1;
                return ((sym % 2 + 2) << numExtraBits) + 1 + input.readUint(numExtraBits);
            }
            else
                throw new RangeError("Reserved distance symbol");
        }
    }
    deflate.decompressDeflate = decompressDeflate;
    class CanonicalCode {
        constructor(codeLengths) {
            this.codeBitsToSymbol = new Map();
            let nextCode = 0;
            for (let codeLength = 1; codeLength <= CanonicalCode.MAX_CODE_LENGTH; codeLength++) {
                nextCode <<= 1;
                const startBit = 1 << codeLength;
                codeLengths.forEach((cl, symbol) => {
                    if (cl != codeLength)
                        return;
                    if (nextCode >= startBit)
                        throw new RangeError("This canonical code produces an over-full Huffman code tree");
                    this.codeBitsToSymbol.set(startBit | nextCode, symbol);
                    nextCode++;
                });
            }
            if (nextCode != 1 << CanonicalCode.MAX_CODE_LENGTH)
                throw new RangeError("This canonical code produces an under-full Huffman code tree");
        }
        decodeNextSymbol(inp) {
            let codeBits = 1;
            while (true) {
                codeBits = codeBits << 1 | inp.readUint(1);
                const result = this.codeBitsToSymbol.get(codeBits);
                if (result !== undefined)
                    return result;
            }
        }
    }
    CanonicalCode.MAX_CODE_LENGTH = 15;
    let FIXED_LITERAL_LENGTH_CODE;
    {
        let codeLens = [];
        for (let i = 0; i < 144; i++)
            codeLens.push(8);
        for (let i = 0; i < 112; i++)
            codeLens.push(9);
        for (let i = 0; i < 24; i++)
            codeLens.push(7);
        for (let i = 0; i < 8; i++)
            codeLens.push(8);
        FIXED_LITERAL_LENGTH_CODE = new CanonicalCode(codeLens);
    }
    let FIXED_DISTANCE_CODE;
    {
        let codeLens = [];
        for (let i = 0; i < 32; i++)
            codeLens.push(5);
        FIXED_DISTANCE_CODE = new CanonicalCode(codeLens);
    }
    class ByteHistory {
        constructor(size) {
            this.index = 0;
            if (size < 1)
                throw new RangeError("Size must be positive");
            this.data = new Uint8Array(size);
        }
        append(b) {
            if (!(0 <= this.index && this.index < this.data.length))
                throw new Error("Assertion error");
            this.data[this.index] = b;
            this.index = (this.index + 1) % this.data.length;
        }
        copy(dist, count, out) {
            if (count < 0 || !(1 <= dist && dist <= this.data.length))
                throw new RangeError("Invalid argument");
            let readIndex = (this.index + this.data.length - dist) % this.data.length;
            for (let i = 0; i < count; i++) {
                const b = this.data[readIndex];
                readIndex = (readIndex + 1) % this.data.length;
                out.push(b);
                this.append(b);
            }
        }
    }
    class BitInputStream {
        constructor(data) {
            this.data = data;
            this.bitIndex = 0;
        }
        getBitPosition() {
            return this.bitIndex % 8;
        }
        readBitMaybe() {
            const byteIndex = this.bitIndex >>> 3;
            if (byteIndex >= this.data.length)
                return -1;
            const result = ((this.data[byteIndex] >>> (this.bitIndex & 7)) & 1);
            this.bitIndex++;
            return result;
        }
        readUint(numBits) {
            if (numBits < 0)
                throw new RangeError("Invalid argument");
            let result = 0;
            for (let i = 0; i < numBits; i++) {
                const bit = this.readBitMaybe();
                if (bit == -1)
                    throw new Error("Unexpected end of data");
                result |= bit << i;
            }
            return result;
        }
    }
})(deflate || (deflate = {}));
