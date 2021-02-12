/* 
 * PNG file chunk inspector (TypeScript)
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/png-file-chunk-inspector
 */


namespace app {
	
	type int = number;
	
	
	function initialize(): void {
		let fileElem = requireType(document.querySelector("article input[type=file]"), HTMLInputElement);
		fileElem.onchange = (): void => {
			const files: FileList|null = fileElem.files;
			if (files === null || files.length < 1)
				return;
			let reader = new FileReader();
			reader.onload = (): void => {
				const bytes = requireType(reader.result, ArrayBuffer);
				parseFile(new Uint8Array(bytes));
			};
			reader.readAsArrayBuffer(files[0]);
		};
	}
	
	setTimeout(initialize);
	
	
	
	class DecodedChunk {
		public data: Array<string|Node> = [];
		public errors: Array<string|Node> = [];
	}
	
	
	type ChunkDecoder = (bytes: Uint8Array, dec: DecodedChunk) => void;
	
	
	
	let table = requireType(document.querySelector("article table"), HTMLElement);
	let tbody = requireType(table.querySelector("tbody"), HTMLElement);
	
	
	function parseFile(fileBytes: Uint8Array): void {
		table.classList.remove("errors");
		while (tbody.firstChild !== null)
			tbody.removeChild(tbody.firstChild);
		let offset: int = 0;
		
		{
			const chunk: Uint8Array = fileBytes.slice(offset, Math.min(offset + SIGNATURE_LENGTH, fileBytes.length));
			const [dec, valid]: [DecodedChunk,boolean] = parseFileSignature(chunk);
			appendRow(0, chunk, ["Special: File signature", `Length: ${uintToStrWithThousandsSeparators(chunk.length)} bytes`], dec)
			offset += chunk.length;
			
			if (!valid) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				let dec = new DecodedChunk();
				dec.errors.push("Unknown format");
				appendRow(offset, chunk, ["Special: Unknown", `Length: ${uintToStrWithThousandsSeparators(chunk.length)} bytes`], dec);
				offset += chunk.length;
				return;
			}
		}
		
		while (offset < fileBytes.length) {
			const remain: int = fileBytes.length - offset;
			let chunkOutside: Array<string|Node> = [];
			let dec = new DecodedChunk();
			
			if (remain < 12) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				chunkOutside.push("Special: Unfinished");
				dec.errors.push("Premature EOF");
				appendRow(offset, chunk, chunkOutside, dec);
				break;
			}
			
