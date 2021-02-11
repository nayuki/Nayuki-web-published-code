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
		public data: Array<Node|string> = [];
		public errors: Array<Node|string> = [];
		
		public constructor(
			public readonly name: string) {}
	}
	
	
	
	let tbody = requireType(document.querySelector("article tbody"), HTMLElement);
	
	
	function parseFile(fileBytes: Uint8Array): void {
		while (tbody.firstChild !== null)
			tbody.removeChild(tbody.firstChild);
		
		let offset: int = 0;
		
		{
			const chunk: Uint8Array = fileBytes.slice(offset, Math.min(offset + SIGNATURE_LENGTH, fileBytes.length));
			const [dec, valid]: [DecodedChunk,boolean] = parseFileSignature(chunk);
			appendRow(0, chunk, null, dec)
			offset += chunk.length;
			
			if (!valid) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				let dec = new DecodedChunk("Unsupported");
				dec.errors.push("Unsupported format");
				appendRow(offset, chunk, null, dec);
				offset += chunk.length;
				return;
			}
		}
		
		function renderProperties(typeCode: Uint8Array): Node {
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
			const remain: int = fileBytes.length - offset;
			let typeCodeStr: string|null = null;
			
			if (remain < 4) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				let dec = new DecodedChunk("Unfinished");
				dec.errors.push("Premature EOF");
				appendRow(offset, chunk, typeCodeStr, dec);
				break;
			}
			
			const dataLen: int =
				 (fileBytes[offset + 0] << 24
				| fileBytes[offset + 1] << 16
				| fileBytes[offset + 2] <<  8
				| fileBytes[offset + 3] <<  0) >>> 0;
			
			let typeCodeProps: Node|null = null;
			if (remain >= 8) {
				const typeCodeBytes: Uint8Array = fileBytes.slice(offset + 4, offset + 8);
				typeCodeStr = bytesToReadableString(typeCodeBytes);
				typeCodeProps = renderProperties(typeCodeBytes);
			}
			
			if (dataLen >= 0x80000000) {
				const chunk: Uint8Array = fileBytes.slice(offset, Math.min(offset + 8, fileBytes.length));
				let dec = new DecodedChunk("Invalid");
				dec.data.splice(0, 0, `Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
				if (typeCodeProps !== null)
					dec.data.push(typeCodeProps);
				dec.errors.push("Length out of range");
				appendRow(offset, chunk, typeCodeStr, dec);
				break;
			}
			
			if (remain < 12 + dataLen) {
				const chunk: Uint8Array = fileBytes.slice(offset, fileBytes.length);
				let dec = new DecodedChunk("Unfinished");
				dec.data.splice(0, 0, `Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
				if (typeCodeProps !== null)
					dec.data.push(typeCodeProps);
				dec.errors.push("Premature EOF");
				appendRow(offset, chunk, typeCodeStr, dec);
				break;
			}
			
			const chunk = fileBytes.slice(offset, offset + 12 + dataLen);
			
			const storedCrc: int =
				 (chunk[chunk.length - 4] << 24
				| chunk[chunk.length - 3] << 16
				| chunk[chunk.length - 2] <<  8
				| chunk[chunk.length - 1] <<  0) >>> 0;
			const dataCrc: int = calcCrc32(chunk.slice(4, chunk.length - 4));
			if (dataCrc != storedCrc) {
				let dec = new DecodedChunk("Invalid");
				dec.data.push(`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
				dec.data.push(requireType(typeCodeProps, Node));
				dec.data.push(`CRC-32: ${storedCrc.toString(16).padStart(8,"0").toUpperCase()}`);
				dec.errors.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8,"0").toUpperCase()})`);
				appendRow(offset, chunk, typeCodeStr, dec);
				break;
			}
			
			const data = chunk.slice(8, chunk.length - 4);
			let dec: DecodedChunk;
			switch (typeCodeStr) {
				case "IDAT":  dec = parse_IDAT_Chunk(data);  break;
				case "IEND":  dec = parse_IEND_Chunk(data);  break;
				case "IHDR":  dec = parse_IHDR_Chunk(data);  break;
				case "pHYs":  dec = parse_pHYs_Chunk(data);  break;
				default:  dec = new DecodedChunk("Unknown");  break;
			}
			dec.data.splice(0, 0,
				`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`,
				requireType(typeCodeProps, Node));
			dec.data.push(`CRC-32: ${storedCrc.toString(16).padStart(8,"0").toUpperCase()}`);
			appendRow(offset, chunk, typeCodeStr, dec);
			offset += chunk.length;
		}
	}
	
	
	function appendRow(
			startOffset: int,
			rawBytes: Uint8Array,
			chunkTypeCode: string|null,
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
	
	
	
	const SIGNATURE_LENGTH: int = 8;
	
	function parseFileSignature(bytes: Uint8Array): [DecodedChunk,boolean] {
		let dec = new DecodedChunk("File signature");
		let valid: boolean = true;
		
		const expected: Array<int> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
		for (let i = 0; valid && i < expected.length; i++) {
			if (i >= bytes.length) {
				dec.errors.push("Premature EOF");
				valid = false;
			} else if (bytes[i] != expected[i]) {
				dec.errors.push("Value mismatch");
				valid = false;
			}
		}
		
		dec.data.push(`\u201C${bytesToReadableString(bytes)}\u201D`);
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
	
	
	function parse_IDAT_Chunk(data: Uint8Array): DecodedChunk {
		return new DecodedChunk("Image data");
	}
	
	
	function parse_IEND_Chunk(data: Uint8Array): DecodedChunk {
		return new DecodedChunk("Image trailer");
	}
	
	
	function parse_IHDR_Chunk(data: Uint8Array): DecodedChunk {
		return new DecodedChunk("Image header");
	}
	
	
	function parse_pHYs_Chunk(data: Uint8Array): DecodedChunk {
		return new DecodedChunk("Physical pixel dimensions");
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
	
	
	type Constructor<T> = { new(...args: any[]): T };
	
	function requireType<T>(val: unknown, type: Constructor<T>): T {
		if (val instanceof type)
			return val;
		else
			throw "Invalid value type";
	}
	
}
