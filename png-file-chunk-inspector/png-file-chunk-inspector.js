/*
 * PNG file chunk inspector (compiled from TypeScript)
 *
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/png-file-chunk-inspector
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var app;
(function (app) {
    /*---- Graphical user interface ----*/
    function initialize() {
        var fileElem = requireType(document.querySelector("article input[type=file]"), HTMLInputElement);
        fileElem.onchange = function () {
            var files = fileElem.files;
            if (files === null || files.length < 1)
                return;
            var reader = new FileReader();
            reader.onload = function () {
                var bytes = requireType(reader.result, ArrayBuffer);
                visualizeFile(new Uint8Array(bytes));
            };
            reader.readAsArrayBuffer(files[0]);
        };
    }
    setTimeout(initialize);
    function visualizeFile(fileBytes) {
        var table = requireType(document.querySelector("article table"), HTMLElement);
        table.classList.remove("errors");
        var tbody = requireType(table.querySelector("tbody"), HTMLElement);
        while (tbody.firstChild !== null)
            tbody.removeChild(tbody.firstChild);
        var _loop_1 = function (part) {
            var tr = appendElem(tbody, "tr");
            appendElem(tr, "td", uintToStrWithThousandsSeparators(part.offset));
            {
                var td = appendElem(tr, "td");
                var hex_1 = [];
                var bytes_1 = part.bytes;
                var pushHex = function (index) {
                    hex_1.push(bytes_1[index].toString(16).padStart(2, "0"));
                };
                if (bytes_1.length <= 100) {
                    for (var i = 0; i < bytes_1.length; i++)
                        pushHex(i);
                }
                else {
                    for (var i = 0; i < 70; i++)
                        pushHex(i);
                    hex_1.push("...");
                    for (var i = bytes_1.length - 30; i < bytes_1.length; i++)
                        pushHex(i);
                }
                appendElem(td, "code", hex_1.join(" "));
            }
            for (var _i = 0, _a = [part.outerNotes, part.innerNotes, part.errorNotes]; _i < _a.length; _i++) {
                var list = _a[_i];
                var td = appendElem(tr, "td");
                var ul = appendElem(td, "ul");
                for (var _b = 0, list_1 = list; _b < list_1.length; _b++) {
                    var item = list_1[_b];
                    if (list == part.errorNotes)
                        table.classList.add("errors");
                    var li = appendElem(ul, "li");
                    if (typeof item == "string")
                        li.textContent = item;
                    else if (item instanceof Node)
                        li.appendChild(item);
                    else
                        throw "Assertion error";
                }
            }
        };
        for (var _i = 0, _a = parseFile(fileBytes); _i < _a.length; _i++) {
            var part = _a[_i];
            _loop_1(part);
        }
    }
    /*---- PNG file parser ----*/
    function parseFile(fileBytes) {
        var result = [];
        var isSignatureValid;
        var offset = 0;
        { // Parse file signature
            var bytes = fileBytes.subarray(offset, Math.min(offset + SignaturePart.FILE_SIGNATURE.length, fileBytes.length));
            var part = new SignaturePart(offset, bytes);
            result.push(part);
            isSignatureValid = part.errorNotes.length == 0;
            offset += bytes.length;
        }
        if (!isSignatureValid && offset < fileBytes.length) {
            var bytes = fileBytes.subarray(offset, fileBytes.length);
            var part = new UnknownPart(offset, bytes);
            part.errorNotes.push("Unknown format");
            result.push(part);
            offset += bytes.length;
        }
        else if (isSignatureValid) {
            // Parse chunks but carefully handle erroneous file structures
            while (offset < fileBytes.length) {
                // Begin by assuming that the next chunk is invalid
                var bytes = fileBytes.subarray(offset, fileBytes.length);
                var remain = bytes.length;
                if (remain >= 4) {
                    var innerLen = readUint32(fileBytes, offset);
                    var outerLen = innerLen + 12;
                    if (innerLen <= ChunkPart.MAX_DATA_LENGTH && outerLen <= remain)
                        bytes = fileBytes.subarray(offset, offset + outerLen); // Chunk is now valid with respect to length
                }
                result.push(new ChunkPart(offset, bytes));
                offset += bytes.length;
            }
            // Annotate chunks
            var earlierChunks = [];
            var earlierTypes = new Set();
            for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
                var part_1 = result_1[_i];
                if (!(part_1 instanceof ChunkPart))
                    continue;
                var code = part_1.typeCodeStr;
                if (code != "IHDR" && code != "" && !earlierTypes.has("IHDR"))
                    part_1.errorNotes.push("Chunk must be after IHDR chunk");
                if (code != "IEND" && code != "" && earlierTypes.has("IEND"))
                    part_1.errorNotes.push("Chunk must be before IEND chunk");
                var typeInfo = part_1.getTypeInfo();
                if (typeInfo !== null && !typeInfo[1] && earlierTypes.has(code))
                    part_1.errorNotes.push("Multiple chunks of this type disallowed");
                part_1.annotate(earlierChunks);
                earlierChunks.push(part_1);
                earlierTypes.add(code);
            }
            var part = new UnknownPart(offset, new Uint8Array());
            if (!earlierTypes.has("IHDR"))
                part.errorNotes.push("Missing IHDR chunk");
            if (!earlierTypes.has("IDAT"))
                part.errorNotes.push("Missing IDAT chunk");
            if (!earlierTypes.has("IEND"))
                part.errorNotes.push("Missing IEND chunk");
            if (part.errorNotes.length > 0)
                result.push(part);
        }
        if (offset != fileBytes.length)
            throw "Assertion error";
        return result;
    }
    /*---- Classes representing different file parts ----*/
    var FilePart = /** @class */ (function () {
        function FilePart(offset, bytes) {
            this.offset = offset;
            this.bytes = bytes;
            this.outerNotes = [];
            this.innerNotes = [];
            this.errorNotes = [];
        }
        return FilePart;
    }());
    var SignaturePart = /** @class */ (function (_super) {
        __extends(SignaturePart, _super);
        function SignaturePart(offset, bytes) {
            var _this = _super.call(this, offset, bytes) || this;
            _this.outerNotes.push("Special: File signature");
            _this.outerNotes.push("Length: " + uintToStrWithThousandsSeparators(bytes.length) + " bytes");
            _this.innerNotes.push("\u201C" + bytesToReadableString(bytes) + "\u201D");
            for (var i = 0; i < SignaturePart.FILE_SIGNATURE.length && _this.errorNotes.length == 0; i++) {
                if (i >= bytes.length)
                    _this.errorNotes.push("Premature EOF");
                else if (bytes[i] != SignaturePart.FILE_SIGNATURE[i])
                    _this.errorNotes.push("Value mismatch");
            }
            return _this;
        }
        SignaturePart.FILE_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        return SignaturePart;
    }(FilePart));
    var UnknownPart = /** @class */ (function (_super) {
        __extends(UnknownPart, _super);
        function UnknownPart(offset, bytes) {
            var _this = _super.call(this, offset, bytes) || this;
            _this.outerNotes.push("Special: Unknown");
            _this.outerNotes.push("Length: " + uintToStrWithThousandsSeparators(bytes.length) + " bytes");
            return _this;
        }
        return UnknownPart;
    }(FilePart));
    var ChunkPart = /** @class */ (function (_super) {
        __extends(ChunkPart, _super);
        function ChunkPart(offset, bytes) {
            var _this = _super.call(this, offset, bytes) || this;
            _this.typeCodeStr = "";
            _this.data = new Uint8Array();
            if (bytes.length < 4) {
                _this.outerNotes.push("Data length: Unfinished");
                _this.errorNotes.push("Premature EOF");
                return _this;
            }
            var dataLen = readUint32(bytes, 0);
            _this.outerNotes.push("Data length: " + uintToStrWithThousandsSeparators(dataLen) + " bytes");
            if (dataLen > ChunkPart.MAX_DATA_LENGTH)
                _this.errorNotes.push("Length out of range");
            else if (bytes.length < dataLen + 12)
                _this.errorNotes.push("Premature EOF");
            if (bytes.length < 8) {
                _this.outerNotes.push("Type code: Unfinished");
                return _this;
            }
            {
                var typeCodeBytes = bytes.subarray(4, 8);
                _this.typeCodeStr = bytesToReadableString(typeCodeBytes);
                _this.outerNotes.push("Type code: " + _this.typeCodeStr);
                var typeInfo = _this.getTypeInfo();
                var typeName = typeInfo !== null ? typeInfo[0] : "Unknown";
                _this.outerNotes.push("Name: " + typeName);
                _this.outerNotes.push((typeCodeBytes[0] & 0x20) == 0 ? "Critical (0)" : "Ancillary (1)");
                _this.outerNotes.push((typeCodeBytes[1] & 0x20) == 0 ? "Public (0)" : "Private (1)");
                _this.outerNotes.push((typeCodeBytes[2] & 0x20) == 0 ? "Reserved (0)" : "Unknown (1)");
                _this.outerNotes.push((typeCodeBytes[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)");
            }
            if (dataLen > ChunkPart.MAX_DATA_LENGTH) {
                _this.typeCodeStr = "";
                return _this;
            }
            if (bytes.length < dataLen + 12) {
                _this.outerNotes.push("CRC-32: Unfinished");
                _this.typeCodeStr = "";
                return _this;
            }
            {
                var storedCrc = readUint32(bytes, bytes.length - 4);
                _this.outerNotes.push("CRC-32: " + storedCrc.toString(16).padStart(8, "0").toUpperCase());
                var dataCrc = calcCrc32(bytes.subarray(4, bytes.length - 4));
                if (dataCrc != storedCrc)
                    _this.errorNotes.push("CRC-32 mismatch (calculated from data: " + dataCrc.toString(16).padStart(8, "0").toUpperCase() + ")");
                _this.data = bytes.subarray(8, bytes.length - 4);
            }
            return _this;
        }
        ChunkPart.prototype.annotate = function (earlierChunks) {
            if (this.innerNotes.length > 0)
                throw "Already annotated";
            var temp = this.getTypeInfo();
            if (temp !== null)
                temp[2](this, earlierChunks);
        };
        ChunkPart.prototype.getTypeInfo = function () {
            var result = null;
            for (var _i = 0, _a = ChunkPart.TYPE_HANDLERS; _i < _a.length; _i++) {
                var _b = _a[_i], code = _b[0], name_1 = _b[1], multiple = _b[2], func = _b[3];
                if (code == this.typeCodeStr) {
                    if (result !== null)
                        throw "Table has duplicate keys";
                    result = [name_1, multiple, func];
                }
            }
            return result;
        };
        // The maximum length of a chunk's payload data, in bytes, inclusive.
        // Although this number does not fit in a signed 32-bit integer type,
        // the PNG specification says that lengths "must not exceed 2^31 bytes".
        ChunkPart.MAX_DATA_LENGTH = 0x80000000;
        /*---- Handlers and metadata for all known PNG chunk types ----*/
        ChunkPart.TYPE_HANDLERS = [
            ["bKGD", "Background color", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                }],
            ["cHRM", "Primary chromaticities", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "PLTE"; }))
                        chunk.errorNotes.push("Chunk must be before PLTE chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (chunk.data.length != 32) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    var offset = 0;
                    for (var _i = 0, _a = ["White point", "Red", "Green", "Blue"]; _i < _a.length; _i++) {
                        var item = _a[_i];
                        for (var _b = 0, _c = ["x", "y"]; _b < _c.length; _b++) {
                            var axis = _c[_b];
                            var val = readUint32(chunk.data, offset);
                            var s = val.toString().padStart(6, "0");
                            s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
                            // s basically equals (val/100000).toFixed(5)
                            chunk.innerNotes.push(item + " " + axis + ": " + s);
                            offset += 4;
                        }
                    }
                }],
            ["gAMA", "Image gamma", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "PLTE"; }))
                        chunk.errorNotes.push("Chunk must be before PLTE chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (chunk.data.length != 4) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    var gamma = readUint32(chunk.data, 0);
                    var s = gamma.toString().padStart(6, "0");
                    s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
                    // s basically equals (gamma/100000).toFixed(5)
                    chunk.innerNotes.push("Gamma: " + s);
                }],
            ["hIST", "Palette histogram", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (!earlier.some(function (ch) { return ch.typeCodeStr == "PLTE"; }))
                        chunk.errorNotes.push("Chunk requires earlier PLTE chunk");
                    if (chunk.data.length % 2 != 0 || chunk.data.length / 2 > 256) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                }],
            ["iCCP", "Embedded ICC profile", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "PLTE"; }))
                        chunk.errorNotes.push("Chunk must be before PLTE chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "sRGB"; }))
                        chunk.errorNotes.push("Chunk should not exist because sRGB chunk exists");
                }],
            ["IDAT", "Image data", true, function (chunk, earlier) {
                    if (earlier.length > 0 && earlier[earlier.length - 1].typeCodeStr != "IDAT"
                        && earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; })) {
                        chunk.errorNotes.push("Non-consecutive IDAT chunk");
                    }
                }],
            ["IEND", "Image trailer", false, function (chunk, earlier) {
                    if (chunk.data.length != 0)
                        chunk.errorNotes.push("Non-empty data");
                }],
            ["IHDR", "Image header", false, function (chunk, earlier) {
                    if (chunk.data.length != 13) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    var width = readUint32(chunk.data, 0);
                    var height = readUint32(chunk.data, 4);
                    var bitDepth = chunk.data[8];
                    var colorType = chunk.data[9];
                    var compMeth = chunk.data[10];
                    var filtMeth = chunk.data[11];
                    var laceMeth = chunk.data[12];
                    chunk.innerNotes.push("Width: " + width + " pixels");
                    if (width == 0 || width > 0x80000000)
                        chunk.errorNotes.push("Width out of range");
                    chunk.innerNotes.push("Height: " + height + " pixels");
                    if (height == 0 || height > 0x80000000)
                        chunk.errorNotes.push("Height out of range");
                    {
                        var colorTypeStr = void 0;
                        var validBitDepths = void 0;
                        var temp = lookUpTable(colorType, [
                            [0, ["Grayscale", [1, 2, 4, 8, 16]]],
                            [2, ["RGB", [8, 16]]],
                            [3, ["Palette", [1, 2, 4, 8]]],
                            [4, ["Grayscale+Alpha", [8, 16]]],
                            [6, ["RGBA", [8, 16]]],
                        ]);
                        colorTypeStr = temp !== null ? temp[0] : "Unknown";
                        validBitDepths = temp !== null ? temp[1] : [];
                        chunk.innerNotes.push("Bit depth: " + bitDepth + " bits per " + (colorType != 3 ? "channel" : "pixel"));
                        chunk.innerNotes.push("Color type: " + colorTypeStr + " (" + colorType + ")");
                        if (temp === null)
                            chunk.errorNotes.push("Unknown color type");
                        else if (validBitDepths.indexOf(bitDepth) == -1)
                            chunk.errorNotes.push("Invalid bit depth");
                    }
                    {
                        var s = lookUpTable(compMeth, [
                            [0, "DEFLATE"],
                        ]);
                        if (s === null) {
                            s = "Unknown";
                            chunk.errorNotes.push("Unknown compression method");
                        }
                        chunk.innerNotes.push("Compression method: " + s + " (" + compMeth + ")");
                    }
                    {
                        var s = lookUpTable(filtMeth, [
                            [0, "Adaptive"],
                        ]);
                        if (s === null) {
                            s = "Unknown";
                            chunk.errorNotes.push("Unknown filter method");
                        }
                        chunk.innerNotes.push("Filter method: " + s + " (" + filtMeth + ")");
                    }
                    {
                        var s = lookUpTable(laceMeth, [
                            [0, "None"],
                            [1, "Adam7"],
                        ]);
                        if (s === null) {
                            s = "Unknown";
                            chunk.errorNotes.push("Unknown interlace method");
                        }
                        chunk.innerNotes.push("Interlace method: " + s + " (" + laceMeth + ")");
                    }
                }],
            ["iTXt", "International textual data", true, function (chunk, earlier) { }],
            ["pHYs", "Physical pixel dimensions", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (chunk.data.length != 9) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    var horzRes = readUint32(chunk.data, 0);
                    var vertRes = readUint32(chunk.data, 4);
                    var unit = chunk.data[8];
                    for (var _i = 0, _a = [["Horizontal", horzRes], ["Vertical", vertRes]]; _i < _a.length; _i++) {
                        var _b = _a[_i], dir = _b[0], val = _b[1];
                        var frag = document.createDocumentFragment();
                        frag.appendChild(document.createTextNode(dir + " resolution: " + val + " pixels per unit"));
                        if (unit == 1) {
                            frag.appendChild(document.createTextNode(" (\u2248 " + (val * 0.0254).toFixed(0) + " "));
                            var abbr = appendElem(frag, "abbr", "DPI");
                            abbr.title = "dots per inch";
                            frag.appendChild(document.createTextNode(")"));
                        }
                        chunk.innerNotes.push(frag);
                    }
                    {
                        var s = lookUpTable(unit, [
                            [0, "Arbitrary (aspect ratio only)"],
                            [1, "Metre"],
                        ]);
                        if (s === null) {
                            s = "Unknown";
                            chunk.errorNotes.push("Unknown unit specifier");
                        }
                        chunk.innerNotes.push("Unit specifier: " + s + " (" + unit + ")");
                    }
                }],
            ["PLTE", "Palette", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "bKGD"; }))
                        chunk.errorNotes.push("Chunk must be before bKGD chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "hIST"; }))
                        chunk.errorNotes.push("Chunk must be before hIST chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "tRNS"; }))
                        chunk.errorNotes.push("Chunk must be before tRNS chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                }],
            ["sBIT", "Significant bits", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "PLTE"; }))
                        chunk.errorNotes.push("Chunk must be before PLTE chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (chunk.data.length == 0 || chunk.data.length > 4)
                        chunk.errorNotes.push("Invalid data length");
                    var temp = [];
                    for (var i = 0; i < chunk.data.length; i++)
                        temp.push(chunk.data[i].toString());
                    chunk.innerNotes.push("Significant bits per channel: " + temp.join(", "));
                }],
            ["sPLT", "Suggested palette", true, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                }],
            ["sRGB", "Standard RGB color space", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "PLTE"; }))
                        chunk.errorNotes.push("Chunk must be before PLTE chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "iCCP"; }))
                        chunk.errorNotes.push("Chunk should not exist because iCCP chunk exists");
                    if (chunk.data.length != 1) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    var renderIntent = chunk.data[0];
                    var s = lookUpTable(renderIntent, [
                        [0, "Perceptual"],
                        [1, "Relative colorimetric"],
                        [2, "Saturation"],
                        [3, "Absolute colorimetric"],
                    ]);
                    if (s === null) {
                        s = "Unknown";
                        chunk.errorNotes.push("Unknown rendering intent");
                    }
                    chunk.innerNotes.push("Rendering intent: " + s + " (" + renderIntent + ")");
                }],
            ["tEXt", "Textual data", true, function (chunk, earlier) {
                    var data = [];
                    for (var i = 0; i < chunk.data.length; i++)
                        data.push(chunk.data[i]);
                    var keyword;
                    var text;
                    var separatorIndex = data.indexOf(0);
                    if (separatorIndex == -1) {
                        chunk.errorNotes.push("Missing null separator");
                        keyword = decodeIso8859_1(data);
                        text = "";
                        chunk.innerNotes.push("Keyword: " + keyword);
                    }
                    else {
                        keyword = decodeIso8859_1(data.slice(0, separatorIndex));
                        text = decodeIso8859_1(data.slice(separatorIndex + 1));
                        chunk.innerNotes.push("Keyword: " + keyword);
                        chunk.innerNotes.push("Text string: " + text);
                    }
                    if (!(1 <= keyword.length || keyword.length <= 79))
                        chunk.errorNotes.push("Invalid keyword length");
                    for (var i = 0; i < keyword.length; i++) {
                        var c = keyword.charCodeAt(i);
                        if (0x20 <= c && c <= 0x7E || 0xA1 <= c && c <= 0xFF)
                            continue;
                        else {
                            chunk.errorNotes.push("Invalid character in keyword");
                            break;
                        }
                    }
                    if (keyword.indexOf(" ") == 0 || keyword.lastIndexOf(" ") == keyword.length - 1 || keyword.indexOf("  ") != -1)
                        chunk.errorNotes.push("Invalid space in keyword");
                    if (text.indexOf("\u0000") != -1)
                        chunk.errorNotes.push("Null character in text string");
                    if (text.indexOf("\uFFFD") != -1)
                        chunk.errorNotes.push("Invalid ISO-8859-1 byte in text string");
                }],
            ["tIME", "Image last-modification time", false, function (chunk, earlier) {
                    if (chunk.data.length != 7) {
                        chunk.errorNotes.push("Invalid data length");
                        return;
                    }
                    var year = readUint16(chunk.data, 0);
                    var month = chunk.data[2];
                    var day = chunk.data[3];
                    var hour = chunk.data[4];
                    var minute = chunk.data[5];
                    var second = chunk.data[6];
                    chunk.innerNotes.push("Year: " + year);
                    chunk.innerNotes.push("Month: " + month);
                    chunk.innerNotes.push("Day: " + day);
                    chunk.innerNotes.push("Hour: " + hour);
                    chunk.innerNotes.push("Minute: " + minute);
                    chunk.innerNotes.push("Second: " + second);
                    if (!(1 <= month && month <= 12))
                        chunk.errorNotes.push("Invalid month");
                    if (!(1 <= day && day <= 31))
                        chunk.errorNotes.push("Invalid day");
                    if (!(0 <= hour && hour <= 23))
                        chunk.errorNotes.push("Invalid hour");
                    if (!(0 <= minute && minute <= 59))
                        chunk.errorNotes.push("Invalid minute");
                    if (!(0 <= second && second <= 60))
                        chunk.errorNotes.push("Invalid second");
                }],
            ["tRNS", "Transparency", false, function (chunk, earlier) {
                    if (earlier.some(function (ch) { return ch.typeCodeStr == "IDAT"; }))
                        chunk.errorNotes.push("Chunk must be before IDAT chunk");
                }],
            ["zTXt", "Compressed textual data", true, function (chunk, earlier) { }],
        ];
        return ChunkPart;
    }(FilePart));
    /*---- Utility functions ----*/
    function calcCrc32(bytes) {
        var crc = ~0;
        for (var _i = 0, bytes_2 = bytes; _i < bytes_2.length; _i++) {
            var b = bytes_2[_i];
            for (var i = 0; i < 8; i++) {
                crc ^= (b >>> i) & 1;
                crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
            }
        }
        return ~crc >>> 0;
    }
    function bytesToReadableString(bytes) {
        var result = "";
        for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i];
            var cc = b;
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
    function decodeIso8859_1(bytes) {
        var result = "";
        for (var _i = 0, bytes_3 = bytes; _i < bytes_3.length; _i++) {
            var b = bytes_3[_i];
            if (!(0x00 <= b && b <= 0xFF))
                throw "Invalid byte";
            else if (0x80 <= b && b < 0xA0)
                result += "\uFFFD";
            else
                result += String.fromCharCode(b); // ISO-8859-1 is a subset of Unicode
        }
        return result;
    }
    function uintToStrWithThousandsSeparators(val) {
        if (val < 0 || Math.floor(val) != val)
            throw "Invalid unsigned integer";
        var result = val.toString();
        for (var i = result.length - 3; i > 0; i -= 3)
            result = result.substring(0, i) + "\u00A0" + result.substring(i);
        return result;
    }
    function appendElem(container, tagName, text) {
        var result = document.createElement(tagName);
        container.appendChild(result);
        if (text !== undefined)
            result.textContent = text;
        return result;
    }
    function lookUpTable(key, table) {
        var result = null;
        for (var _i = 0, table_1 = table; _i < table_1.length; _i++) {
            var _a = table_1[_i], k = _a[0], v = _a[1];
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
        if (offset < 0 || bytes.length - offset < 4)
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
    /*---- Polyfills ----*/
    if (!("padStart" in String.prototype)) {
        String.prototype.padStart = function (len, padder) {
            var result = this;
            while (result.length < len)
                result = padder.substring(0, Math.min(len - result.length, padder.length)) + result;
            return result;
        };
    }
})(app || (app = {}));