			const typeCodeBytes: Uint8Array = fileBytes.slice(offset + 4, offset + 8);
			const typeCodeStr: string = bytesToReadableString(typeCodeBytes);
			const typeNameAndFunc: [string,ChunkDecoder]|undefined = CHUNK_TYPES.get(typeCodeStr);
			chunkOutside.push("Name: " + (typeNameAndFunc !== undefined ? typeNameAndFunc[0] : "Unknown"));
			chunkOutside.push("Type code: " + typeCodeStr);
			chunkOutside.push((typeCodeBytes[0] & 0x20) == 0 ? "Critical (0)"       : "Ancillary (1)"   );
			chunkOutside.push((typeCodeBytes[1] & 0x20) == 0 ? "Public (0)"         : "Private (1)"     );
			chunkOutside.push((typeCodeBytes[2] & 0x20) == 0 ? "Reserved (0)"       : "Unknown (1)" );
			chunkOutside.push((typeCodeBytes[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)");
			
			const dataLen: int = readUint32(fileBytes, offset);
			chunkOutside.push(`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
			
			if (dataLen > 0x80000000) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				dec.errors.push("Length out of range");
				appendRow(offset, chunk, chunkOutside, dec);
				break;
			}
			if (remain < 12 + dataLen) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				dec.errors.push("Premature EOF");
				appendRow(offset, chunk, chunkOutside, dec);
				break;
			}
			
			const chunk: Uint8Array = fileBytes.slice(offset, offset + 12 + dataLen);
			const storedCrc: int = readUint32(chunk, chunk.length - 4);
			chunkOutside.push(`CRC-32: ${storedCrc.toString(16).padStart(8,"0").toUpperCase()}`);
			
			const dataCrc: int = calcCrc32(chunk.slice(4, chunk.length - 4));
			if (dataCrc != storedCrc) {
				dec.errors.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8,"0").toUpperCase()})`);
				appendRow(offset, chunk, chunkOutside, dec);
			}
			else {
				const data: Uint8Array = chunk.slice(8, chunk.length - 4);
				if (typeNameAndFunc !== undefined)
					typeNameAndFunc[1](data, dec);
				appendRow(offset, chunk, chunkOutside, dec);
			}
			offset += chunk.length;
		}
	}
	
	
	function appendRow(
			startOffset: int,
			rawBytes: Uint8Array,
			chunkOutside: Array<string|Node>,
			decodedChunk: DecodedChunk)
			: void {
		
		let tr = appendElem(tbody, "tr");
		appendElem(tr, "td", uintToStrWithThousandsSeparators(startOffset));
		
		{
			let td = appendElem(tr, "td");
			let hex: Array<string> = [];
			if (rawBytes.length <= 100) {
				for (let i = 0; i < rawBytes.length; i++)
					hex.push(rawBytes[i].toString(16).padStart(2, "0"));
			} else {
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
	
	
	
	const SIGNATURE_LENGTH: int = 8;
	
	function parseFileSignature(bytes: Uint8Array): [DecodedChunk,boolean] {
		let dec = new DecodedChunk();
		dec.data.push(`\u201C${bytesToReadableString(bytes)}\u201D`);
		
		const EXPECTED: Array<int> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
		let valid: boolean = true;
		for (let i = 0; valid && i < EXPECTED.length; i++) {
			if (i >= bytes.length) {
				dec.errors.push("Premature EOF");
				valid = false;
			} else if (bytes[i] != EXPECTED[i]) {
				dec.errors.push("Value mismatch");
				valid = false;
			}
		}
		return [dec, valid];
	}
	
	
	function calcCrc32(bytes: Uint8Array): int {
		let crc: int = ~0;
		for (let i = 0; i < bytes.length; i++) {
			for (let b = bytes[i], j = 0; j < 8; j++) {
				crc ^= (b >>> j) & 1;
				crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
			}
		}
		return ~crc >>> 0;
	}
	
	
	function bytesToReadableString(bytes: Uint8Array): string {
		let result: string = "";
		for (let i = 0; i < bytes.length; i++) {
			const b: int = bytes[i];
			let cc: int = b;
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
	
	
	function uintToStrWithThousandsSeparators(val: int): string {
		if (val < 0 || Math.floor(val) != val)
			throw "Invalid unsigned integer";
		let result: string = val.toString();
		for (let i = result.length - 3; i > 0; i -= 3)
			result = result.substring(0, i) + "\u00A0" + result.substring(i);
		return result;
	}
	
	
	function appendElem(container: Node, tagName: string, text?: string): HTMLElement {
		let result = document.createElement(tagName);
		container.appendChild(result);
		if (text !== undefined)
			result.textContent = text;
		return result;
	}
	
	
	
	let CHUNK_TYPES = new Map<string,[string,ChunkDecoder]>();
	
	
	CHUNK_TYPES.set("bKGD", ["Background color", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("cHRM", ["Primary chromaticities", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 32) {
			dec.errors.push("Invalid data length");
			return;
		}
		let offset: int = 0;
		for (const item of ["White point", "Red", "Green", "Blue"]) {
			for (const axis of ["x", "y"]) {
				const val: int = readUint32(bytes, offset);
				let s: string = val.toString().padStart(6, "0");
				s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
				// s basically equals (val/100000).toFixed(5)
				dec.data.push(`${item} ${axis}: ${s}`);
				offset += 4;
			}
		}
	}]);
	
	
	CHUNK_TYPES.set("gAMA", ["Image gamma", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 4) {
			dec.errors.push("Invalid data length");
			return;
		}
		const gamma: int = readUint32(bytes, 0);
		let s: string = gamma.toString().padStart(6, "0");
		s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
		// s basically equals (gamma/100000).toFixed(5)
		dec.data.push(`Gamma: ${s}`);
	}]);
	
	
	CHUNK_TYPES.set("hIST", ["Palette histogram", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length % 2 != 0 || bytes.length / 2 > 256) {
			dec.errors.push("Invalid data length");
			return;
		}
	}]);
	
	
	CHUNK_TYPES.set("iCCP", ["Embedded ICC profile", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("IDAT", ["Image data", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("IEND", ["Image trailer", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 0)
			dec.errors.push("Non-empty data");
	}]);
	
	
	CHUNK_TYPES.set("IHDR", ["Image header", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 13) {
			dec.errors.push("Invalid data length");
			return;
		}
		const width    : int = readUint32(bytes, 0);
		const height   : int = readUint32(bytes, 4);
		const bitDepth : int = bytes[ 8];
		const colorType: int = bytes[ 9];
		const compMeth : int = bytes[10];
		const filtMeth : int = bytes[11];
		const laceMeth : int = bytes[12];
		
		dec.data.push(`Width: ${width} pixels`);
		if (width == 0 || width > 0x80000000)
			dec.errors.push("Width out of range");
		
		dec.data.push(`Height: ${height} pixels`);
		if (height == 0 || height > 0x80000000)
			dec.errors.push("Width out of range");
		
		let colorTypeStr: string;
		let validBitDepths: Array<int>;
		switch (colorType) {
			case  0:  colorTypeStr = "Grayscale"      ;  validBitDepths = [1, 2, 4, 8, 16];  break;
			case  2:  colorTypeStr = "RGB"            ;  validBitDepths = [8, 16]         ;  break;
			case  3:  colorTypeStr = "Palette"        ;  validBitDepths = [1, 2, 4, 8]    ;  break;
			case  4:  colorTypeStr = "Grayscale+Alpha";  validBitDepths = [8, 16]         ;  break;
			case  6:  colorTypeStr = "RGBA"           ;  validBitDepths = [8, 16]         ;  break;
			default:  colorTypeStr = "Unknown"        ;  validBitDepths = []              ;  break;
		}
		dec.data.push(`Bit depth: ${bitDepth} bits per ${colorType!=3?"channel":"pixel"}`);
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
	
	
	CHUNK_TYPES.set("iTXt", ["International textual data", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("pHYs", ["Physical pixel dimensions", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 9) {
			dec.errors.push("Invalid data length");
			return;
		}
		const horzRes: int = readUint32(bytes, 0);
		const vertRes: int = readUint32(bytes, 4);
		const unit   : int = bytes[8];
		dec.data.push(`Horizontal resolution: ${horzRes} pixels per unit${unit==1?" (\u2248 "+(horzRes*0.0254).toFixed(0)+" DPI)":""}`);
		dec.data.push(`Vertical resolution: ${vertRes} pixels per unit${unit==1?" (\u2248 "+(vertRes*0.0254).toFixed(0)+" DPI)":""}`);
		if (unit == 0)
			dec.data.push(`Unit specifier: Arbitrary (aspect ratio only) (${unit})`);
		else if (unit == 1)
			dec.data.push(`Unit specifier: Metre (${unit})`);
		else {
			dec.data.push(`Unit specifier: Unknown (${unit})`);
			dec.errors.push("Unknown unit specifier");
		}
	}]);
	
	
	CHUNK_TYPES.set("PLTE", ["Palette", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("sBIT", ["Significant bits", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length == 0 || bytes.length > 4)
			dec.errors.push("Invalid data length");
		let temp: Array<string> = [];
		for (let i = 0; i < bytes.length; i++)
			temp.push(bytes[i].toString());
		dec.data.push(`Significant bits per channel: ${temp.join(", ")}`);
	}]);
	
	
	CHUNK_TYPES.set("sPLT", ["Suggested palette", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("sRGB", ["Standard RGB color space", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 1) {
			dec.errors.push("Invalid data length");
			return;
		}
		const renderIntent: int = bytes[0];
		let s: string;
		switch (renderIntent) {
			case  0:  s = "Perceptual"           ;  break;
			case  1:  s = "Relative colorimetric";  break;
			case  2:  s = "Saturation"           ;  break;
			case  3:  s = "Absolute colorimetric";  break;
			default:  s = "Unknown";  dec.errors.push("Unknown rendering intent");  break;
		}
		dec.data.push(`Rendering intent: ${s} (${renderIntent})`);
	}]);
	
	
	CHUNK_TYPES.set("tEXt", ["Textual data", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("tIME", ["Image last-modification time", function(bytes: Uint8Array, dec: DecodedChunk): void {
		if (bytes.length != 7) {
			dec.errors.push("Invalid data length");
			return;
		}
		const year  : int = readUint16(bytes, 0);
		const month : int = bytes[2];
		const day   : int = bytes[3];
		const hour  : int = bytes[4];
		const minute: int = bytes[5];
		const second: int = bytes[6];
		dec.data.push(`Year: ${year}`);
		dec.data.push(`Month: ${month}`);
		dec.data.push(`Day: ${day}`);
		dec.data.push(`Hour: ${hour}`);
		dec.data.push(`Minute: ${minute}`);
		dec.data.push(`Second: ${second}`);
	}]);
	
	
	CHUNK_TYPES.set("tRNS", ["Transparency", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	CHUNK_TYPES.set("zTXt", ["Compressed textual data", function(bytes: Uint8Array, dec: DecodedChunk): void {
	}]);
	
	
	
	function readUint16(bytes: Uint8Array, offset: int): int {
		if (bytes.length - offset < 2)
			throw "Index out of range";
		return bytes[offset + 0] << 8
		     | bytes[offset + 1] << 0;
	}
	
	
	function readUint32(bytes: Uint8Array, offset: int): int {
		if (bytes.length - offset < 4)
			throw "Index out of range";
		return (bytes[offset + 0] << 24
		      | bytes[offset + 1] << 16
		      | bytes[offset + 2] <<  8
		      | bytes[offset + 3] <<  0) >>> 0;
	}
	
	
	type Constructor<T> = { new(...args: any[]): T };
	
	function requireType<T>(val: unknown, type: Constructor<T>): T {
		if (val instanceof type)
			return val;
		else
			throw "Invalid value type";
	}
	
}
