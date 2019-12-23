/*
 * BitTorrent bencode decoder demo (compiled from TypeScript)
 *
 * Copyright (c) 2019 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/bittorrent-bencode-format-tools
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
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
    /*---- User interface ----*/
    var fileElem = document.querySelector("article input[type='file']");
    fileElem.addEventListener("change", render);
    // Reads the input file, parses its data as bencode, then renders
    // HTML elements to this page in order to represent the data structure.
    function render() {
        var rootElem = document.querySelector("article #file-dissection");
        while (rootElem.firstChild !== null)
            rootElem.removeChild(rootElem.firstChild);
        var files = fileElem.files;
        if (files === null)
            return;
        var reader = new FileReader();
        reader.onload = func;
        reader.readAsArrayBuffer(files[0]);
        function func() {
            try {
                var bytes = new Uint8Array(reader.result);
                var rootVal = BencodeParser.parse(bytes);
                rootElem.appendChild(toHtml(rootVal));
            }
            catch (e) {
                rootElem.textContent = "Error: " + e.toString();
            }
        }
    }
    // Returns a new DOM node to visually represent the given value.
    function toHtml(item) {
        function appendText(container, text) {
            container.appendChild(document.createTextNode(text));
        }
        function appendElem(container, tagName) {
            var result = document.createElement(tagName);
            return container.appendChild(result);
        }
        var result = document.createElement("div");
        result.classList.add("item");
        if (item instanceof BencodeInt) {
            var s = "Integer: " + item.value.replace(/-/, "\u2212");
            appendText(result, s);
        }
        else if (item instanceof BencodeBytes) {
            appendText(result, "Byte string (" + item.value.length + ") ");
            try {
                var s = decodeUtf8(item.value);
                appendText(result, "(text): " + s);
            }
            catch (e) {
                var hex = [];
                for (var _i = 0, _a = item.value; _i < _a.length; _i++) {
                    var c = _a[_i];
                    var s = c.charCodeAt(0).toString(16).toUpperCase();
                    while (s.length < 2)
                        s = "0" + s;
                    hex.push(s);
                }
                appendText(result, "(binary): " + hex.join(" "));
            }
        }
        else if (item instanceof BencodeList || item instanceof BencodeDict) {
            var table = document.createElement("table");
            var tbody_1 = appendElem(table, "tbody");
            function addRow(a, b) {
                var tr = appendElem(tbody_1, "tr");
                var td = appendElem(tr, "td");
                var div = appendElem(td, "div");
                div.textContent = a;
                td = appendElem(tr, "td");
                td.appendChild(b);
            }
            if (item instanceof BencodeList) {
                appendText(result, "List:");
                table.classList.add("list");
                result.appendChild(table);
                item.array.forEach(function (val, i) {
                    return addRow(i.toString(), toHtml(val));
                });
            }
            else if (item instanceof BencodeDict) {
                appendText(result, "Dictionary:");
                table.classList.add("dict");
                result.appendChild(table);
                for (var _b = 0, _c = item.keys; _b < _c.length; _b++) {
                    var key = _c[_b];
                    var val = item.map.get(key);
                    if (val === undefined)
                        throw "Assertion error";
                    addRow(key, toHtml(val));
                }
            }
            else
                throw "Assertion error";
        }
        else
            throw "Assertion error";
        return result;
    }
    // Treats the given byte string as UTF-8, decodes it strictly, and returns a JavaScript UTF-16 string.
    function decodeUtf8(bytes) {
        function cb(i) {
            if (i < 0 || i >= bytes.length)
                throw "Missing continuation bytes";
            var result = bytes.charCodeAt(i);
            if ((result & 192) != 128)
                throw "Invalid continuation byte value";
            return result & 63;
        }
        var result = "";
        for (var i = 0; i < bytes.length; i++) {
            var lead = bytes.charCodeAt(i);
            if (lead < 128) // Single byte ASCII (0xxxxxxx)
                result += bytes.charAt(i);
            else if (lead < 192) // Continuation byte (10xxxxxx)
                throw "Invalid leading byte";
            else if (lead < 224) { // Two bytes (110xxxxx 10xxxxxx)
                var c = (lead & 31) << 6 | cb(i + 1) << 0;
                if (c < (1 << 7))
                    throw "Over-long UTF-8 sequence";
                result += String.fromCharCode(c);
                i += 1;
            }
            else if (lead < 240) { // Three bytes (1110xxxx 10xxxxxx 10xxxxxx)
                var c = (lead & 15) << 12 | cb(i + 1) << 6 | cb(i + 2) << 0;
                if (c < (1 << 11))
                    throw "Over-long UTF-8 sequence";
                if (0xD800 <= c && c < 0xE000)
                    throw "Invalid UTF-8 containing UTF-16 surrogate";
                result += String.fromCharCode(c);
                i += 2;
            }
            else if (lead < 248) { // Four bytes (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)
                var c = (lead & 7) << 18 | cb(i + 1) << 12 | cb(i + 2) << 6 | cb(i + 3);
                if (c < (1 << 16))
                    throw "Over-long UTF-8 sequence";
                if (c >= 0x110000)
                    throw "UTF-8 code point out of range";
                c -= 0x10000;
                result += String.fromCharCode(0xD800 | (c >>> 10), 0xDC00 | (c & 1023));
                i += 3;
            }
            else
                throw "Invalid leading byte";
        }
        return result;
    }
    /*---- Bencode parser ----*/
    var BencodeParser = /** @class */ (function () {
        function BencodeParser(array) {
            this.array = array;
            this.index = 0;
        }
        // Parses the given byte array and returns the bencode value represented by the bytes.
        // The input data must have exactly one root object and then the array must immediately end.
        BencodeParser.parse = function (array) {
            return new BencodeParser(array).parseRoot();
        };
        BencodeParser.prototype.parseRoot = function () {
            var result = this.parseValue(this.readByte());
            if (this.readByte() != -1)
                throw "Unexpected extra data at byte offset " + (this.index - 1);
            return result;
        };
        BencodeParser.prototype.parseValue = function (leadByte) {
            if (leadByte == -1)
                throw "Unexpected end of data at byte offset " + this.index;
            else if (leadByte == cc("i"))
                return this.parseInteger();
            else if (cc("0") <= leadByte && leadByte <= cc("9"))
                return this.parseByteString(leadByte);
            else if (leadByte == cc("l"))
                return this.parseList();
            else if (leadByte == cc("d"))
                return this.parseDictionary();
            else
                throw "Unexpected item type at byte offset " + (this.index - 1);
        };
        BencodeParser.prototype.parseInteger = function () {
            var str = "";
            while (true) {
                var b = this.readByte();
                if (b == -1)
                    throw "Unexpected end of data at byte offset " + this.index;
                var c = String.fromCharCode(b);
                if (c == "e")
                    break;
                var ok = void 0;
                if (str == "")
                    ok = c == "-" || "0" <= c && c <= "9";
                else if (str == "-")
                    ok = "1" <= c && c <= "9";
                else if (str == "0")
                    ok = false;
                else // str starts with [123456789] or -[123456789]
                    ok = "0" <= c && c <= "9";
                if (ok)
                    str += c;
                else
                    throw "Unexpected integer character at byte offset " + (this.index - 1);
            }
            if (str == "" || str == "-")
                throw "Invalid integer syntax at byte offset " + (this.index - 1);
            return new BencodeInt(str);
        };
        BencodeParser.prototype.parseByteString = function (leadByte) {
            var length = this.parseNaturalNumber(leadByte);
            var result = "";
            for (var i = 0; i < length; i++) {
                var b = this.readByte();
                if (b == -1)
                    throw "Unexpected end of data at byte offset " + this.index;
                result += String.fromCharCode(b);
            }
            return new BencodeBytes(result);
        };
        BencodeParser.prototype.parseNaturalNumber = function (leadByte) {
            var str = "";
            var b = leadByte;
            while (b != cc(":")) {
                if (b == -1)
                    throw "Unexpected end of data at byte offset " + this.index;
                else if (str != "0" && cc("0") <= b && b <= cc("9"))
                    str += String.fromCharCode(b);
                else
                    throw "Unexpected integer character at byte offset " + (this.index - 1);
                b = this.readByte();
            }
            if (str == "")
                throw "Invalid integer syntax at byte offset " + (this.index - 1);
            return parseInt(str, 10);
        };
        BencodeParser.prototype.parseList = function () {
            var result = [];
            while (true) {
                var b = this.readByte();
                if (b == cc("e"))
                    break;
                result.push(this.parseValue(b));
            }
            return new BencodeList(result);
        };
        BencodeParser.prototype.parseDictionary = function () {
            var map = new Map();
            var keys = [];
            while (true) {
                var b = this.readByte();
                if (b == cc("e"))
                    break;
                var key = this.parseByteString(b).value;
                if (keys.length > 0 && key <= keys[keys.length - 1])
                    throw "Misordered dictionary key at byte offset " + (this.index - 1);
                keys.push(key);
                b = this.readByte();
                if (b == -1)
                    throw "Unexpected end of data at byte offset " + this.index;
                map.set(key, this.parseValue(b));
            }
            return new BencodeDict(map, keys);
        };
        BencodeParser.prototype.readByte = function () {
            if (this.index >= this.array.length)
                return -1;
            var result = this.array[this.index];
            this.index++;
            return result;
        };
        return BencodeParser;
    }());
    // Returns the numeric code point of the given one-character ASCII string.
    function cc(s) {
        if (s.length != 1)
            throw "Invalid string length";
        return s.charCodeAt(0);
    }
    /*-- Bencode value types --*/
    var BencodeValue = /** @class */ (function () {
        function BencodeValue() {
        }
        return BencodeValue;
    }());
    var BencodeInt = /** @class */ (function (_super) {
        __extends(BencodeInt, _super);
        function BencodeInt(value) {
            var _this = _super.call(this) || this;
            _this.value = value;
            return _this;
        }
        return BencodeInt;
    }(BencodeValue));
    var BencodeBytes = /** @class */ (function (_super) {
        __extends(BencodeBytes, _super);
        function BencodeBytes(value) {
            var _this = _super.call(this) || this;
            _this.value = value;
            return _this;
        }
        return BencodeBytes;
    }(BencodeValue));
    var BencodeList = /** @class */ (function (_super) {
        __extends(BencodeList, _super);
        function BencodeList(array) {
            var _this = _super.call(this) || this;
            _this.array = array;
            return _this;
        }
        return BencodeList;
    }(BencodeValue));
    var BencodeDict = /** @class */ (function (_super) {
        __extends(BencodeDict, _super);
        function BencodeDict(map, keys) {
            var _this = _super.call(this) || this;
            _this.map = map;
            _this.keys = keys;
            return _this;
        }
        return BencodeDict;
    }(BencodeValue));
})(app || (app = {}));
