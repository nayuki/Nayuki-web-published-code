/*
 * Step-by-step QR Code generation
 *
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/
 */
"use strict";
/*---- Main QR Code class ----*/
class QrCode {
    // Creates a QR Code containing a grid of initially unfilled modules.
    constructor(version, errorCorrectionLevel) {
        this.version = version;
        this.errorCorrectionLevel = errorCorrectionLevel;
        this.modules = []; // Has dimensions of size * size.
        if (version < QrCode.MIN_VERSION || version > QrCode.MAX_VERSION)
            throw "Version number out of range";
        this.size = version * 4 + 17;
        for (let x = 0; x < this.size; x++) {
            let column = [];
            for (let y = 0; y < this.size; y++)
                column.push(new UnfilledModule());
            this.modules.push(column);
        }
    }
    /*-- Static functions --*/
    static getNumRawDataModules(ver) {
        if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION)
            throw "Version number out of range";
        let result = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
            let numAlign = Math.floor(ver / 7) + 2;
            result -= (25 * numAlign - 10) * numAlign - 55;
            if (ver >= 7)
                result -= 36;
        }
        return result;
    }
    static getNumDataCodewords(ver, ecl) {
        return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
            QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
                QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    }
    /*-- Methods --*/
    // Modifies modules in this QR Code.
    clearNewFlags() {
        for (let column of this.modules) {
            for (let m of column) {
                if (m instanceof FilledModule)
                    m.isNew = false;
            }
        }
    }
    // Modifies modules in this QR Code.
    drawTimingPatterns() {
        for (let i = 0; i < this.size; i++) {
            this.modules[6][i] = new FunctionModule(FunctionModuleType.TIMING, i % 2 == 0);
            this.modules[i][6] = new FunctionModule(FunctionModuleType.TIMING, i % 2 == 0);
        }
    }
    // Modifies modules in this QR Code.
    drawFinderPatterns() {
        const centers = [
            [3, 3],
            [this.size - 4, 3],
            [3, this.size - 4],
        ];
        for (const [cx, cy] of centers) {
            for (let dy = -4; dy <= 4; dy++) {
                for (let dx = -4; dx <= 4; dx++) {
                    const dist = Math.max(Math.abs(dx), Math.abs(dy));
                    const x = cx + dx;
                    const y = cy + dy;
                    if (0 <= x && x < this.size && 0 <= y && y < this.size) {
                        this.modules[x][y] = new FunctionModule(dist <= 3 ? FunctionModuleType.FINDER : FunctionModuleType.SEPARATOR, dist != 2 && dist != 4);
                    }
                }
            }
        }
    }
    // Modifies modules in this QR Code.
    drawAlignmentPatterns() {
        if (this.version == 1)
            return;
        let positions = [6];
        const numAlign = Math.floor(this.version / 7) + 2;
        const step = (this.version == 32) ? 26 :
            Math.ceil((this.size - 13) / (numAlign * 2 - 2)) * 2;
        for (let pos = this.size - 7; positions.length < numAlign; pos -= step)
            positions.splice(1, 0, pos);
        positions.forEach((cx, i) => {
            positions.forEach((cy, j) => {
                if (i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)
                    return;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        this.modules[cx + dx][cy + dy] = new FunctionModule(FunctionModuleType.ALIGNMENT, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
                    }
                }
            });
        });
    }
    // Modifies modules in this QR Code.
    drawFormatBits(mask) {
        let bits = 0;
        if (mask != -1) {
            const data = this.errorCorrectionLevel.formatBits << 3 | mask;
            let rem = data;
            for (let i = 0; i < 10; i++)
                rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            bits = (data << 10 | rem) ^ 0x5412;
        }
        if (bits >>> 15 != 0)
            throw "Assertion error";
        let setFormatInfoModule = (x, y, bitIndex) => {
            this.modules[x][y] = new FunctionModule(FunctionModuleType.FORMAT_INFO, QrCode.getBit(bits, bitIndex));
        };
        for (let i = 0; i <= 5; i++)
            setFormatInfoModule(8, i, i);
        setFormatInfoModule(8, 7, 6);
        setFormatInfoModule(8, 8, 7);
        setFormatInfoModule(7, 8, 8);
        for (let i = 9; i < 15; i++)
            setFormatInfoModule(14 - i, 8, i);
        for (let i = 0; i < 8; i++)
            setFormatInfoModule(this.size - 1 - i, 8, i);
        for (let i = 8; i < 15; i++)
            setFormatInfoModule(8, this.size - 15 + i, i);
        this.modules[8][this.size - 8] = new FunctionModule(FunctionModuleType.BLACK, true);
    }
    // Modifies modules in this QR Code.
    drawVersionInformation() {
        if (this.version < 7)
            return;
        let rem = this.version;
        for (let i = 0; i < 12; i++)
            rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
        const bits = this.version << 12 | rem;
        if (bits >>> 18 != 0)
            throw "Assertion error";
        for (let i = 0; i < 18; i++) {
            const color = QrCode.getBit(bits, i);
            const a = this.size - 11 + i % 3;
            const b = Math.floor(i / 3);
            this.modules[a][b] = new FunctionModule(FunctionModuleType.VERSION_INFO, color);
            this.modules[b][a] = new FunctionModule(FunctionModuleType.VERSION_INFO, color);
        }
    }
    // Reads the argument array but doesn't change it, changes
    // the underlying codeword objects, and returns a new array.
    // Reads this QR Code's version and ECL, but doesn't change its state.
    splitIntoBlocks(data) {
        const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[this.errorCorrectionLevel.ordinal][this.version];
        const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[this.errorCorrectionLevel.ordinal][this.version];
        const rawCodewords = Math.floor(QrCode.getNumRawDataModules(this.version) / 8);
        const numShortBlocks = numBlocks - rawCodewords % numBlocks;
        const shortBlockLen = Math.floor(rawCodewords / numBlocks);
        let result = [];
        for (let blockIndex = 0, off = 0; blockIndex < numBlocks; blockIndex++) {
            const end = off + shortBlockLen - blockEccLen + (blockIndex < numShortBlocks ? 0 : 1);
            let block = data.slice(off, end);
            block.forEach((cw, indexInBlock) => {
                cw.blockIndex = blockIndex;
                cw.indexInBlock = indexInBlock;
            });
            result.push(block);
            off = end;
        }
        return result;
    }
    // Reads the argument array but doesn't change it, changes
    // the underlying codeword objects, and returns a new array.
    // Reads this QR Code's version and ECL, but doesn't change its state.
    computeEccForBlocks(blocks) {
        const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[this.errorCorrectionLevel.ordinal][this.version];
        const shortBlockDataLen = blocks[0].length;
        const rs = new ReedSolomonGenerator(blockEccLen);
        let preInterleaveIndex = 0;
        return blocks.map((block, blockIndex) => {
            for (let cw of block) {
                cw.preInterleaveIndex = preInterleaveIndex;
                preInterleaveIndex++;
            }
            const blockBytes = block.map(cw => cw.value);
            const eccBytes = rs.getRemainder(blockBytes);
            return eccBytes.map((b, i) => {
                let cw = new EccCodeword(b);
                cw.preInterleaveIndex = preInterleaveIndex;
                preInterleaveIndex++;
                cw.blockIndex = blockIndex;
                cw.indexInBlock = shortBlockDataLen + 1 + i;
                return cw;
            });
        });
    }
    // Reads the argument arrays but doesn't change them, changes
    // the underlying codeword objects, and returns a new array.
    // Doesn't read or change this QR Code's state.
    interleaveBlocks(data, ecc) {
        const blockEccLen = ecc[0].length;
        const maxBlockDataLen = data[data.length - 1].length;
        let result = [];
        for (let i = 0; i < maxBlockDataLen; i++) {
            data.forEach(block => {
                if (i < block.length) {
                    let cw = block[i];
                    cw.postInterleaveIndex = result.length;
                    result.push(cw);
                }
            });
        }
        for (let i = 0; i < blockEccLen; i++) {
            ecc.forEach(block => {
                let cw = block[i];
                cw.postInterleaveIndex = result.length;
                result.push(cw);
            });
        }
        return result;
    }
    // Can only be called after all function modules have been drawn.
    // Reads this QR Code's modules, but doesn't change them.
    makeZigZagScan() {
        let result = [];
        for (let right = this.size - 1; right >= 1; right -= 2) {
            if (right == 6)
                right = 5;
            for (let vert = 0; vert < this.size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = right - j;
                    const upward = ((right + 1) & 2) == 0;
                    const y = upward ? this.size - 1 - vert : vert;
                    if (!(this.modules[x][y] instanceof FunctionModule))
                        result.push([x, y]);
                }
            }
        }
        return result;
    }
    // Modifies this QR Code's modules.
    drawCodewords(codewords, zigZagScan) {
        if (codewords.length != Math.floor(QrCode.getNumRawDataModules(this.version) / 8))
            throw "Invalid argument";
        zigZagScan.forEach(([x, y], i) => {
            if (i < codewords.length * 8) {
                let cw = codewords[i >>> 3];
                this.modules[x][y] = new CodewordModule(QrCode.getBit(cw.value, 7 - (i & 7)));
                i++;
            }
            else
                this.modules[x][y] = new RemainderModule();
        });
    }
    // Can only be called after all function modules have been drawn.
    // Reads this QR Code's modules, but doesn't change them.
    makeMask(mask) {
        let result = new QrCode(this.version, this.errorCorrectionLevel);
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                let invert;
                switch (mask) {
                    case 0:
                        invert = (x + y) % 2 == 0;
                        break;
                    case 1:
                        invert = y % 2 == 0;
                        break;
                    case 2:
                        invert = x % 3 == 0;
                        break;
                    case 3:
                        invert = (x + y) % 3 == 0;
                        break;
                    case 4:
                        invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;
                        break;
                    case 5:
                        invert = x * y % 2 + x * y % 3 == 0;
                        break;
                    case 6:
                        invert = (x * y % 2 + x * y % 3) % 2 == 0;
                        break;
                    case 7:
                        invert = ((x + y) % 2 + x * y % 3) % 2 == 0;
                        break;
                    default: throw "Assertion error";
                }
                if (!(this.modules[x][y] instanceof FunctionModule))
                    result.modules[x][y] = new MaskModule(invert);
            }
        }
        return result;
    }
    // Can only be called after all codeword modules have been drawn.
    // Modifies this QR Code's modules.
    applyMask(mask) {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const a = mask.modules[x][y];
                let b = this.modules[x][y];
                if (a instanceof MaskModule && b instanceof FilledModule) {
                    b.color = b.color != a.color;
                }
            }
        }
    }
    // Can only be called after all modules have been drawn.
    // Reads this QR Code's modules, but doesn't change them.
    computePenalties() {
        function addRunToHistory(run, history) {
            history.pop();
            history.unshift(run);
        }
        function hasFinderLikePattern(runHistory) {
            const n = runHistory[1];
            return n > 0 && runHistory[2] == n && runHistory[4] == n && runHistory[5] == n
                && runHistory[3] == n * 3 && Math.max(runHistory[0], runHistory[6]) >= n * 4;
        }
        let penalties = [0, 0, 0, 0];
        const colors = this.modules.map(column => column.map(cell => cell instanceof FilledModule && cell.color));
        let horzRuns = [];
        let horzFinders = [];
        for (let y = 0; y < this.size; y++) {
            let runHistory = [0, 0, 0, 0, 0, 0, 0];
            let color = false;
            let runLen = 0;
            for (let x = 0;; x++) {
                if (x < this.size && colors[x][y] == color)
                    runLen++;
                else {
                    if (runLen >= 5) {
                        penalties[0] += QrCode.PENALTY_N1 + runLen - 5;
                        horzRuns.push(new LinearRun(x - runLen, y, runLen));
                    }
                    addRunToHistory(runLen, runHistory);
                    if (x >= this.size && color) {
                        addRunToHistory(0, runHistory);
                        color = false;
                    }
                    if (!color && hasFinderLikePattern(runHistory)) {
                        penalties[2] += QrCode.PENALTY_N3;
                        const n = sumArray(runHistory);
                        horzFinders.push(new LinearRun(x - n, y, n));
                    }
                    if (x >= this.size)
                        break;
                    color = colors[x][y];
                    runLen = 1;
                }
            }
        }
        let vertRuns = [];
        let vertFinders = [];
        for (let x = 0; x < this.size; x++) {
            let runHistory = [0, 0, 0, 0, 0, 0, 0];
            let color = false;
            let runLen = 0;
            for (let y = 0;; y++) {
                if (y < this.size && colors[x][y] == color)
                    runLen++;
                else {
                    if (runLen >= 5) {
                        penalties[0] += QrCode.PENALTY_N1 + runLen - 5;
                        vertRuns.push(new LinearRun(x, y - runLen, runLen));
                    }
                    addRunToHistory(runLen, runHistory);
                    if (y >= this.size && color) {
                        addRunToHistory(0, runHistory);
                        color = false;
                    }
                    if (!color && hasFinderLikePattern(runHistory)) {
                        penalties[2] += QrCode.PENALTY_N3;
                        const n = sumArray(runHistory);
                        vertFinders.push(new LinearRun(x, y - n, n));
                    }
                    if (y >= this.size)
                        break;
                    color = colors[x][y];
                    runLen = 1;
                }
            }
        }
        let twoByTwos = [];
        for (let x = 0; x < this.size - 1; x++) {
            for (let y = 0; y < this.size - 1; y++) {
                const c = colors[x][y];
                if (c == colors[x + 1][y] && c == colors[x][y + 1] && c == colors[x + 1][y + 1]) {
                    penalties[1] += QrCode.PENALTY_N2;
                    twoByTwos.push([x, y]);
                }
            }
        }
        let black = 0;
        for (const column of colors) {
            for (const color of column) {
                if (color)
                    black++;
            }
        }
        const total = this.size * this.size;
        let k = 0;
        while (Math.abs(black * 20 - total * 10) > (k + 1) * total)
            k++;
        penalties[3] += k * QrCode.PENALTY_N4;
        return new PenaltyInfo(horzRuns, vertRuns, twoByTwos, horzFinders, vertFinders, black, penalties);
    }
    static getBit(x, i) {
        return ((x >>> i) & 1) != 0;
    }
}
/*-- Constants and tables --*/
QrCode.MIN_VERSION = 1;
QrCode.MAX_VERSION = 40;
QrCode.PENALTY_N1 = 3;
QrCode.PENALTY_N2 = 3;
QrCode.PENALTY_N3 = 40;
QrCode.PENALTY_N4 = 10;
QrCode.ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];
/*---- Helper classes for QrCode ----*/
// An enum type.
class ErrorCorrectionLevel {
    constructor(ordinal, formatBits) {
        this.ordinal = ordinal;
        this.formatBits = formatBits;
    }
}
ErrorCorrectionLevel.LOW = new ErrorCorrectionLevel(0, 1);
ErrorCorrectionLevel.MEDIUM = new ErrorCorrectionLevel(1, 0);
ErrorCorrectionLevel.QUARTILE = new ErrorCorrectionLevel(2, 3);
ErrorCorrectionLevel.HIGH = new ErrorCorrectionLevel(3, 2);
class Codeword {
    constructor(value) {
        this.value = value;
        this.preInterleaveIndex = -1;
        this.blockIndex = -1;
        this.indexInBlock = -1;
        this.postInterleaveIndex = -1;
        if (value < 0 || value > 255)
            throw "Invalid value";
    }
}
class DataCodeword extends Codeword {
    constructor(value) {
        super(value);
        this.preEccIndex = -1;
    }
}
class EccCodeword extends Codeword {
    constructor(value) {
        super(value);
    }
}
// Computation for QrCode.computeEccForBlocks().
class ReedSolomonGenerator {
    constructor(degree) {
        this.coefficients = [];
        if (degree < 1 || degree > 255)
            throw "Degree out of range";
        let coefs = this.coefficients;
        for (let i = 0; i < degree - 1; i++)
            coefs.push(0);
        coefs.push(1);
        let root = 1;
        for (let i = 0; i < degree; i++) {
            for (let j = 0; j < coefs.length; j++) {
                coefs[j] = ReedSolomonGenerator.multiply(coefs[j], root);
                if (j + 1 < coefs.length)
                    coefs[j] ^= coefs[j + 1];
            }
            root = ReedSolomonGenerator.multiply(root, 0x02);
        }
    }
    getRemainder(data) {
        let result = this.coefficients.map(_ => 0);
        for (const b of data) {
            let factor = b ^ result.shift();
            result.push(0);
            this.coefficients.forEach((coef, i) => result[i] ^= ReedSolomonGenerator.multiply(coef, factor));
        }
        return result;
    }
    static multiply(x, y) {
        if (x >>> 8 != 0 || y >>> 8 != 0)
            throw "Byte out of range";
        let z = 0;
        for (let i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        if (z >>> 8 != 0)
            throw "Assertion error";
        return z;
    }
}
// A struct for QrCode.computePenalties().
class PenaltyInfo {
    constructor(horizontalRuns, verticalRuns, twoByTwoBoxes, horizontalFalseFinders, verticalFalseFinders, numBlackModules, penaltyPoints) {
        this.horizontalRuns = horizontalRuns;
        this.verticalRuns = verticalRuns;
        this.twoByTwoBoxes = twoByTwoBoxes;
        this.horizontalFalseFinders = horizontalFalseFinders;
        this.verticalFalseFinders = verticalFalseFinders;
        this.numBlackModules = numBlackModules;
        this.penaltyPoints = penaltyPoints;
    }
}
// A struct for QrCode.computePenalties().
class LinearRun {
    constructor(startX, startY, runLength) {
        this.startX = startX;
        this.startY = startY;
        this.runLength = runLength;
    }
}
// Simple helper function.
function sumArray(arr) {
    let result = 0;
    for (const x of arr)
        result += x;
    return result;
}
/*---- Hierarchy of classes for modules (pixels) ----*/
class Module {
}
class UnfilledModule extends Module {
}
class FilledModule extends Module {
    constructor(color) {
        super();
        this.color = color;
        this.isNew = true;
    }
}
class FunctionModule extends FilledModule {
    constructor(type, color) {
        super(color);
        this.type = type;
    }
}
var FunctionModuleType;
(function (FunctionModuleType) {
    FunctionModuleType[FunctionModuleType["FINDER"] = 0] = "FINDER";
    FunctionModuleType[FunctionModuleType["SEPARATOR"] = 1] = "SEPARATOR";
    FunctionModuleType[FunctionModuleType["TIMING"] = 2] = "TIMING";
    FunctionModuleType[FunctionModuleType["ALIGNMENT"] = 3] = "ALIGNMENT";
    FunctionModuleType[FunctionModuleType["FORMAT_INFO"] = 4] = "FORMAT_INFO";
    FunctionModuleType[FunctionModuleType["VERSION_INFO"] = 5] = "VERSION_INFO";
    FunctionModuleType[FunctionModuleType["BLACK"] = 6] = "BLACK";
})(FunctionModuleType || (FunctionModuleType = {}));
class CodewordModule extends FilledModule {
    constructor(color) {
        super(color);
    }
}
class RemainderModule extends FilledModule {
    constructor() {
        super(false);
    }
}
class MaskModule extends FilledModule {
    constructor(color) {
        super(color);
    }
}
/*---- Segment classes ----*/
class QrSegment {
    constructor(mode, numChars, bitData) {
        this.mode = mode;
        this.numChars = numChars;
        this.bitData = bitData;
        if (numChars < 0)
            throw "Invalid argument";
    }
    static getTotalBits(segs, version) {
        let result = 0;
        for (let seg of segs) {
            let ccbits = seg.mode.numCharCountBits(version);
            if (seg.numChars >= (1 << ccbits))
                return Infinity;
            result += 4 + ccbits + seg.bitData.length;
        }
        return result;
    }
}
// An enum type.
class SegmentMode {
    constructor(modeBits, numBitsCharCount, name) {
        this.modeBits = modeBits;
        this.numBitsCharCount = numBitsCharCount;
        this.name = name;
    }
    numCharCountBits(ver) {
        return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
    }
    /*-- Character testing --*/
    static isNumeric(cp) {
        return "0".charCodeAt(0) <= cp && cp <= "9".charCodeAt(0);
    }
    static isAlphanumeric(cp) {
        return cp < 128 && SegmentMode.ALPHANUMERIC_CHARSET.indexOf(String.fromCharCode(cp)) != -1;
    }
    static isKanji(cp) {
        return cp < 0x10000 && ((parseInt(SegmentMode.KANJI_BIT_SET.charAt(cp >>> 2), 16) >>> (cp & 3)) & 1) != 0;
    }
}
SegmentMode.NUMERIC = new SegmentMode(0x1, [10, 12, 14], "Numeric");
SegmentMode.ALPHANUMERIC = new SegmentMode(0x2, [9, 11, 13], "Alphanumeric");
SegmentMode.BYTE = new SegmentMode(0x4, [8, 16, 16], "Byte");
SegmentMode.KANJI = new SegmentMode(0x8, [8, 10, 12], "Kanji");
SegmentMode.ECI = new SegmentMode(0x7, [0, 0, 0], "ECI");
SegmentMode.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
SegmentMode.KANJI_BIT_SET = "0000000000000000000000010000000000000000C811350000000800000008000000000000000000000000000000000000000000000000000000000000000000" +
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
var app;
(function (app) {
    /*---- HTML UI initialization ----*/
    function initialize() {
        initShowHideSteps();
        doGenerate();
    }
    function initShowHideSteps() {
        let headings = document.querySelectorAll("article section h3");
        let showHideP = getElem("show-hide-steps");
        for (let heading of headings) {
            let parent = heading.parentNode;
            const stepStr = /^\d+(?=\. )/.exec(heading.textContent)[0];
            let label = appendNewElem(showHideP, "label");
            let checkbox = appendNewElem(label, "input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.id = "step" + stepStr;
            label.htmlFor = checkbox.id;
            let onChange = () => {
                if (checkbox.checked) {
                    parent.style.removeProperty("display");
                    label.classList.add("checked");
                }
                else {
                    parent.style.display = "none";
                    label.classList.remove("checked");
                }
            };
            checkbox.onchange = onChange;
            onChange();
            appendNewElem(label, "span", stepStr);
            let button = document.createElement("input");
            button.type = "button";
            button.value = "Hide";
            button.onclick = () => {
                checkbox.checked = false;
                onChange();
            };
            parent.insertBefore(button, heading);
        }
    }
    let maskShower;
    (function (maskShower) {
        const MASK_DEPENDENT_ELEMS = [
            "mask-pattern",
            "masked-qr-code",
            "masked-qr-with-format",
            "horizontal-runs",
            "vertical-runs",
            "two-by-two-boxes",
            "horizontal-false-finders",
            "vertical-false-finders",
            "black-white-balance",
        ];
        maskShower.selectElem = getElem("show-mask");
        for (const id of MASK_DEPENDENT_ELEMS) {
            let elem = document.getElementById(id);
            if (!(elem instanceof Element))
                throw "Assertion error";
            let parent = elem.parentNode;
            if (!(parent instanceof HTMLElement))
                throw "Assertion error";
            for (let i = 0; i < 8; i++) {
                let node = elem.cloneNode(true);
                node.setAttribute("id", `${id}-${i}`);
                node.setAttribute("class", `${node.getAttribute("class")} ${id}`);
                parent.insertBefore(node, elem);
            }
            parent.removeChild(elem);
        }
        maskShower.selectElem.onchange = showMask;
        showMask();
        function showMask() {
            for (const id of MASK_DEPENDENT_ELEMS) {
                for (let i = 0; i < 8; i++) {
                    let elem = document.getElementById(`${id}-${i}`);
                    elem.setAttribute("style", i == maskShower.selectElem.selectedIndex ? "" : "display:none");
                }
            }
        }
        maskShower.showMask = showMask;
    })(maskShower || (maskShower = {}));
    /*---- Main application ----*/
    function doGenerate(ev) {
        if (ev !== undefined)
            ev.preventDefault();
        // Get input values
        const textStr = getElem("input-text").value;
        const minVer = parseInt(getInput("force-min-version").value, 10);
        let forceMask = parseInt(getInput("force-mask-pattern").value, 10);
        let errCorrLvl;
        if (getInput("errcorlvl-low").checked)
            errCorrLvl = ErrorCorrectionLevel.LOW;
        else if (getInput("errcorlvl-medium").checked)
            errCorrLvl = ErrorCorrectionLevel.MEDIUM;
        else if (getInput("errcorlvl-quartile").checked)
            errCorrLvl = ErrorCorrectionLevel.QUARTILE;
        else if (getInput("errcorlvl-high").checked)
            errCorrLvl = ErrorCorrectionLevel.HIGH;
        else
            throw "Assertion error";
        const text = CodePoint.toArray(textStr);
        const mode = doStep0(text);
        const segs = [doStep1(text, mode)];
        const version = doStep2(segs, errCorrLvl, minVer);
        if (version == -1)
            return;
        const dataCodewords = doStep3(segs, version, errCorrLvl);
        const qr = new QrCode(version, errCorrLvl);
        const allCodewords = doStep4(qr, dataCodewords);
        doStep5(qr);
        doStep6(qr, allCodewords);
        let masks = doStep7(qr);
        let penalties = doStep8(qr, masks);
        let chosenMask = doStep9(penalties);
        if (forceMask != -1)
            chosenMask = forceMask;
        qr.applyMask(masks[chosenMask]);
        qr.drawFormatBits(chosenMask);
        qr.clearNewFlags();
        getSvgAndDrawQrCode("output-qr-code", qr);
        maskShower.selectElem.selectedIndex = chosenMask;
        maskShower.showMask();
    }
    app.doGenerate = doGenerate;
    function doStep0(text) {
        getElem("num-code-points").textContent = text.length.toString();
        let allNumeric = true;
        let allAlphanum = true;
        let allKanji = true;
        let tbody = clearChildren("#character-analysis tbody");
        text.forEach((cp, i) => {
            let tr = appendNewElem(tbody, "tr");
            const cells = [
                i.toString(),
                cp.utf16,
                "U+" + cp.utf32.toString(16).toUpperCase(),
                SegmentMode.isNumeric(cp.utf32),
                SegmentMode.isAlphanumeric(cp.utf32),
                true,
                SegmentMode.isKanji(cp.utf32),
            ];
            allNumeric = allNumeric && cells[3];
            allAlphanum = allAlphanum && cells[4];
            allKanji = allKanji && cells[6];
            for (let cell of cells) {
                let td = appendNewElem(tr, "td");
                if (typeof cell == "boolean") {
                    td.classList.add(cell ? "true" : "false");
                    cell = cell ? "Yes" : "No";
                }
                td.textContent = cell;
            }
        });
        tbody = clearChildren("#character-mode-summary tbody");
        const data = [
            ["Numeric", allNumeric],
            ["Alphanumeric", allAlphanum],
            ["Byte", true],
            ["Kanji", allKanji],
        ];
        for (const row of data) {
            let tr = appendNewElem(tbody, "tr");
            appendNewElem(tr, "td", row[0]);
            let td = appendNewElem(tr, "td", row[1] ? "Yes" : "No");
            td.classList.add(row[1] ? "true" : "false");
        }
        let result;
        if (text.length == 0)
            result = SegmentMode.BYTE;
        else if (allNumeric)
            result = SegmentMode.NUMERIC;
        else if (allAlphanum)
            result = SegmentMode.ALPHANUMERIC;
        else
            result = SegmentMode.BYTE;
        // Kanji mode encoding is not supported due to big conversion table
        getElem("chosen-segment-mode").textContent = result.name;
        return result;
    }
    function doStep1(text, mode) {
        getElem("data-segment-chars").className = mode.name.toLowerCase() + " possibly-long";
        let bitData = [];
        let numChars = text.length;
        let tbody = clearChildren("#data-segment-chars tbody");
        text.forEach((cp, i) => {
            let hexValues = "";
            let decValue = "";
            let rowSpan = 0;
            let combined = "";
            let bits = "";
            if (mode == SegmentMode.NUMERIC) {
                if (i % 3 == 0) {
                    rowSpan = Math.min(3, text.length - i);
                    const s = text.slice(i, i + rowSpan).map(c => c.utf16).join("");
                    const temp = parseInt(s, 10);
                    combined = temp.toString(10).padStart(rowSpan, "0");
                    bits = temp.toString(2).padStart(rowSpan * 3 + 1, "0");
                }
            }
            else if (mode == SegmentMode.ALPHANUMERIC) {
                let temp = SegmentMode.ALPHANUMERIC_CHARSET.indexOf(cp.utf16);
                decValue = temp.toString(10);
                if (i % 2 == 0) {
                    rowSpan = Math.min(2, text.length - i);
                    if (rowSpan == 2) {
                        temp *= SegmentMode.ALPHANUMERIC_CHARSET.length;
                        temp += SegmentMode.ALPHANUMERIC_CHARSET.indexOf(text[i + 1].utf16);
                    }
                    combined = temp.toString(10);
                    bits = temp.toString(2).padStart(rowSpan * 5 + 1, "0");
                }
            }
            else if (mode == SegmentMode.BYTE) {
                rowSpan = 1;
                const temp = cp.utf8;
                hexValues = temp.map(c => c.toString(16).toUpperCase().padStart(2, "0")).join(" ");
                bits = temp.map(c => c.toString(2).toUpperCase().padStart(8, "0")).join("");
                numChars += temp.length - 1;
            }
            else
                throw "Assertion error";
            for (const c of bits)
                bitData.push(parseInt(c, 2));
            let cells = [
                i.toString(),
                cp.utf16,
                hexValues,
                decValue,
            ];
            if (rowSpan > 0)
                cells.push(combined, bits);
            let tr = appendNewElem(tbody, "tr");
            cells.forEach((cell, j) => {
                let td = appendNewElem(tr, "td", cell);
                if (j >= 4)
                    td.rowSpan = rowSpan;
            });
        });
        getElem("segment-mode").textContent = mode.name.toString();
        getElem("segment-count").textContent = numChars + " " + (mode == SegmentMode.BYTE ? "bytes" : "characters");
        getElem("segment-data").textContent = bitData.length + " bits long";
        return new QrSegment(mode, numChars, bitData);
    }
    function doStep2(segs, ecl, minVer) {
        let trs = document.querySelectorAll("#segment-size tbody tr");
        [1, 10, 27].forEach((ver, i) => {
            const numBits = QrSegment.getTotalBits(segs, ver);
            const numCodewords = Math.ceil(numBits / 8);
            let tds = trs[i].querySelectorAll("td");
            tds[1].textContent = numBits < Infinity ? numBits.toString() : "Not encodable";
            tds[2].textContent = numCodewords < Infinity ? numCodewords.toString() : "Not encodable";
        });
        const ERRCORRLVLS = [
            ErrorCorrectionLevel.LOW,
            ErrorCorrectionLevel.MEDIUM,
            ErrorCorrectionLevel.QUARTILE,
            ErrorCorrectionLevel.HIGH
        ];
        let tbody = clearChildren("#codewords-per-version tbody");
        let result = -1;
        for (let ver = 1; ver <= 40; ver++) {
            let tr = appendNewElem(tbody, "tr");
            let td = appendNewElem(tr, "td", ver);
            let numCodewords = Math.ceil(QrSegment.getTotalBits(segs, ver) / 8);
            ERRCORRLVLS.forEach(e => {
                let td = appendNewElem(tr, "td");
                const capacityCodewords = QrCode.getNumDataCodewords(ver, e);
                td.textContent = capacityCodewords.toString();
                if (e == ecl) {
                    if (numCodewords <= capacityCodewords) {
                        td.classList.add("true");
                        if (result == -1 && ver >= minVer)
                            result = ver;
                    }
                    else
                        td.classList.add("false");
                }
            });
        }
        getElem("chosen-version").textContent = result != -1 ? result.toString() : "Cannot fit any version";
        return result;
    }
    function doStep3(segs, ver, ecl) {
        let allBits = [];
        let tbody = clearChildren("#segment-and-padding-bits tbody");
        function addRow(name, bits) {
            bits.forEach(b => allBits.push(b));
            let tr = appendNewElem(tbody, "tr");
            const cells = [
                name,
                bits.join(""),
                bits.length,
                allBits.length,
            ];
            cells.forEach(s => appendNewElem(tr, "td", s));
        }
        segs.forEach((seg, i) => {
            addRow(`Segment ${i} mode`, intToBits(seg.mode.modeBits, 4));
            addRow(`Segment ${i} count`, intToBits(seg.numChars, seg.mode.numCharCountBits(ver)));
            addRow(`Segment ${i} data`, seg.bitData);
        });
        const capacityBits = QrCode.getNumDataCodewords(ver, ecl) * 8;
        addRow("Terminator", [0, 0, 0, 0].slice(0, Math.min(4, capacityBits - allBits.length)));
        addRow("Bit padding", [0, 0, 0, 0, 0, 0, 0].slice(0, (8 - allBits.length % 8) % 8));
        let bytePad = [];
        for (let i = 0, n = (capacityBits - allBits.length) / 8; i < n; i++) {
            if (i % 2 == 0)
                bytePad.push(1, 1, 1, 0, 1, 1, 0, 0);
            else
                bytePad.push(0, 0, 0, 1, 0, 0, 0, 1);
        }
        addRow("Byte padding", bytePad);
        queryElem("#full-bitstream span").textContent = allBits.join("");
        let result = [];
        for (let i = 0; i < allBits.length; i += 8) {
            let cw = new DataCodeword(parseInt(allBits.slice(i, i + 8).join(""), 2));
            cw.preEccIndex = i / 8;
            result.push(cw);
        }
        getElem("all-data-codewords").textContent = result.map(cw => byteToHex(cw.value)).join(" ");
        return result;
    }
    function doStep4(qr, data) {
        const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[qr.errorCorrectionLevel.ordinal][qr.version];
        const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[qr.errorCorrectionLevel.ordinal][qr.version];
        const rawCodewords = Math.floor(QrCode.getNumRawDataModules(qr.version) / 8);
        const numShortBlocks = numBlocks - rawCodewords % numBlocks;
        const shortBlockLen = Math.floor(rawCodewords / numBlocks);
        let tds = document.querySelectorAll("#block-stats td:nth-child(2)");
        tds[0].textContent = data.length.toString();
        tds[1].textContent = numBlocks.toString();
        tds[2].textContent = (shortBlockLen - blockEccLen).toString();
        tds[3].textContent = numShortBlocks < numBlocks ? (shortBlockLen - blockEccLen + 1).toString() : "N/A";
        tds[4].textContent = blockEccLen.toString();
        tds[5].textContent = numShortBlocks.toString();
        tds[6].textContent = (numBlocks - numShortBlocks).toString();
        let dataBlocks = qr.splitIntoBlocks(data);
        let eccBlocks = qr.computeEccForBlocks(dataBlocks);
        {
            let thead = queryElem("#blocks-and-ecc thead");
            if (thead.children.length >= 2)
                thead.removeChild(thead.children[1]);
            thead.querySelectorAll("th")[1].colSpan = numBlocks;
            let tr = appendNewElem(thead, "tr");
            for (let i = 0; i < numBlocks; i++)
                appendNewElem(tr, "th", i);
        }
        {
            let tbody = clearChildren("#blocks-and-ecc tbody");
            let verticalTh = document.createElement("th");
            verticalTh.textContent = "Codeword index within block";
            verticalTh.rowSpan = shortBlockLen; // Not final value; work around Firefox bug
            for (let i = 0; i < shortBlockLen + 1; i++) {
                const isDataRow = i < shortBlockLen + 1 - blockEccLen;
                let tr = appendNewElem(tbody, "tr");
                tr.className = isDataRow ? "data" : "ecc";
                if (i == 0)
                    tr.appendChild(verticalTh);
                appendNewElem(tr, "th", i);
                if (isDataRow) {
                    dataBlocks.forEach(block => appendNewElem(tr, "td", i < block.length ? byteToHex(block[i].value) : ""));
                }
                else {
                    eccBlocks.forEach(block => appendNewElem(tr, "td", byteToHex(block[i - (shortBlockLen + 1 - blockEccLen)].value)));
                }
            }
            tbody.clientHeight; // Read property to force reflow in Firefox
            verticalTh.rowSpan = shortBlockLen + 1;
        }
        let result = qr.interleaveBlocks(dataBlocks, eccBlocks);
        let output = clearChildren("#interleaved-codewords");
        let span = appendNewElem(output, "span", result.slice(0, data.length).map(cw => byteToHex(cw.value)).join(" "));
        span.className = "data";
        output.appendChild(document.createTextNode(" "));
        span = appendNewElem(output, "span", result.slice(data.length).map(cw => byteToHex(cw.value)).join(" "));
        span.className = "ecc";
        return result;
    }
    function doStep5(qr) {
        qr.drawTimingPatterns();
        getSvgAndDrawQrCode("timing-patterns", qr);
        qr.clearNewFlags();
        qr.drawFinderPatterns();
        getSvgAndDrawQrCode("finder-patterns", qr);
        qr.clearNewFlags();
        qr.drawAlignmentPatterns();
        getSvgAndDrawQrCode("alignment-patterns", qr);
        qr.clearNewFlags();
        let alignPatContainer = getElem("alignment-patterns-container");
        if (qr.version == 1)
            alignPatContainer.style.display = "none";
        else
            alignPatContainer.style.removeProperty("display");
        qr.drawFormatBits(-1);
        getSvgAndDrawQrCode("dummy-format-bits", qr);
        qr.clearNewFlags();
        qr.drawVersionInformation();
        getSvgAndDrawQrCode("version-information", qr);
        qr.clearNewFlags();
        let verInfoContainer = getElem("version-information-container");
        if (qr.version < 7)
            verInfoContainer.style.display = "none";
        else
            verInfoContainer.style.removeProperty("display");
    }
    function doStep6(qr, allCodewords) {
        const zigZagScan = qr.makeZigZagScan();
        let zigZagSvg = getSvgAndDrawQrCode("zig-zag-scan", qr);
        {
            let s = "";
            for (const [x, y] of zigZagScan)
                s += (s == "" ? "M" : "L") + (x + 0.5) + "," + (y + 0.5);
            let path = svgAppendNewElem(zigZagSvg, "path", "zigzag-line");
            path.setAttribute("d", s);
        }
        {
            let s = "";
            for (let [x, y] of zigZagScan)
                s += `M${x + 0.5},${y + 0.5}h0`;
            let path = svgAppendNewElem(zigZagSvg, "path", "zigzag-dots");
            path.setAttribute("d", s);
        }
        qr.drawCodewords(allCodewords, zigZagScan);
        qr.clearNewFlags();
        getSvgAndDrawQrCode("codewords-and-remainder", qr);
    }
    function doStep7(qr) {
        let result = [];
        for (let i = 0; i < 8; i++) {
            let mask = qr.makeMask(i);
            mask.clearNewFlags();
            result.push(mask);
            getSvgAndDrawQrCode("mask-pattern-" + i, mask);
            qr.applyMask(mask);
            qr.drawFormatBits(-1);
            qr.clearNewFlags();
            getSvgAndDrawQrCode("masked-qr-code-" + i, qr);
            qr.drawFormatBits(i);
            getSvgAndDrawQrCode("masked-qr-with-format-" + i, qr);
            qr.applyMask(mask);
            qr.clearNewFlags();
        }
        return result;
    }
    function doStep8(qr, masks) {
        function drawSvgAndAddGroup(name, i) {
            let svg = getSvgAndDrawQrCode(`${name}-${i}`, qr);
            let group = svgAppendNewElem(svg, "g");
            return group;
        }
        function appendRect(container, x, y, width, height) {
            let rect = svgAppendNewElem(container, "rect");
            rect.setAttribute("x", x.toString());
            rect.setAttribute("y", y.toString());
            rect.setAttribute("width", width.toString());
            rect.setAttribute("height", height.toString());
            rect.setAttribute("rx", "0.5");
            rect.setAttribute("ry", "0.5");
        }
        return masks.map((mask, maskIndex) => {
            qr.applyMask(mask);
            qr.drawFormatBits(maskIndex);
            qr.clearNewFlags();
            const penaltyInfo = qr.computePenalties();
            let group = drawSvgAndAddGroup("horizontal-runs", maskIndex);
            penaltyInfo.horizontalRuns.forEach(run => appendRect(group, run.startX, run.startY, run.runLength, 1));
            group = drawSvgAndAddGroup("vertical-runs", maskIndex);
            penaltyInfo.verticalRuns.forEach(run => appendRect(group, run.startX, run.startY, 1, run.runLength));
            group = drawSvgAndAddGroup("two-by-two-boxes", maskIndex);
            penaltyInfo.twoByTwoBoxes.forEach(([x, y]) => appendRect(group, x, y, 2, 2));
            group = drawSvgAndAddGroup("horizontal-false-finders", maskIndex);
            penaltyInfo.horizontalFalseFinders.forEach(run => appendRect(group, run.startX, run.startY, run.runLength, 1));
            group = drawSvgAndAddGroup("vertical-false-finders", maskIndex);
            penaltyInfo.verticalFalseFinders.forEach(run => appendRect(group, run.startX, run.startY, 1, run.runLength));
            let tds = document.querySelectorAll(`#black-white-balance-${maskIndex} td:nth-child(2)`);
            const total = qr.size * qr.size;
            const black = penaltyInfo.numBlackModules;
            const percentBlack = black * 100 / total;
            tds[0].textContent = qr.size.toString();
            tds[1].textContent = total.toString();
            tds[2].textContent = (total - black).toString();
            tds[3].textContent = black.toString();
            tds[4].textContent = percentBlack.toFixed(3) + "%";
            tds[5].textContent = (percentBlack - 50).toFixed(3).replace(/-/, "\u2212") + "%";
            qr.applyMask(mask);
            return penaltyInfo;
        });
    }
    function doStep9(penalties) {
        let tbody = clearChildren("#select-best-mask");
        let result = -1;
        let minPenalty = Infinity;
        penalties.forEach((penaltyInfo, maskNum) => {
            const totalPoints = sumArray(penaltyInfo.penaltyPoints);
            if (totalPoints < minPenalty) {
                minPenalty = totalPoints;
                result = maskNum;
            }
            let tr = appendNewElem(tbody, "tr");
            let cells = [maskNum].concat(penaltyInfo.penaltyPoints).concat([totalPoints]);
            cells.forEach((val, i) => appendNewElem(tr, (i == 0 ? "th" : "td"), val));
        });
        getElem("lowest-penalty-mask").textContent = result.toString();
        tbody.children[result].classList.add("true");
        return result;
    }
    function getSvgAndDrawQrCode(id, qr) {
        let svg = document.getElementById(id);
        const EXTRA_BORDER = 0.2;
        const a = -EXTRA_BORDER, b = qr.size + EXTRA_BORDER * 2;
        svg.setAttribute("viewBox", `${a} ${a} ${b} ${b}`);
        while (svg.firstChild !== null)
            svg.removeChild(svg.firstChild);
        const hasUnfilled = qr.modules.some(col => col.some(cell => cell instanceof UnfilledModule));
        if (hasUnfilled) {
            let rect = svgAppendNewElem(svg, "rect", "gray");
            rect.setAttribute("x", "0");
            rect.setAttribute("y", "0");
            rect.setAttribute("width", qr.size.toString());
            rect.setAttribute("height", qr.size.toString());
        }
        let whites = "";
        let blacks = "";
        qr.modules.forEach((column, x) => {
            column.forEach((cell, y) => {
                if (cell instanceof FilledModule) {
                    const s = `M${x},${y}h1v1h-1z`;
                    if (cell.color)
                        blacks += s;
                    else
                        whites += s;
                }
            });
        });
        let whitePath = svgAppendNewElem(svg, "path", "white");
        let blackPath = svgAppendNewElem(svg, "path", "black");
        whitePath.setAttribute("d", whites);
        blackPath.setAttribute("d", blacks);
        function isModuleNew(x, y) {
            if (!(0 <= x && x < qr.size && 0 <= y && y < qr.size))
                return false;
            const m = qr.modules[x][y];
            return m instanceof FilledModule && m.isNew;
        }
        let news = "";
        for (let x = 0; x <= qr.size; x++) {
            for (let y = 0; y <= qr.size; y++) {
                if (isModuleNew(x - 1, y) != isModuleNew(x, y))
                    news += `M${x},${y}v1`;
                if (isModuleNew(x, y - 1) != isModuleNew(x, y))
                    news += `M${x},${y}h1`;
            }
        }
        let newPath = svgAppendNewElem(svg, "path", "new");
        newPath.setAttribute("d", news);
        return svg;
    }
    /*---- Simple utility functions ----*/
    function getElem(id) {
        const result = document.getElementById(id);
        if (result instanceof HTMLElement)
            return result;
        throw "Assertion error";
    }
    function getInput(id) {
        const result = getElem(id);
        if (result instanceof HTMLInputElement)
            return result;
        throw "Assertion error";
    }
    function queryElem(q) {
        const result = document.querySelector(q);
        if (result instanceof HTMLElement)
            return result;
        throw "Assertion error";
    }
    function clearChildren(elemOrQuery) {
        let elem;
        if (typeof elemOrQuery == "string")
            elem = queryElem(elemOrQuery);
        else
            elem = elemOrQuery;
        while (elem.firstChild != null)
            elem.removeChild(elem.firstChild);
        return elem;
    }
    function appendNewElem(container, tag, text) {
        let result = document.createElement(tag);
        if (text !== undefined)
            result.textContent = text.toString();
        container.appendChild(result);
        return result;
    }
    function svgAppendNewElem(container, tag, cls) {
        let result = document.createElementNS(container.namespaceURI, tag);
        if (cls !== undefined)
            result.setAttribute("class", cls);
        container.appendChild(result);
        return result;
    }
    function intToBits(val, len) {
        if (len < 0 || len > 31 || val >>> len != 0)
            throw "Value out of range";
        let result = [];
        for (let i = len - 1; i >= 0; i--)
            result.push((val >>> i) & 1);
        return result;
    }
    function byteToHex(val) {
        return val.toString(16).toUpperCase().padStart(2, "0");
    }
    /*---- Helper class ----*/
    class CodePoint {
        constructor(utf32) {
            this.utf32 = utf32;
            if (utf32 < 0x10000)
                this.utf16 = String.fromCharCode(utf32);
            else {
                this.utf16 = String.fromCharCode(0xD800 | ((utf32 - 0x10000) >>> 10), 0xDC00 | ((utf32 - 0x10000) & 0x3FF));
            }
            if (utf32 < 0)
                throw "Invalid code point";
            else if (utf32 < 0x80)
                this.utf8 = [utf32];
            else {
                let n;
                if (utf32 < 0x800)
                    n = 2;
                else if (utf32 < 0x10000)
                    n = 3;
                else if (utf32 < 0x110000)
                    n = 4;
                else
                    throw "Invalid code point";
                this.utf8 = [];
                for (let i = 0; i < n; i++, utf32 >>>= 6)
                    this.utf8.push(0x80 | (utf32 & 0x3F));
                this.utf8.reverse();
                this.utf8[0] |= (0xF00 >>> n) & 0xFF;
            }
        }
        static toArray(s) {
            let result = [];
            for (let i = 0; i < s.length; i++) {
                const c = s.charCodeAt(i);
                if (0xD800 <= c && c < 0xDC00) {
                    if (i + 1 >= s.length)
                        throw "Invalid UTF-16 string";
                    i++;
                    const d = s.charCodeAt(i);
                    result.push(new CodePoint(((c & 0x3FF) << 10 | (d & 0x3FF)) + 0x10000));
                }
                else if (0xDC00 <= c && c < 0xE000)
                    throw "Invalid UTF-16 string";
                else
                    result.push(new CodePoint(c));
            }
            return result;
        }
    }
    initialize();
})(app || (app = {}));
