/*
 * Optimal text segmentation for QR Codes (compiled from TypeScript)
 *
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes
 */
"use strict";
var app;
(function (app) {
    /*---- Preamble definitions ----*/
    function getElem(id) {
        var result = document.getElementById(id);
        if (result instanceof HTMLElement)
            return result;
        throw "Assertion error";
    }
    function getInput(id) {
        var result = getElem(id);
        if (result instanceof HTMLInputElement)
            return result;
        throw "Assertion error";
    }
    var userTextInputElem = getElem("user-text-input");
    var demoTextElem = getElem("demo-text");
    /*---- Entry points from HTML page ----*/
    function demoChanged() {
        userTextInputElem.value = demoTextElem.value;
        textChanged();
    }
    app.demoChanged = demoChanged;
    function textChanged() {
        var text = userTextInputElem.value;
        if (text != demoTextElem.value)
            demoTextElem.selectedIndex = 0; // Indicates custom input
        var minVersion = parseInt(getInput("minimum-version").value, 10);
        var errCorrLvl = getElem("error-correction-level").selectedIndex;
        // Handle code points
        var cps = toCodePoints(text);
        {
            var n = 0;
            for (var _i = 0, cps_1 = cps; _i < cps_1.length; _i++) {
                var cp = cps_1[_i];
                n += countUtf8Bytes(cp) * 8;
            }
            setText("num-code-points", cps.length);
        }
        // Process the byte-only segmentation algorithm
        var byteOnlyInfo = makeSingleByteSegment(cps, errCorrLvl, minVersion, 40);
        if (byteOnlyInfo === null) {
            setText("qr-code-version-byte-only", "Too long");
            setText("num-segments-byte-only", "N/A");
            setText("total-segment-bits-byte-only", "N/A");
        }
        else {
            var version = byteOnlyInfo[0], segs = byteOnlyInfo[1];
            setText("qr-code-version-byte-only", version);
            setText("num-segments-byte-only", segs.length);
            setText("total-segment-bits-byte-only", getTotalBits(segs, version));
        }
        // Clear container elements
        var textOut = getElem("text-split");
        var tableOut = document.querySelector("#segment-details tbody");
        while (textOut.firstChild != null)
            textOut.removeChild(textOut.firstChild);
        while (tableOut.firstChild != null)
            tableOut.removeChild(tableOut.firstChild);
        // Process the optimal segmentation algorithm
        var optimalInfo = makeSegmentsOptimally(cps, errCorrLvl, minVersion, 40);
        if (optimalInfo === null) {
            setText("qr-code-version-optimal", "Too long");
            setText("num-segments-optimal", "N/A");
            setText("total-segment-bits-optimal", "N/A");
        }
        else {
            var version_1 = optimalInfo[0], segs = optimalInfo[1];
            setText("qr-code-version-optimal", version_1);
            setText("num-segments-optimal", segs.length);
            setText("total-segment-bits-optimal", getTotalBits(segs, version_1));
            segs.forEach(function (seg, i) {
                var span = document.createElement("span");
                span.textContent = seg.text;
                span.classList.add(seg.mode.toLowerCase());
                span.title = "Segment index: " + i;
                textOut.appendChild(span);
                var tr = document.createElement("tr");
                tr.classList.add(seg.mode.toLowerCase());
                var cells = [
                    i,
                    seg.mode.charAt(0) + seg.mode.substring(1).toLowerCase(),
                    getTotalBits([seg], version_1) - seg.numDataBits,
                    seg.numDataBits,
                    getTotalBits([seg], version_1),
                    seg.numChars,
                    seg.text,
                ];
                for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
                    var s = cells_1[_i];
                    var td = document.createElement("td");
                    td.textContent = s.toString();
                    tr.appendChild(td);
                }
                tableOut.appendChild(tr);
            });
        }
        // Process the comparison between segmentation algorithms
        if (byteOnlyInfo === null || optimalInfo === null) {
            var INFINITY = "\u221E";
            setText("qr-code-version-savings", INFINITY);
            setText("total-segment-bits-savings", INFINITY);
        }
        else {
            setText("qr-code-version-savings", byteOnlyInfo[0] - optimalInfo[0]);
            var byteOnlyBits = getTotalBits(byteOnlyInfo[1], byteOnlyInfo[0]);
            var optimalBits = getTotalBits(optimalInfo[1], optimalInfo[0]);
            setText("total-segment-bits-savings", byteOnlyBits - optimalBits + " (" + (optimalBits / byteOnlyBits).toFixed(2) + "\u00D7)");
        }
    }
    app.textChanged = textChanged;
    function revealElement(link, targetId) {
        var linkParent = link.parentNode;
        while (link.firstChild != null)
            linkParent.appendChild(link.firstChild);
        linkParent.removeChild(link);
        var target = getElem(targetId);
        target.style.removeProperty("display");
        var newHeight = target.clientHeight;
        target.style.height = "0px";
        target.style.overflow = "hidden";
        target.style.transition = "height 0.5s ease-in-out";
        target.addEventListener("transitionend", function (ev) {
            if (ev.propertyName == "height") {
                target.style.removeProperty("height");
                target.style.removeProperty("overflow");
                target.style.removeProperty("transition");
            }
        });
        target.offsetLeft; // Read property to force reflow in Firefox
        target.style.height = newHeight + "px";
        return false;
    }
    app.revealElement = revealElement;
    /*---- High-level computation functions ----*/
    function makeSingleByteSegment(codePoints, ecl, minVersion, maxVersion) {
        if (!(0 <= ecl && ecl <= 3))
            throw "Invalid error correction level";
        if (!(1 <= minVersion && minVersion <= maxVersion && maxVersion <= 40))
            throw "Invalid version range";
        // Iterate through version numbers, and make tentative segments
        var segs = [new Segment(codePoints, "BYTE")];
        for (var version = minVersion; version <= maxVersion; version++) {
            // Check if the segments fit
            var dataCapacityBits = NUM_DATA_CODEWORDS[version][ecl] * 8;
            var dataUsedBits = getTotalBits(segs, version);
            if (dataUsedBits <= dataCapacityBits)
                return [version, segs];
        }
        // The data is too long to fit in any QR Code symbol at any version in
        // the range [minVersion, maxVersion] with ecl level error correction
        return null;
    }
    function makeSegmentsOptimally(codePoints, ecl, minVersion, maxVersion) {
        if (!(0 <= ecl && ecl <= 3))
            throw "Invalid error correction level";
        if (!(1 <= minVersion && minVersion <= maxVersion && maxVersion <= 40))
            throw "Invalid version range";
        // Iterate through version numbers, and make tentative segments
        var segs = []; // Dummy initial value
        for (var version = minVersion; version <= maxVersion; version++) {
            if (version == minVersion || version == 10 || version == 27)
                segs = makeSegmentsOptimallyForVersion(codePoints, version);
            // Check if the segments fit
            var dataCapacityBits = NUM_DATA_CODEWORDS[version][ecl] * 8;
            var dataUsedBits = getTotalBits(segs, version);
            if (dataUsedBits <= dataCapacityBits)
                return [version, segs];
        }
        // The data is too long to fit in any QR Code symbol at any version in
        // the range [minVersion, maxVersion] with ecl level error correction
        return null;
    }
    function makeSegmentsOptimallyForVersion(codePoints, version) {
        if (codePoints.length == 0)
            return [];
        var charModes = computeCharacterModes(codePoints, version);
        return splitIntoSegments(codePoints, charModes);
    }
    function computeCharacterModes(codePoints, version) {
        if (codePoints.length == 0)
            throw "Empty string";
        var modeTypes = ["BYTE", "ALPHANUMERIC", "NUMERIC", "KANJI"];
        // Segment header sizes, measured in 1/6 bits
        var headCosts = modeTypes.map(function (mode) {
            return (4 + getNumCharCountBits(mode, version)) * 6;
        });
        // charModes[i][j] represents the mode to encode the code point at
        // index i such that the final segment ends in modeTypes[j] and the
        // total number of bits is minimized over all possible choices
        var charModes = [];
        // At the beginning of each iteration of the loop below,
        // prevCosts[j] is the exact minimum number of 1/6 bits needed to
        // encode the entire string prefix of length i, and end in modeTypes[j]
        var prevCosts = headCosts.slice();
        // Calculate costs using dynamic programming
        codePoints.forEach(function (c, i) {
            var cModes = modeTypes.map(function (_) { return null; });
            var curCosts = modeTypes.map(function (_) { return Infinity; });
            { // Always extend a bytes segment
                curCosts[0] = prevCosts[0] + countUtf8Bytes(c) * 8 * 6;
                cModes[0] = modeTypes[0];
            }
            // Extend a segment if possible
            if (isAlphanumeric(c)) {
                curCosts[1] = prevCosts[1] + 33; // 5.5 bits per alphanumeric char
                cModes[1] = modeTypes[1];
            }
            if (isNumeric(c)) {
                curCosts[2] = prevCosts[2] + 20; // 3.33 bits per digit
                cModes[2] = modeTypes[2];
            }
            if (isKanji(c)) {
                curCosts[3] = prevCosts[3] + 78; // 13 bits per Shift JIS char
                cModes[3] = modeTypes[3];
            }
            // Start new segment at the end to switch modes
            modeTypes.forEach(function (_, j) {
                modeTypes.forEach(function (fromMode, k) {
                    var newCost = Math.ceil(curCosts[k] / 6) * 6 + headCosts[j];
                    if (cModes[k] != null && newCost < curCosts[j]) {
                        curCosts[j] = newCost;
                        cModes[j] = fromMode;
                    }
                });
            });
            charModes.push(cModes);
            prevCosts = curCosts;
        });
        // Find optimal ending mode
        var curModeIndex = 0;
        modeTypes.forEach(function (mode, i) {
            if (prevCosts[i] < prevCosts[curModeIndex])
                curModeIndex = i;
        });
        // Get optimal mode for each code point by tracing backwards
        var result = [];
        for (var i = codePoints.length - 1; i >= 0; i--) {
            curModeIndex = modeTypes.indexOf(charModes[i][curModeIndex]);
            result.push(modeTypes[curModeIndex]);
        }
        result.reverse();
        return result;
    }
    function splitIntoSegments(codePoints, charModes) {
        if (codePoints.length == 0)
            throw "Empty string";
        if (codePoints.length != charModes.length)
            throw "Mismatched lengths";
        var result = [];
        // Accumulate run of modes
        var curMode = charModes[0];
        var start = 0;
        for (var i = 1;; i++) {
            if (i < codePoints.length && charModes[i] == curMode)
                continue;
            result.push(new Segment(codePoints.slice(start, i), curMode));
            if (i >= codePoints.length)
                return result;
            curMode = charModes[i];
            start = i;
        }
    }
    var Segment = /** @class */ (function () {
        function Segment(codePoints, mode) {
            this.mode = mode;
            if (mode == "BYTE") {
                this.numChars = 0;
                this.text = "";
                for (var i = 0; i < codePoints.length; i++) {
                    var c = codePoints[i];
                    this.numChars += countUtf8Bytes(c);
                    if (c < 0x10000)
                        this.text += String.fromCharCode(c);
                    else {
                        this.text += String.fromCharCode(0xD800 | ((c - 0x10000) >>> 10), 0xDC00 | ((c - 0x10000) & 0x3FF));
                    }
                }
                this.numDataBits = this.numChars * 8;
            }
            else {
                var n = codePoints.length;
                this.numChars = n;
                this.text = codePoints.map(function (cp) { return String.fromCharCode(cp); }).join("");
                switch (mode) {
                    case "NUMERIC":
                        this.numDataBits = Math.ceil(n * 10 / 3);
                        break;
                    case "ALPHANUMERIC":
                        this.numDataBits = Math.ceil(n * 11 / 2);
                        break;
                    case "KANJI":
                        this.numDataBits = n * 13;
                        break;
                    default:
                        throw "Invalid mode";
                }
            }
        }
        return Segment;
    }());
    // Calculates and returns the number of bits needed to encode the given segments at the given
    // version. The result is infinity if a segment has too many characters to fit its length field.
    function getTotalBits(segs, version) {
        var result = 0;
        for (var i = 0; i < segs.length; i++) {
            var seg = segs[i];
            var ccbits = getNumCharCountBits(seg.mode, version);
            if (seg.numChars >= (1 << ccbits))
                return Infinity; // The segment's length doesn't fit the field's bit width
            result += 4 + ccbits + seg.numDataBits;
        }
        return result;
    }
    /*---- Low-level computation functions ----*/
    // Converts the given UTF-16 string to a new array of Unicode code points (effectively UTF-32 / UCS-4).
    function toCodePoints(s) {
        var result = [];
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (0xD800 <= c && c < 0xDC00) { // High surrogate
                if (i + 1 >= s.length)
                    throw "Invalid UTF-16 string";
                i++;
                var d = s.charCodeAt(i);
                result.push(((c & 0x3FF) << 10 | (d & 0x3FF)) + 0x10000);
            }
            else if (0xDC00 <= c && c < 0xE000) // Low surrogate
                throw "Invalid UTF-16 string";
            else
                result.push(c);
        }
        return result;
    }
    // Returns the number of UTF-8 bytes needed to encode the given Unicode code point.
    function countUtf8Bytes(cp) {
        if (cp < 0)
            throw "Invalid code point";
        else if (cp < 0x80)
            return 1;
        else if (cp < 0x800)
            return 2;
        else if (cp < 0x10000)
            return 3;
        else if (cp < 0x110000)
            return 4;
        else
            throw "Invalid code point";
    }
    // Returns the bit width of the segment character count field for the given mode at the given version number.
    function getNumCharCountBits(mode, version) {
        if (version < 1 || version > 40)
            throw "Invalid version";
        return {
            NUMERIC: [10, 12, 14],
            ALPHANUMERIC: [9, 11, 13],
            BYTE: [8, 16, 16],
            KANJI: [8, 10, 12],
        }[mode][Math.floor((version + 7) / 17)];
    }
    // NUM_DATA_CODEWORDS[v][e] is the number of 8-bit data codewords (excluding error correction codewords)
    // in a QR Code symbol at version v (from 1 to 40 inclusive) and error correction e (0=L, 1=M, 2=Q, 3=H).
    var NUM_DATA_CODEWORDS = [
        //  L,    M,    Q,    H    // Error correction level
        [-1, -1, -1, -1],
        [19, 16, 13, 9],
        [34, 28, 22, 16],
        [55, 44, 34, 26],
        [80, 64, 48, 36],
        [108, 86, 62, 46],
        [136, 108, 76, 60],
        [156, 124, 88, 66],
        [194, 154, 110, 86],
        [232, 182, 132, 100],
        [274, 216, 154, 122],
        [324, 254, 180, 140],
        [370, 290, 206, 158],
        [428, 334, 244, 180],
        [461, 365, 261, 197],
        [523, 415, 295, 223],
        [589, 453, 325, 253],
        [647, 507, 367, 283],
        [721, 563, 397, 313],
        [795, 627, 445, 341],
        [861, 669, 485, 385],
        [932, 714, 512, 406],
        [1006, 782, 568, 442],
        [1094, 860, 614, 464],
        [1174, 914, 664, 514],
        [1276, 1000, 718, 538],
        [1370, 1062, 754, 596],
        [1468, 1128, 808, 628],
        [1531, 1193, 871, 661],
        [1631, 1267, 911, 701],
        [1735, 1373, 985, 745],
        [1843, 1455, 1033, 793],
        [1955, 1541, 1115, 845],
        [2071, 1631, 1171, 901],
        [2191, 1725, 1231, 961],
        [2306, 1812, 1286, 986],
        [2434, 1914, 1354, 1054],
        [2566, 1992, 1426, 1096],
        [2702, 2102, 1502, 1142],
        [2812, 2216, 1582, 1222],
        [2956, 2334, 1666, 1276],
    ];
    // Tests whether the given code point can be encoded in numeric mode.
    function isNumeric(cp) {
        return cp < 128 && "0123456789".indexOf(String.fromCharCode(cp)) != -1;
    }
    // Tests whether the given code point can be encoded in alphanumeric mode.
    function isAlphanumeric(cp) {
        return cp < 128 && "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".indexOf(String.fromCharCode(cp)) != -1;
    }
    // Tests whether the given code point can be encoded in kanji mode.
    function isKanji(cp) {
        return cp < 0x10000 && ((parseInt(KANJI_BIT_SET.charAt(cp >>> 2), 16) >>> (cp & 3)) & 1) != 0;
    }
    var KANJI_BIT_SET = "0000000000000000000000010000000000000000C811350000000800000008000000000000000000000000000000000000000000000000000000000000000000" +
        "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000EFFFBF30EFFFBF30000000000000" +
        "2000FFFFFFFFFFFFFFFF200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "000016333600D080000000000000000000000000000000000000000000000000800000000080000000000000000000000000F000000000000000410000000000" +
        "D890404618F10302000040003CC00000CC0000000200000000000000000000000000400000000000000000000000000000000000000000000000000000000000" +
        "0000000000000000000000000000000000000000000000000000000000000000F0099993939999994080000000000000000000003000C0030C8C000000080000" +
        "060000000000000050000000004A0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "FEFFF30100000000EFFFFFFFFFFFFFFFFFFFF087EFFFFFFFFFFFFFFFFFFFF7870000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "B8F63F34244264B9C28E0E3E4000A00456F563BD779794407DCE0F3E83065C80206E3043000815538C0EBAE700289689849A2492308E0608C14439DAA30C8654" +
        "06AA6568A7F304208838164102014712120220700003CB04426A26448A0602A071204758204048C9BFB7514142F72E11566BFE2057F1FF0207A304833C623676" +
        "9DD429020B649CF089CB05848368F30A8832618890E32325AA224A3EDD00C27C661A1E62B048A0F8BE72E955142CBB984100045816369480C0F70DA8E3FFFC50" +
        "A1FF308A14A704B7547420080050BE83158D50004399C01779300010663640420D081500000CA03417098C038000008599E0007F08F514000B00014981000826" +
        "04200D90002865104005108001D101501C48010052040501F014A8D49004D06A91BAC4190C121890584C30002560000840B08000D14090009484C50990000961" +
        "56C002222148334230C0697440A0522482008809009480F42A41AA3D038D78E3406816F14AE76814093C3B505A758112E14284A2821140A404A0B16106D00488" +
        "A0202059122806013420004044410008000040C00000000760A11C00A42000C000A104004041540492003BDB87A0B2509ABB0AFBC7049738CF21D18E6FB4965C" +
        "6FFEA440511220FF36DEB204330D24200001310020B1AC950A000020307A14C208842FF840200000008550010029840049811002400508430023C486AE94EB86" +
        "C48124E2028A9C129B050B08E100C7FFA9480E411C820E10E07894CAF031BDDDA1EBBF980E2A2A152055AC2364E3B829FBD1F8343076812382030C331180329A" +
        "000C56A33EF82040E4C25268D3FB1A00A1A34DC89C60C7130E00A059B810BDE0B43E02C82811010F49D7827ACA9CBF044844356009A544448CF3100084004D5F" +
        "107775CE244CD19838B682949014242DD160EF95008122A34E7BF9B3300FAE0C683120280898004E002B1A0108B44CC0903D4498FAF14384952854C0A0240540" +
        "040A8C010413054440040010082804508010C24403A650A16A024150FC0965461200001381C90FBC021A2E36C4015B10C83538A92B8B1823A78948A07E3320C0" +
        "CC4D81091A1A0709E1A8400E4D3C1540A9342C1244840135292004631420DB3F90BA0F8E0CD72D5A242CB42DF34AFA0D0AA11A4374288D30254CB156492DA38C" +
        "C1008C0460E04133F416B12B88000D0CA20A898A5C1AB66105E24B58B80C4060339F40E1E650152A0040836770CE8B37604423811804618CA8C79036089240AA" +
        "42C1C9ACE0E40672099000386400401811061801D0458090E000A0CC005000C00340440AB8004876882591A8E56881B895E2061401C8EBC91686C19800898000" +
        "0018A9808100091470041A4E5050D046E013D4E06084A0FF23618AA2E258B000008148AC02E0C6962300006185650930021582A1000842111E81623425D5AAE0" +
        "0AF082EAB7AF005480460498088C440C5009141B42484C4243A1A3060009491C6428A300D081601C22000199050E115175042800A140A020F4000398318DA444" +
        "20A822DE0C015004000120108088101300644020000F80700098002A000020220020016124000401002506204F250002015803280011202480345B081E0702A9" +
        "04021080005356CF1C9140BA682041267800440058094420C50458A07023083300400C8B02EC0D0C030C0800805052D009A004000020C0805056000412462014" +
        "862000004200C748200002ED91689404808000044800100200480101DC247C108307A25D8691F8D105EB21E35FE29D184CEC21428280E237CA4243B4C020D14D" +
        "20A20008790011804C114411687154D79D94946000041978C4524C8DAB44419429B1008C17200851180000C0A690002C00842004120394AB080208C1CA2E8001" +
        "400143001E00414802000002008941012C07AA408868024526C03140081901022804602004C1004538309E4E52120848334E00020C44906E30A06218AD211080" +
        "109609791004688FD42E1800E0A0156AA110CE18006C14488BDAC26BF64A147845D820B41611862006BB75020A0533400C8A4B7B204221103DA9000217228C00" +
        "1802E908A8C0081E900B151813018204E0A25A986B96E0265244441D580845D457C21BF1708DD268C78D1484E414E622002880E9C08F73DE08C8625731394180" +
        "23E0408CE4846AE6A4C207660C6210ABC03DD58100000000000000000000000000000000000004500207331818F45A30CE550146813C44322641430034A090A1" +
        "B7815A312010848A0440445C6018DD2E0FA184D2626B6140850504E6230821134E7000C08028A0240484B30806843178D05882439130925E5432A0789A5281C5" +
        "6A775C9D00E58E301800007A45DC6C140082402A068BA0B20200E9ADAE80A1E0C7240C11809867301268501000008A810A64844C50D022022245841910A87982" +
        "898780005061221304240880E4AF2A6041801129200240B925E23460000501091400AB5824030202B0F40A5080720804195039A105FD0060202A1203036008E4" +
        "4CC08C40400A10080006134D088020A000C1820081E814000DA601AC012F00B4D47260510220098800A58A289454051840020008408880C21D80500010084CA4" +
        "020E2600E80024A05503C8A6E0905A0E60924C2441843B08E308033B2010C1374941D00602C00490A103040C154A490CACD88C502C69C04A100040438C000110" +
        "D0559C9A8242A5C124107384D4A7F0014B23A254B7135029498B44C57D86A85479051DE234918024202D04D9048979029045D460000000000000000000000000" +
        "00000000000008482455124060C100714267011678FFDD9BF956A0C5D54200C30BDA950000000000000000000D82B9002240002080108044408904CAA0D88209" +
        "0078100E0040130049711228910045012BC2A12020C9300406D34088C08000978261C3AB046880BC47270809E10000000000008D881E78C94304214046EA1972" +
        "B68EBF6EF80466356AEEF735B23E4E5BF9682000845822102044008061120A02400040200002500000E74510C261CA1048A2580141C803503CBF349BAC000609" +
        "000623040021090803B018C4450020049200A6D100020820000840000162C05104081070D49D42C0018205811005020500010D400807102080103C1223100000" +
        "88009170208006502100E0C450401A0F2000000000000000000000000000000000000000000000000000000000000800D8E8A530DB1240A58843071162000000" +
        "00000001205C4088518B108FC741DE5206DE0BB198507DB13FA726A1C0D05CA01D5EA425094050364530442575B22161278A101194928100849080010006C688" +
        "E619F85021030993048F03940888B10000000000005824008500008940AE41078261D1163115000642A17A000000000000000C30021781012710729A40066098" +
        "220CC02000901804D2020AC843E0000000000000001210111108A11CC4CE298004000058CA7C6081E30E2150000801008004EC0810D6012014686580E1107200" +
        "0573D380230E50E40C104840180004100000000000000000000000000AA195008C34428884D1008C25103027310940400828004001A841D065088020040A4072" +
        "000000C400000000000000000000023A2091EA0A066200FD010F51B712180DA3081482003001008400CC4108FC414C0000020203100000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "0000000000000000000000000000000000000000000000000000000000000000A7FDFFFFFFFFFFFEFFFFFFF30000000000000000000000000000000082000000";
    /*---- Miscellaneous ----*/
    function setText(id, text) {
        getElem(id).textContent = text.toString();
    }
    // Initialization
    if (demoTextElem.value != "")
        demoChanged();
    else
        textChanged();
})(app || (app = {}));
