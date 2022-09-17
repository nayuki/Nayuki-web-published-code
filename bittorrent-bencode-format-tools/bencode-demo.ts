/* 
 * BitTorrent bencode decoder demo (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
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


namespace app {
	
	/*---- User interface ----*/
	
	let fileElem = document.querySelector("article input[type='file']") as HTMLInputElement;
	fileElem.addEventListener("change", render);
	
	
	// Reads the input file, parses its data as bencode, then renders
	// HTML elements to this page in order to represent the data structure.
	function render(): void {
		let rootElem = document.querySelector("article #file-dissection") as HTMLElement;
		while (rootElem.firstChild !== null)
			rootElem.removeChild(rootElem.firstChild);
		
		const files = fileElem.files;
		if (files === null)
			return;
		let reader = new FileReader();
		reader.onload = func;
		reader.readAsArrayBuffer(files[0]);
		
		function func() {
			try {
				const bytes = new Uint8Array(reader.result as ArrayBuffer);
				const rootVal = BencodeParser.parse(bytes);
				rootElem.append(toHtml(rootVal));
			} catch (e) {
				rootElem.textContent = "Error: " + e.message;
			}
		}
	}
	
	
	// Returns a new DOM node to visually represent the given value.
	function toHtml(item: BencodeValue): Node {
		function appendText(container: Element, text: string): void {
			container.append(text);
		}
		
		function appendElem(container: Node, tagName: string): HTMLElement {
			let result = document.createElement(tagName);
			return container.appendChild(result);
		}
		
		let result = document.createElement("div");
		result.classList.add("item");
		if (item instanceof BencodeInt) {
			const s = "Integer: " + item.value.replace(/-/, "\u2212")
			appendText(result, s);
		}
		else if (item instanceof BencodeBytes) {
			appendText(result, `Byte string (${item.value.length}) `);
			try {
				const s: string = decodeUtf8(item.value);
				appendText(result, "(text): " + s);
			} catch (e) {
				let hex: Array<string> = [];
				for (let c of item.value)
					hex.push((c.codePointAt(0) as number).toString(16).toUpperCase().padStart(2, "0"));
				appendText(result, "(binary): " + hex.join(" "));
			}
		}
		else if (item instanceof BencodeList || item instanceof BencodeDict) {
			let table = document.createElement("table");
			let tbody = appendElem(table, "tbody");
			
			const addRow = function(a: string, b: Node): void {
				let tr = appendElem(tbody, "tr");
				let td = appendElem(tr, "td");
				let div = appendElem(td, "div");
				div.textContent = a;
				td = appendElem(tr, "td");
				td.append(b);
			};
			
			if (item instanceof BencodeList) {
				appendText(result, "List:");
				table.classList.add("list");
				result.append(table);
				item.array.forEach((val, i) =>
					addRow(i.toString(), toHtml(val)));
			} else if (item instanceof BencodeDict) {
				appendText(result, "Dictionary:");
				table.classList.add("dict");
				result.append(table);
				for (const key of item.keys) {
					const val = item.map.get(key);
					if (val === undefined)
						throw new Error("Assertion error");
					addRow(key, toHtml(val));
				}
			} else
				throw new Error("Assertion error");
		}
		else
			throw new Error("Assertion error");
		return result;
	}
	
	
	// Treats the given byte string as UTF-8, decodes it strictly, and returns a JavaScript UTF-16 string.
	function decodeUtf8(bytes: string): string {
		function cb(i: number): number {
			if (i < 0 || i >= bytes.length)
				throw new RangeError("Missing continuation bytes");
			const result = bytes.codePointAt(i) as number;
			if ((result & 0b11000000) != 0b10000000)
				throw new RangeError("Invalid continuation byte value");
			return result & 0b00111111;
		}
		
		let result: string = "";
		for (let i = 0; i < bytes.length; i++) {
			const lead = bytes.codePointAt(i) as number;
			if (lead < 0b10000000)  // Single byte ASCII (0xxxxxxx)
				result += bytes.charAt(i);
			else if (lead < 0b11000000)  // Continuation byte (10xxxxxx)
				throw new RangeError("Invalid leading byte");
			else if (lead < 0b11100000) {  // Two bytes (110xxxxx 10xxxxxx)
				const c: number = (lead & 0b00011111) << 6 | cb(i + 1) << 0;
				if (c < (1 << 7))
					throw new RangeError("Over-long UTF-8 sequence");
				result += String.fromCodePoint(c);
				i += 1;
			} else if (lead < 0b11110000) {  // Three bytes (1110xxxx 10xxxxxx 10xxxxxx)
				const c: number = (lead & 0b00001111) << 12 | cb(i + 1) << 6 | cb(i + 2) << 0;
				if (c < (1 << 11))
					throw new RangeError("Over-long UTF-8 sequence");
				if (0xD800 <= c && c < 0xE000)
					throw new RangeError("Invalid UTF-8 containing UTF-16 surrogate");
				result += String.fromCodePoint(c);
				i += 2;
			} else if (lead < 0b11111000) {  // Four bytes (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)
				let c: number = (lead & 0b00000111) << 18 | cb(i + 1) << 12 | cb(i + 2) << 6 | cb(i + 3);
				if (c < (1 << 16))
					throw new RangeError("Over-long UTF-8 sequence");
				if (c >= 0x110000)
					throw new RangeError("UTF-8 code point out of range");
				result += String.fromCodePoint(c);
				i += 3;
			} else
				throw new RangeError("Invalid leading byte");
		}
		return result;
	}
	
	
	
	/*---- Bencode parser ----*/
	
	class BencodeParser {
		
		// Parses the given byte array and returns the bencode value represented by the bytes.
		// The input data must have exactly one root object and then the array must immediately end.
		public static parse(array: Readonly<Uint8Array>): BencodeValue {
			return new BencodeParser(array).parseRoot();
		}
		
		
		private index: number = 0;
		
		private constructor(
			private readonly array: Readonly<Uint8Array>) {}
		
		
		private parseRoot(): BencodeValue {
			const result: BencodeValue = this.parseValue(this.readByte());
			if (this.index < this.array.length)
				throw new Error("Unexpected extra data at byte offset " + this.index);
			return result;
		}
		
		
		private parseValue(head: number): BencodeValue {
			if (head == cc("i"))
				return this.parseInteger();
			else if (cc("0") <= head && head <= cc("9"))
				return this.parseByteString(head);
			else if (head == cc("l"))
				return this.parseList();
			else if (head == cc("d"))
				return this.parseDictionary();
			else
				throw new Error("Unexpected item type at byte offset " + (this.index - 1));
		}
		
		
		private parseInteger(): BencodeInt {
			let str: string = "";
			while (true) {
				const b: number = this.readByte();
				const c: string = String.fromCodePoint(b);
				if (c == "e")
					break;
				
				let ok: boolean;
				if (str == "")
					ok = c == "-" || "0" <= c && c <= "9";
				else if (str == "-")
					ok = "1" <= c && c <= "9";
				else if (str == "0")
					ok = false;
				else  // str starts with [123456789] or -[123456789]
					ok = "0" <= c && c <= "9";
				
				if (!ok)
					throw new Error("Unexpected integer character at byte offset " + (this.index - 1));
				str += c;
			}
			if (str == "" || str == "-")
				throw new Error("Invalid integer syntax at byte offset " + (this.index - 1));
			return new BencodeInt(str);
		}
		
		
		private parseByteString(head: number): BencodeBytes {
			const length = this.parseNaturalNumber(head);
			let result: string = "";
			for (let i = 0; i < length; i++)
				result += String.fromCodePoint(this.readByte());
			return new BencodeBytes(result);
		}
		
		
		private parseNaturalNumber(head: number): number {
			let str: string = "";
			let b: number = head;
			do {
				if (b < cc("0") || b > cc("9") || str == "0")
					throw new Error("Unexpected integer character at byte offset " + (this.index - 1));
				str += String.fromCodePoint(b);
				b = this.readByte();
			} while (b != cc(":"));
			return parseInt(str, 10);
		}
		
		
		private parseList(): BencodeList {
			let result: Array<BencodeValue> = [];
			while (true) {
				const b: number = this.readByte();
				if (b == cc("e"))
					break;
				result.push(this.parseValue(b));
			}
			return new BencodeList(result);
		}
		
		
		private parseDictionary(): BencodeDict {
			let map = new Map<string,BencodeValue>();
			let keys: Array<string> = [];
			while (true) {
				const b: number = this.readByte();
				if (b == cc("e"))
					break;
				const key: string = this.parseByteString(b).value;
				if (keys.length > 0 && key <= keys[keys.length - 1])
					throw new Error("Misordered dictionary key at byte offset " + (this.index - key.length));
				keys.push(key);
				map.set(key, this.parseValue(this.readByte()));
			}
			return new BencodeDict(map, keys);
		}
		
		
		private readByte(): number {
			if (this.index >= this.array.length)
				throw new Error("Unexpected end of data at byte offset " + this.index);
			const result: number = this.array[this.index];
			this.index++;
			return result;
		}
		
	}
	
	
	// Returns the numeric code point of the given one-character ASCII string.
	function cc(s: string): number {
		if (s.length != 1)
			throw new RangeError("Invalid string length");
		return s.codePointAt(0) as number;
	}
	
	
	/*-- Bencode value types --*/
	
	abstract class BencodeValue {}
	
	class BencodeInt extends BencodeValue {
		public constructor(
				public readonly value: string) {
			super();
		}
	}
	
	class BencodeBytes extends BencodeValue {
		public constructor(
				public readonly value: string) {
			super();
		}
	}
	
	class BencodeList extends BencodeValue {
		public constructor(
				public readonly array: Array<BencodeValue>) {
			super();
		}
	}
	
	class BencodeDict extends BencodeValue {
		public constructor(
				public readonly map: Map<string,BencodeValue>,
				public readonly keys: Array<string>) {
			super();
		}
	}
	
}
