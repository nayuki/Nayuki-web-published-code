/* 
 * SQLite database file visualizations
 * 
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/sqlite-database-file-visualizations
 */


type int = number;


/*---- File header ----*/

(function() {
	
	let container = queryHtml("article section.file-header");
	let fileElem = subqueryElem(container, "input", HTMLInputElement);
	let tableElem = subqueryElem(container, "table", HTMLElement);
	
	fileElem.onchange = async (): Promise<void> => {
		const files: FileList|null = fileElem.files;
		if (files === null || files.length < 1)
			return;
		let reader = new FileReader();
		const arrayBuf = await new Promise<ArrayBuffer>(resolve => {
			reader.onload = () => {
				const temp: any = reader.result;
				if (!(temp instanceof ArrayBuffer))
					throw new TypeError();
				resolve(temp);
			};
			reader.readAsArrayBuffer(files[0]);
		});
		visualize(arrayBuf);
	};
	
	
	function visualize(fileArray: ArrayBuffer): void {
		const fileBytes = new Uint8Array(fileArray);
		let readIndex: int = 0;
		
		function readUint(numBytes: int): int|null {
			if (numBytes > fileBytes.length - readIndex)
				return null;
			let result: int = 0;
			for (let i = 0; i < numBytes; i++, readIndex++)
				result = (result << 8) | fileBytes[readIndex];
			return result >>> 0;
		}
		
		let interpretedValues = container.querySelectorAll("tbody td:nth-child(2)");
		let errorMessages     = container.querySelectorAll("tbody td:nth-child(3)");
		for (let cell of [...interpretedValues, ...errorMessages])
			cell.textContent = "";
		let row: int = 0;
		
		let formatBytes: Array<byte> = [];
		for (let i = 0; i < 16; i++) {
			const b: int|null = readUint(1);
			if (b === null)
				break;
			formatBytes.push(b);
		}
		interpretedValues[row].textContent = bytesToReadableString(formatBytes);
		if (formatBytes.length < 16) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		} else if (String.fromCharCode.apply(null, formatBytes) != "SQLite format 3\0") {
			errorMessages[row].textContent = "Unrecognized value";
			return;
		}
		row++;
		
		let pageSize: int|null = readUint(2);
		if (pageSize === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		if (pageSize == 1)
			pageSize = 65536;
		if ((pageSize & (pageSize - 1)) != 0)
			errorMessages[row].textContent = "Not a power of 2";
		else if (pageSize < 512)
			errorMessages[row].textContent = "Too small";
		interpretedValues[row++].textContent = `${pageSize} bytes`;
		
		const READ_WRITE_VERSIONS = new Map<int,string>([
			[1, "Legacy"],
			[2, "WAL"],
		]);
		
		const writeVersion: int|null = readUint(1);
		if (writeVersion === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		if (!READ_WRITE_VERSIONS.has(writeVersion))
			errorMessages[row].textContent = "Unrecognized value";
		interpretedValues[row++].textContent = `${READ_WRITE_VERSIONS.has(writeVersion) ? READ_WRITE_VERSIONS.get(writeVersion) : "Unknown"} (${writeVersion})`;
		
		const readVersion: int|null = readUint(1);
		if (readVersion === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		if (!READ_WRITE_VERSIONS.has(readVersion))
			errorMessages[row].textContent = "Unrecognized value";
		interpretedValues[row++].textContent = `${READ_WRITE_VERSIONS.has(readVersion) ? READ_WRITE_VERSIONS.get(readVersion) : "Unknown"} (${readVersion})`;
		
		const pageEndReservedSpace: int|null = readUint(1);
		if (pageEndReservedSpace === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		if (pageSize - pageEndReservedSpace < 480)
			errorMessages[row].textContent = "Too large";
		interpretedValues[row++].textContent = `${pageEndReservedSpace} bytes`;
		
		const maxEmbeddedPayloadFraction: int|null = readUint(1);
		if (maxEmbeddedPayloadFraction === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		} else if (maxEmbeddedPayloadFraction != 64)
			errorMessages[row].textContent = "Must be 64";
		interpretedValues[row++].textContent = `${maxEmbeddedPayloadFraction}`;
		
		const minEmbeddedPayloadFraction: int|null = readUint(1);
		if (minEmbeddedPayloadFraction === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		} else if (minEmbeddedPayloadFraction != 32)
			errorMessages[row].textContent = "Must be 32";
		interpretedValues[row++].textContent = `${minEmbeddedPayloadFraction}`;
		
		const leafPayloadFraction: int|null = readUint(1);
		if (leafPayloadFraction === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		} else if (leafPayloadFraction != 32)
			errorMessages[row].textContent = "Must be 32";
		interpretedValues[row++].textContent = `${leafPayloadFraction}`;
		
		const fileChangeCounter: int|null = readUint(4);
		if (fileChangeCounter === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${fileChangeCounter}`;
		
		const numPages: int|null = readUint(4);
		if (numPages === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${numPages} pages`;
		
		const firstFreelistTrunkPage: int|null = readUint(4);
		if (firstFreelistTrunkPage === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = firstFreelistTrunkPage != 0 ? firstFreelistTrunkPage.toString() : "None (0)";
		
		const numFreelistPages: int|null = readUint(4);
		if (numFreelistPages === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${numFreelistPages}`;
		
		const schemaCookie: int|null = readUint(4);
		if (schemaCookie === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${schemaCookie}`;
		
		const schemaFormat: int|null = readUint(4);
		if (schemaFormat === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		if (!(1 <= schemaFormat && schemaFormat <= 4))
			errorMessages[row].textContent = "Unrecognized value";
		interpretedValues[row++].textContent = `${schemaFormat}`;
		
		const defaultPageCacheSize: int|null = readUint(4);
		if (defaultPageCacheSize === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${defaultPageCacheSize}`;
		
		const largestRootBtreePage: int|null = readUint(4);
		if (largestRootBtreePage === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${largestRootBtreePage}`;
		
		const TEXT_ENCODINGS = new Map<int,string>([
			[1, "UTF-8"],
			[2, "UTF-16LE"],
			[3, "UTF-16BE"],
		]);
		const textEncoding: int|null = readUint(4);
		if (textEncoding === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		if (!TEXT_ENCODINGS.has(textEncoding))
			errorMessages[row].textContent = "Unrecognized value";
		interpretedValues[row++].textContent = `${TEXT_ENCODINGS.has(textEncoding) ? TEXT_ENCODINGS.get(textEncoding) : "Unknown"} (${textEncoding})`;
		
		const userVersion: int|null = readUint(4);
		if (userVersion === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${userVersion}`;
		
		const incrementalVacuum: int|null = readUint(4);
		if (incrementalVacuum === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${incrementalVacuum}`;
		
		const applicationId: int|null = readUint(4);
		if (applicationId === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${applicationId}`;
		
		let reserved: Array<byte> = [];
		for (let i = 0; i < 20; i++) {
			const b: int|null = readUint(1);
			if (b === null)
				break;
			reserved.push(b);
		}
		interpretedValues[row].textContent = reserved.map(b => b.toString(16).padStart(2, "0")).join(" ");
		if (reserved.length < 20) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		} else if (reserved.some(b => b != 0))
			errorMessages[row].textContent = "Must be all zeros";
		row++;
		
		const versionValidForNumber: int|null = readUint(4);
		if (versionValidForNumber === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${versionValidForNumber}`;
		
		const sqliteVersionNumber: int|null = readUint(4);
		if (sqliteVersionNumber === null) {
			errorMessages[row].textContent = "Premature end of file";
			return;
		}
		interpretedValues[row++].textContent = `${Math.floor(sqliteVersionNumber/1_000_000)}.${Math.floor(sqliteVersionNumber/1_000)%1_000}.${sqliteVersionNumber%1_000} (${sqliteVersionNumber})`;
	}
	
	
	function bytesToReadableString(bytes: Array<byte>): string {
		let result: string = "";
		for (const b of bytes) {
			let cc: int = b;
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
	
})();



/*---- Page owners ----*/

(function() {
	
	let container = queryHtml("article section.page-owners");
	let fileElem = subqueryElem(container, "input", HTMLInputElement);
	let svgElem = subqueryElem(container, "svg", Element);
	let tbodyElem = subqueryElem(container, "tbody", Element);
	
	fileElem.onchange = async (): Promise<void> => {
		const files: FileList|null = fileElem.files;
		if (files === null || files.length < 1)
			return;
		let reader = new FileReader();
		const arrayBuf = await new Promise<ArrayBuffer>(resolve => {
			reader.onload = () => {
				const temp: any = reader.result;
				if (!(temp instanceof ArrayBuffer))
					throw new TypeError();
				resolve(temp);
			};
			reader.readAsArrayBuffer(files[0]);
		});
		visualize(new Uint8Array(arrayBuf));
	};
	
	
	function visualize(fileBytes: Uint8Array): void {
		{
			let formatBytes: Array<byte> = [];
			let deser = new Deserializer(fileBytes, 0, 16);
			for (let i = 0; i < 16; i++)
				formatBytes.push(deser.readUint8());
			if (String.fromCharCode.apply(null, formatBytes) != "SQLite format 3\0")
				throw new Error("Unrecognized format string");
		}
		
		let pageSize: int = new Deserializer(fileBytes, 16, 100).readUint16();
		if (pageSize == 1)
			pageSize = 65536;
		const pageEndReservedSpace: int = new Deserializer(fileBytes, 20, 100).readUint8();
		const numPages: int = Math.floor(fileBytes.length / pageSize);
		
		class Owner {
			public constructor(
				public readonly name: string,
				public color: string) {}
		}
		
		let owners: Array<Owner> = [];
		let pageOwners: Array<Owner> = [];
		const freeSpace = new Owner("Free space", "#404040");
		for (let i = 0; i < numPages; i++)
			pageOwners.push(freeSpace);
		
		const sqliteMaster = new Owner("sqlite_master", `hsl(${(owners.length*(Math.sqrt(5)-1)/2).toFixed(3)}turn 80% 60%)`);
		owners.push(sqliteMaster);
		traverseBtree(sqliteMaster, 1);
		owners.push(freeSpace);
		visualizePages();
		
		
		function traverseBtree(owner: Owner, pageNumber: int): void {
			if (!(1 <= pageNumber && pageNumber <= Math.floor(fileBytes.length / pageSize)))
				throw new RangeError("Page number out of range");
			pageOwners[pageNumber - 1] = owner;
			
			const page: Uint8Array = fileBytes.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
			const pageStart: int = pageNumber == 1 ? 100 : 0;
			const pageEnd: int = pageSize - pageEndReservedSpace;
			const usableSize: int = pageEnd - pageStart;
			
			let des0 = new Deserializer(page, pageStart, pageEnd);
			const nodeType: int = des0.readUint8();
			if (nodeType > 0x0F)
				throw new RangeError("Invalid B-tree node type");
			const isInterior: boolean = (nodeType & 0x08) == 0;
			const isTable: boolean = (nodeType & 0x07) == 0x05;
			
			const firstFreeblock: int = des0.readUint16();
			const numCells: int = des0.readUint16();
			const contentAreaStart: int = des0.readUint16();
			const contentFragmentedFreeBytes: int = des0.readUint8();
			const rightChild: int|null = isInterior ? des0.readUint32() : null;
			
			for (let i = 0; i < numCells; i++) {
				const offset: int = des0.readUint16();
				if (!(pageStart <= offset && offset < pageEnd))
					throw new RangeError("Offset out of range");
				
				let des1 = new Deserializer(page, offset, pageEnd);
				if (isInterior) {
					const leftChild: int = des1.readUint32();
					traverseBtree(owner, leftChild);
				}
				
				if (isTable && isInterior) {
					const key = des1.readVarint();
				} else {
					const payloadLen: int = des1.readVarint();
					if (isTable) {
						const key = des1.readVarint();
					}
					const threshold: int = isTable ? usableSize - 35 : Math.floor((usableSize - 12) * 64 / 255) - 23;
					let payload = new Uint8Array(payloadLen);
					if (payloadLen <= threshold)
						des1.readBytes(payload, 0, payloadLen);
					else {
						const m: int = Math.floor((usableSize - 12) * 32 / 255) - 23;
						const k: int = m + (payloadLen - m) % (usableSize - 4);
						let nextLen: int = k <= threshold ? k : m;
						let payloadIndex: int = 0;
						des1.readBytes(payload, payloadIndex, nextLen);
						payloadIndex += nextLen;
						let nextOverflowPage: int = des1.readUint32();
						if (nextOverflowPage == 0)
							throw new RangeError("Invalid first overflow page");
						do {
							pageOwners[nextOverflowPage - 1] = owner;
							const overflowPage: Uint8Array = fileBytes.slice((nextOverflowPage - 1) * pageSize, nextOverflowPage * pageSize);
							let des2 = new Deserializer(overflowPage, 0, pageEnd);
							nextOverflowPage = des2.readUint32();
							nextLen = Math.min(pageEnd - 4, payloadLen - payloadIndex);
							des2.readBytes(payload, payloadIndex, nextLen);
							payloadIndex += nextLen;
						} while (nextOverflowPage != 0);
					}
					
					let des3 = new Deserializer(payload, 0, Math.min(payload.length, 9));
					const headerLen: int = des3.readVarint();
					des3 = new Deserializer(payload, 0, headerLen);
					des3.readVarint();
					let serialTypes: Array<int> = [];
					while (!des3.isAtEnd())
						serialTypes.push(des3.readVarint());
					
					des3 = new Deserializer(payload, headerLen, payload.length);
					let columnValues: Array<null|int|string|Uint8Array> = [];
					for (const serialType of serialTypes) {
						let val: null|number|string|Uint8Array;
						if (serialType == 0)
							val = null;
						else if (1 <= serialType && serialType <= 6) {
							const numBytes: int = serialType <= 4 ? serialType : serialType * 2 - 4;
							val = des3.readInt(numBytes);
						} else if (serialType == 7) {
							let temp = new ArrayBuffer(8);
							des3.readBytes(new Uint8Array(temp), 0, 8);
							val = new Float64Array(temp)[0];
						} else if (serialType == 8)
							val = 0;
						else if (serialType == 9)
							val = 1;
						else if (serialType == 10 || serialType == 11)
							throw new RangeError("Reserved serial type");
						else if (serialType >= 12) {
							let bytes = new Uint8Array(Math.floor(serialType / 2) - 6);
							des3.readBytes(bytes, 0, bytes.length);
							if (serialType % 2 == 0)
								val = bytes;
							else
								val = new TextDecoder("utf-8").decode(bytes);
						} else
							throw new Error("Unreachable");
						columnValues.push(val);
					}
					if (!des3.isAtEnd())
						throw new Error("Extra bytes at end");
					
					if (owner == sqliteMaster && columnValues.length == 5) {
						const [type, name, tbl_name, rootpage, sql] = columnValues;
						if ((type === "table" || type === "index") && typeof name == "string"
								&& typeof rootpage == "number" && rootpage != 0) {
							const nextOwner = new Owner(name, `hsl(${(owners.length*(Math.sqrt(5)-1)/2).toFixed(3)}turn 80% 60%)`);
							owners.push(nextOwner);
							traverseBtree(nextOwner, rootpage);
						}
					}
				}
			}
			
			if (rightChild !== null)
				traverseBtree(owner, rightChild);
		}
		
		
		function visualizePages(): void {
			const width: int = 50;
			const height: int = Math.ceil(numPages / width);
			const SIZE: number = 0.9;
			svgElem.setAttribute("viewBox", `0 0 ${width} ${height}`);
			svgElem.replaceChildren();
			
			let rect: Element = svgElem.appendChild(document.createElementNS(svgElem.namespaceURI, "rect"));
			rect.setAttribute("x", "-1");
			rect.setAttribute("y", "-1");
			rect.setAttribute("width", (width + 2).toString());
			rect.setAttribute("height", (height + 2).toString());
			rect.setAttribute("fill", "#FFFFFF");
			
			let g: Element = svgElem.appendChild(document.createElementNS(svgElem.namespaceURI, "g"));
			g.setAttribute("transform", `translate(${(1 - SIZE) / 2} ${(1 - SIZE) / 2})`);
			for (let i = 0; i < numPages; i++) {
				rect = svgElem.appendChild(document.createElementNS(svgElem.namespaceURI, "rect"));
				rect.setAttribute("x", (i % width).toString());
				rect.setAttribute("y", Math.floor(i / width).toString());
				rect.setAttribute("width", SIZE.toString());
				rect.setAttribute("height", SIZE.toString());
				rect.setAttribute("fill", pageOwners[i].color);
			}
			
			tbodyElem.replaceChildren();
			for (const owner of owners) {
				let tr = tbodyElem.appendChild(document.createElement("tr"));
				let td = tr.appendChild(document.createElement("td"));
				let div = td.appendChild(document.createElement("div"));
				div.style.backgroundColor = owner.color;
				td = tr.appendChild(document.createElement("td"));
				td.textContent = owner.name;
			}
		}
	}
	
	
	class Deserializer {
		public constructor(
			private data: Uint8Array,
			private start: int,
			private end: int) {}
		
		public isAtEnd(): boolean {
			return this.start == this.end;
		}
		
		public readBytes(arr: Uint8Array, off: int, len: int): void {
			if (len > this.end - this.start)
				throw new RangeError("Out of range");
			for (let i = 0; i < len; i++, off++, this.start++)
				arr[off] = this.data[this.start];
		}
		
		public readUint8(): int {
			return this.readUint(1);
		}
		
		public readUint16(): int {
			return this.readUint(2);
		}
		
		public readUint32(): int {
			return this.readUint(4);
		}
		
		private readUint(numBytes: int): int {
			if (!(1 <= numBytes && numBytes <= 8))
				throw new RangeError("Number of bytes out of range");
			let result: int = 0;
			for (let i = 0; i < numBytes; i++, this.start++)
				result = result * 0x100 + this.data[this.start];
			return result;
		}
		
		public readInt(numBytes: int): int {
			let val: int = this.readUint(numBytes);
			let max: int = 1;
			for (let i = 0; i < numBytes; i++)
				max *= 0x100;
			return val < max / 2 ? val : val - max;
		}
		
		public readVarint(): int {
			let result: int = 0;
			for (let i = 0; ; i++) {
				if (this.start >= this.end) {
					this.start -= i;
					throw new Error("End of stream");
				}
				const b: int = this.data[this.start];
				this.start++;
				if (i < 8) {
					result = result * 0x80 + (b & 0x7F);
					if (b < 0x80)
						return result;
				} else {
					result = result * 0x100 + b;
					return result;
				}
			}
		}
	}
	
})();



/*---- Shared utilities ----*/

function queryHtml(query: string): HTMLElement {
	return subqueryElem(document, query, HTMLElement);
}

type Constructor<T> = { new(...args: Array<any>): T };

function subqueryElem<T>(root: HTMLElement|Document, query: string, type: Constructor<T>): T {
	let result: Element|null = root.querySelector(query);
	if (result instanceof type)
		return result;
	else if (result === null)
		throw new Error("Element not found");
	else
		throw new TypeError("Invalid element type");
}
