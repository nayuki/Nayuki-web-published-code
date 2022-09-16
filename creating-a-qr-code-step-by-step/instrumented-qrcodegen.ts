/* 
 * Creating a QR Code step by step
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/creating-a-qr-code-step-by-step
 */


type bit = number;
type byte = number;
type int = number;



/*---- Main QR Code class ----*/

class QrCode {
	
	/*-- Static functions --*/
	
	public static getNumRawDataModules(ver: int): int {
		if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION)
			throw new RangeError("Version number out of range");
		let result: int = (16 * ver + 128) * ver + 64;
		if (ver >= 2) {
			const numAlign: int = Math.floor(ver / 7) + 2;
			result -= (25 * numAlign - 10) * numAlign - 55;
			if (ver >= 7)
				result -= 36;
		}
		return result;
	}
	
	
	public static getNumDataCodewords(ver: int, ecl: ErrorCorrectionLevel): int {
		return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
			QrCode.ECC_CODEWORDS_PER_BLOCK    [ecl.ordinal][ver] *
			QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
	}
	
	
	/*-- Fields and constructor --*/
	
	public readonly size: int;  // The side length of this QR Code.
	public modules: Array<Array<Module>> = [];  // Has dimensions of size * size.
	
	
	// Creates a QR Code containing a grid of initially unfilled modules.
	public constructor(
			public readonly version: int,
			public readonly errorCorrectionLevel: ErrorCorrectionLevel) {
		if (version < QrCode.MIN_VERSION || version > QrCode.MAX_VERSION)
			throw new RangeError("Version number out of range");
		this.size = version * 4 + 17;
		
		for (let x = 0; x < this.size; x++) {
			let column: Array<Module> = [];
			for (let y = 0; y < this.size; y++)
				column.push(new UnfilledModule());
			this.modules.push(column);
		}
	}
	
	
	/*-- Methods --*/
	
	// Modifies modules in this QR Code.
	public clearNewFlags(): void {
		for (let column of this.modules) {
			for (let m of column) {
				if (m instanceof FilledModule)
					m.isNew = false;
			}
		}
	}
	
	
	// Modifies modules in this QR Code.
	public drawTimingPatterns(): void {
		for (let i = 0; i < this.size; i++) {
			this.modules[6][i] = new FunctionModule(FunctionModuleType.TIMING, i % 2 == 0);
			this.modules[i][6] = new FunctionModule(FunctionModuleType.TIMING, i % 2 == 0);
		}
	}
	
	
	// Modifies modules in this QR Code.
	public drawFinderPatterns(): void {
		const centers: Array<[int,int]> = [
			[3, 3],
			[this.size - 4, 3],
			[3, this.size - 4],
		];
		for (const [cx, cy] of centers) {
			for (let dy = -4; dy <= 4; dy++) {
				for (let dx = -4; dx <= 4; dx++) {
					const dist: int = Math.max(Math.abs(dx), Math.abs(dy));
					const x: int = cx + dx;
					const y: int = cy + dy;
					if (0 <= x && x < this.size && 0 <= y && y < this.size) {
						this.modules[x][y] = new FunctionModule(
							dist <= 3 ? FunctionModuleType.FINDER : FunctionModuleType.SEPARATOR,
							dist != 2 && dist != 4);
					}
				}
			}
		}
	}
	
	
	// Modifies modules in this QR Code.
	public drawAlignmentPatterns(): void {
		if (this.version == 1)
			return;
		let positions: Array<int> = [6];
		const numAlign: int = Math.floor(this.version / 7) + 2;
		const step: int = (this.version == 32) ? 26 :
			Math.ceil((this.size - 13) / (numAlign*2 - 2)) * 2;
		for (let pos = this.size - 7; positions.length < numAlign; pos -= step)
			positions.splice(1, 0, pos);
		
		positions.forEach((cx, i) => {
			positions.forEach((cy, j) => {
				if (i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)
					return;
				for (let dy = -2; dy <= 2; dy++) {
					for (let dx = -2; dx <= 2; dx++) {
						this.modules[cx + dx][cy + dy] = new FunctionModule(
							FunctionModuleType.ALIGNMENT, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
					}
				}
			});
		});
	}
	
	
	// Modifies modules in this QR Code.
	public drawFormatBits(mask: int): void {
		let bits: int = 0;
		if (mask != -1) {
			const data: int = this.errorCorrectionLevel.formatBits << 3 | mask;
			let rem: int = data;
			for (let i = 0; i < 10; i++)
				rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
			bits = (data << 10 | rem) ^ 0x5412;
		}
		if (bits >>> 15 != 0)
			throw new Error("Assertion error");
		
		let setFormatInfoModule = (x: int, y: int, bitIndex: int) => {
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
		this.modules[8][this.size - 8] = new FunctionModule(FunctionModuleType.DARK, true);
	}
	
	
	// Modifies modules in this QR Code.
	public drawVersionInformation(): void {
		if (this.version < 7)
			return;
		
		let rem: int = this.version;
		for (let i = 0; i < 12; i++)
			rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
		const bits: int = this.version << 12 | rem;
		if (bits >>> 18 != 0)
			throw new Error("Assertion error");
		
		for (let i = 0; i < 18; i++) {
			const color: boolean = QrCode.getBit(bits, i);
			const a: int = this.size - 11 + i % 3;
			const b: int = Math.floor(i / 3);
			this.modules[a][b] = new FunctionModule(FunctionModuleType.VERSION_INFO, color);
			this.modules[b][a] = new FunctionModule(FunctionModuleType.VERSION_INFO, color);
		}
	}
	
	
	// Reads the argument array but doesn't change it, changes
	// the underlying codeword objects, and returns a new array.
	// Reads this QR Code's version and ECL, but doesn't change its state.
	public splitIntoBlocks(data: Readonly<Array<DataCodeword>>): Array<Array<DataCodeword>> {
		const numBlocks: int = QrCode.NUM_ERROR_CORRECTION_BLOCKS[this.errorCorrectionLevel.ordinal][this.version];
		const blockEccLen: int = QrCode.ECC_CODEWORDS_PER_BLOCK  [this.errorCorrectionLevel.ordinal][this.version];
		const rawCodewords: int = Math.floor(QrCode.getNumRawDataModules(this.version) / 8);
		const numShortBlocks: int = numBlocks - rawCodewords % numBlocks;
		const shortBlockLen: int = Math.floor(rawCodewords / numBlocks);
		
		let result: Array<Array<DataCodeword>> = [];
		for (let blockIndex = 0, off = 0; blockIndex < numBlocks; blockIndex++) {
			const end: int = off + shortBlockLen - blockEccLen + (blockIndex < numShortBlocks ? 0 : 1);
			let block: Array<DataCodeword> = data.slice(off, end);
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
	public computeEccForBlocks(blocks: Readonly<Array<Array<DataCodeword>>>): Array<Array<EccCodeword>> {
		const blockEccLen: int = QrCode.ECC_CODEWORDS_PER_BLOCK[this.errorCorrectionLevel.ordinal][this.version];
		const shortBlockDataLen: int = blocks[0].length;
		const rs = new ReedSolomonGenerator(blockEccLen);
		let preInterleaveIndex = 0;
		
		return blocks.map((block, blockIndex) => {
			for (let cw of block) {
				cw.preInterleaveIndex = preInterleaveIndex;
				preInterleaveIndex++;
			}
			
			const blockBytes: Array<byte> = block.map(cw => cw.value);
			const eccBytes: Array<byte> = rs.getRemainder(blockBytes);
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
	public interleaveBlocks(data: Readonly<Array<Array<DataCodeword>>>, ecc: Readonly<Array<Array<EccCodeword>>>): Array<Codeword> {
		const blockEccLen: int = ecc[0].length;
		const maxBlockDataLen: int = data[data.length - 1].length;
		let result: Array<Codeword> = [];
		for (let i = 0; i < maxBlockDataLen; i++) {
			for (let block of data) {
				if (i < block.length) {
					let cw = block[i];
					cw.postInterleaveIndex = result.length;
					result.push(cw);
				}
			}
		}
		for (let i = 0; i < blockEccLen; i++) {
			for (let block of ecc) {
				let cw = block[i];
				cw.postInterleaveIndex = result.length;
				result.push(cw);
			}
		}
		return result;
	}
	
	
	// Can only be called after all function modules have been drawn.
	// Reads this QR Code's modules, but doesn't change them.
	public makeZigZagScan(): Array<[int,int]> {
		let result: Array<[int,int]> = [];
		for (let right = this.size - 1; right >= 1; right -= 2) {
			if (right == 6)
				right = 5;
			for (let vert = 0; vert < this.size; vert++) {
				for (let j = 0; j < 2; j++) {
					const x: int = right - j;
					const upward: boolean = ((right + 1) & 2) == 0;
					const y: int = upward ? this.size - 1 - vert : vert;
					if (!(this.modules[x][y] instanceof FunctionModule))
						result.push([x, y]);
				}
			}
		}
		return result;
	}
	
	
	// Modifies this QR Code's modules.
	public drawCodewords(codewords: Readonly<Array<Codeword>>, zigZagScan: Readonly<Array<[int,int]>>): void {
		if (codewords.length != Math.floor(QrCode.getNumRawDataModules(this.version) / 8))
			throw new RangeError("Invalid argument");
		zigZagScan.forEach(([x, y], i) => {
			if (i < codewords.length * 8) {
				let cw: Codeword = codewords[i >>> 3];
				this.modules[x][y] = new CodewordModule(QrCode.getBit(cw.value, 7 - (i & 7)));
				i++;
			} else
				this.modules[x][y] = new RemainderModule();
		});
	}
	
	
	// Can only be called after all function modules have been drawn.
	// Reads this QR Code's modules, but doesn't change them.
	public makeMask(mask: int): QrCode {
		let result = new QrCode(this.version, this.errorCorrectionLevel);
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				let invert: boolean;
				switch (mask) {
					case 0:  invert = (x + y) % 2 == 0;                                  break;
					case 1:  invert = y % 2 == 0;                                        break;
					case 2:  invert = x % 3 == 0;                                        break;
					case 3:  invert = (x + y) % 3 == 0;                                  break;
					case 4:  invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;  break;
					case 5:  invert = x * y % 2 + x * y % 3 == 0;                        break;
					case 6:  invert = (x * y % 2 + x * y % 3) % 2 == 0;                  break;
					case 7:  invert = ((x + y) % 2 + x * y % 3) % 2 == 0;                break;
					default:  throw new Error("Assertion error");
				}
				if (!(this.modules[x][y] instanceof FunctionModule))
					result.modules[x][y] = new MaskModule(invert);
			}
		}
		return result;
	}
	
	
	// Can only be called after all codeword modules have been drawn.
	// Modifies this QR Code's modules.
	public applyMask(mask: QrCode): void {
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.size; y++) {
				const a = mask.modules[x][y];
				let   b = this.modules[x][y];
				if (a instanceof MaskModule && b instanceof FilledModule) {
					b.color = b.color != a.color;
				}
			}
		}
	}
	
	
	// Can only be called after all modules have been drawn.
	// Reads this QR Code's modules, but doesn't change them.
	public computePenalties(): PenaltyInfo {
		let penalties: [int,int,int,int] = [0, 0, 0, 0];
		const colors: Array<Array<boolean>> = this.modules.map(
			column => column.map(
				cell => cell instanceof FilledModule && cell.color));
		
		let horzRuns   : Array<LinearRun> = [];
		let horzFinders: Array<LinearRun> = [];
		for (let y = 0; y < this.size; y++) {
			let runColor = false;
			let runX = 0;
			let runHistory = new FinderPenalty(this.size, "horz", y, horzFinders);
			for (let x = 0; x < this.size; x++) {
				if (colors[x][y] == runColor) {
					runX++;
					if (runX == 5) {
						penalties[0] += QrCode.PENALTY_N1;
						horzRuns.push(new LinearRun(x + 1 - runX, y, runX));
					} else if (runX > 5) {
						penalties[0]++;
						horzRuns[horzRuns.length - 1] = new LinearRun(x + 1 - runX, y, runX);
					}
				} else {
					runHistory.addHistory(runX);
					if (!runColor)
						penalties[2] += runHistory.countAndAddPatterns() * QrCode.PENALTY_N3;
					runColor = colors[x][y];
					runX = 1;
				}
			}
			penalties[2] += runHistory.terminateAndCount(runColor, runX) * QrCode.PENALTY_N3;
		}
		
		let vertRuns   : Array<LinearRun> = [];
		let vertFinders: Array<LinearRun> = [];
		for (let x = 0; x < this.size; x++) {
			let runColor = false;
			let runY = 0;
			let runHistory = new FinderPenalty(this.size, "vert", x, vertFinders);
			for (let y = 0; y < this.size; y++) {
				if (colors[x][y] == runColor) {
					runY++;
					if (runY == 5) {
						penalties[0] += QrCode.PENALTY_N1;
						vertRuns.push(new LinearRun(x, y + 1 - runY, runY));
					} else if (runY > 5) {
						penalties[0]++;
						vertRuns[vertRuns.length - 1] = new LinearRun(x, y + 1 - runY, runY);
					}
				} else {
					runHistory.addHistory(runY);
					if (!runColor)
						penalties[2] += runHistory.countAndAddPatterns() * QrCode.PENALTY_N3;
					runColor = colors[x][y];
					runY = 1;
				}
			}
			penalties[2] += runHistory.terminateAndCount(runColor, runY) * QrCode.PENALTY_N3;
		}
		
		let twoByTwos: Array<[int,int]> = [];
		for (let x = 0; x < this.size - 1; x++) {
			for (let y = 0; y < this.size - 1; y++) {
				const c: boolean = colors[x][y];
				if (c == colors[x + 1][y] && c == colors[x][y + 1] && c == colors[x + 1][y + 1]) {
					penalties[1] += QrCode.PENALTY_N2;
					twoByTwos.push([x, y]);
				}
			}
		}
		
		let dark: int = 0;
		for (const column of colors)
			dark = column.reduce((a, b) => a + (b ? 1 : 0), dark);
		const total: int = this.size * this.size;
		let k = 0;
		while (Math.abs(dark * 20 - total * 10) > (k + 1) * total)
			k++;
		penalties[3] += k * QrCode.PENALTY_N4;
		
		return new PenaltyInfo(horzRuns, vertRuns, twoByTwos,
			horzFinders, vertFinders, dark, penalties);
	}
	
	
	private static getBit(x: int, i: int): boolean {
		return ((x >>> i) & 1) != 0;
	}
	
	
	/*-- Constants and tables --*/
	
	public static readonly MIN_VERSION: int =  1;
	public static readonly MAX_VERSION: int = 40;
	
	private static readonly PENALTY_N1: int =  3;
	private static readonly PENALTY_N2: int =  3;
	private static readonly PENALTY_N3: int = 40;
	private static readonly PENALTY_N4: int = 10;
	
	public static readonly ECC_CODEWORDS_PER_BLOCK: Array<Array<int>> = [
		[-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
		[-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
		[-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
		[-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
	];
	
	public static readonly NUM_ERROR_CORRECTION_BLOCKS: Array<Array<int>> = [
		[-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
		[-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
		[-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
		[-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
	];
	
}



/*---- Helper classes for QrCode ----*/

// An enum type.
class ErrorCorrectionLevel {
	
	public static readonly LOW      = new ErrorCorrectionLevel(0, 1);
	public static readonly MEDIUM   = new ErrorCorrectionLevel(1, 0);
	public static readonly QUARTILE = new ErrorCorrectionLevel(2, 3);
	public static readonly HIGH     = new ErrorCorrectionLevel(3, 2);
	
	
	private constructor(
		public readonly ordinal: int,
		public readonly formatBits: int) {}
	
}



abstract class Codeword {
	
	public preInterleaveIndex : int = -1;
	public blockIndex         : int = -1;
	public indexInBlock       : int = -1;
	public postInterleaveIndex: int = -1;
	
	
	public constructor(
			public readonly value: byte) {
		if (value < 0 || value > 255)
			throw new RangeError("Invalid value");
	}
	
}


class DataCodeword extends Codeword {
	public preEccIndex: int = -1;
	
	public constructor(value: byte) {
		super(value);
	}
}


class EccCodeword extends Codeword {
	public constructor(value: byte) {
		super(value);
	}
}



// Computation for QrCode.computeEccForBlocks().
class ReedSolomonGenerator {
	
	private readonly coefficients: Array<byte> = [];
	
	
	public constructor(degree: int) {
		if (degree < 1 || degree > 255)
			throw new RangeError("Degree out of range");
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
	
	
	public getRemainder(data: Readonly<Array<byte>>): Array<byte> {
		let result: Array<byte> = this.coefficients.map(_ => 0);
		for (const b of data) {
			const factor: byte = b ^ (result.shift() as byte);
			result.push(0);
			this.coefficients.forEach((coef, i) =>
				result[i] ^= ReedSolomonGenerator.multiply(coef, factor));
		}
		return result;
	}
	
	
	private static multiply(x: byte, y: byte): byte {
		if (x >>> 8 != 0 || y >>> 8 != 0)
			throw new RangeError("Byte out of range");
		let z: int = 0;
		for (let i = 7; i >= 0; i--) {
			z = (z << 1) ^ ((z >>> 7) * 0x11D);
			z ^= ((y >>> i) & 1) * x;
		}
		if (z >>> 8 != 0)
			throw new Error("Assertion error");
		return z as byte;
	}
	
}



// A struct for QrCode.computePenalties().
class PenaltyInfo {
	constructor(
		public readonly horizontalRuns: Array<LinearRun>,
		public readonly verticalRuns: Array<LinearRun>,
		public readonly twoByTwoBoxes: Array<[int,int]>,
		public readonly horizontalFalseFinders: Array<LinearRun>,
		public readonly verticalFalseFinders: Array<LinearRun>,
		public readonly numDarkModules: int,
		public readonly penaltyPoints: [int,int,int,int]) {}
}



// A struct for QrCode.computePenalties().
class LinearRun {
	constructor(
		public readonly startX: int,
		public readonly startY: int,
		public readonly runLength: int) {}
}



// A class for QrCode.computePenalties().
class FinderPenalty {
	
	private runHistory: Array<int> = [];
	private runEndPositions: Array<int> = [0];
	private position: int = 0;
	private padding: int;
	
	
	public constructor(
			private readonly qrSize: int,
			private readonly direction: "horz"|"vert",
			private readonly outerPosition: int,
			private readonly finders: Array<LinearRun>) {
		this.padding = qrSize;
	}
	
	
	public addHistory(currentRunLength: int): void {
		this.runHistory.unshift(currentRunLength + this.padding);
		this.padding = 0;
		this.position += currentRunLength;
		this.runEndPositions.unshift(this.position);
	}
	
	
	public countAndAddPatterns(): int {
		const hist = this.runHistory;
		const n: int = hist[1];
		if (n > this.qrSize * 3)
			throw new Error("Assertion error");
		const core = n > 0 && hist[2] == n && hist[3] == n * 3 && hist[4] == n && hist[5] == n;
		const coreStart = this.runEndPositions[6];
		const coreEnd = this.runEndPositions[1];
		
		let result = 0;
		if (core && hist[0] >= n * 4 && hist[6] >= n) {
			result++;
			const start = coreStart - n;
			const end = coreEnd + n * 4;
			this.finders.push(this.direction == "horz" ?
				new LinearRun(start, this.outerPosition, end - start) :
				new LinearRun(this.outerPosition, start, end - start));
		}
		if (core && hist[6] >= n * 4 && hist[0] >= n) {
			result++;
			const start = coreStart - n * 4;
			const end = coreEnd + n;
			this.finders.push(this.direction == "horz" ?
				new LinearRun(start, this.outerPosition, end - start) :
				new LinearRun(this.outerPosition, start, end - start));
		}
		return result;
	}
	
	
	public terminateAndCount(currentRunColor: boolean, currentRunLength: int): int {
		if (currentRunColor) {
			this.addHistory(currentRunLength);
			currentRunLength = 0;
		}
		this.padding = this.qrSize;
		this.addHistory(currentRunLength);
		if (this.position != this.qrSize)
			throw new Error("Assertion error");
		return this.countAndAddPatterns();
	}
	
}



/*---- Hierarchy of classes for modules (pixels) ----*/

abstract class Module {}


class UnfilledModule extends Module {}


abstract class FilledModule extends Module {
	public isNew: boolean = true;
	
	public constructor(
			public color: boolean) {
		super();
	}
}


class FunctionModule extends FilledModule {
	public constructor(
			public readonly type: FunctionModuleType,
			color: boolean) {
		super(color);
	}
}


enum FunctionModuleType {
	
	FINDER, SEPARATOR, TIMING, ALIGNMENT, FORMAT_INFO, VERSION_INFO, DARK
	
}


class CodewordModule extends FilledModule {
	public constructor(color: boolean) {
		super(color);
	}
}


class RemainderModule extends FilledModule {
	public constructor() {
		super(false);
	}
}


class MaskModule extends FilledModule {
	public constructor(color: boolean) {
		super(color);
	}
}



/*---- Segment classes ----*/

class QrSegment {
	
	public static getTotalBits(segs: Readonly<Array<QrSegment>>, version: int): number {
		let result: int = 0;
		for (const seg of segs) {
			let ccbits: int = seg.mode.numCharCountBits(version);
			if (seg.numChars >= (1 << ccbits))
				return Infinity;
			result += 4 + ccbits + seg.bitData.length;
		}
		return result;
	}
	
	
	public constructor(
			public readonly mode: SegmentMode,
			public readonly numChars: int,
			public readonly bitData: Array<bit>) {
		if (numChars < 0)
			throw new RangeError("Invalid argument");
	}
	
}



// An enum type.
class SegmentMode {
	
	public static readonly NUMERIC      = new SegmentMode(0x1, [10, 12, 14], "Numeric"     );
	public static readonly ALPHANUMERIC = new SegmentMode(0x2, [ 9, 11, 13], "Alphanumeric");
	public static readonly BYTE         = new SegmentMode(0x4, [ 8, 16, 16], "Byte"        );
	public static readonly KANJI        = new SegmentMode(0x8, [ 8, 10, 12], "Kanji"       );
	public static readonly ECI          = new SegmentMode(0x7, [ 0,  0,  0], "ECI"         );
	
	
	private constructor(
		public readonly modeBits: int,
		private readonly numBitsCharCount: [int,int,int],
		public readonly name: string) {}
	
	
	public numCharCountBits(ver: int): int {
		return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
	}
	
	
	/*-- Character testing --*/
	
	public static isNumeric(cp: int): boolean {
		return ("0".codePointAt(0) as number) <= cp && cp <= ("9".codePointAt(0) as number);
	}
	
	public static isAlphanumeric(cp: int): boolean {
		return cp < 128 && SegmentMode.ALPHANUMERIC_CHARSET.includes(String.fromCodePoint(cp));
	}
	
	public static isKanji(cp: int): boolean {
		return cp < 0x10000 && ((parseInt(SegmentMode.KANJI_BIT_SET.charAt(cp >>> 2), 16) >>> (cp & 3)) & 1) != 0;
	}
	
	
	public static readonly ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
	
	
	private static readonly KANJI_BIT_SET =
		"0000000000000000000000010000000000000000C811350000000800000008000000000000000000000000000000000000000000000000000000000000000000" +
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
	
}
