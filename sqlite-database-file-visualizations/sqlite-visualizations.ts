/* 
 * SQLite database file visualizations
 * 
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/sqlite-database-file-visualizations
 */


type byte = number;
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
		
		function readUint(numBytes: int): int {
			if (numBytes > fileBytes.length - readIndex)
				throw new Error("Trying to read beyond end of file");
			let result: int = 0;
			for (let i = 0; i < numBytes; i++, readIndex++)
				result = (result << 8) | fileBytes[readIndex];
			return result >>> 0;
		}
		
		let cells = container.querySelectorAll("tbody td:nth-child(2)");
		let row: int = 0;
		
		let formatBytes: Array<byte> = [];
		for (let i = 0; i < 16; i++)
			formatBytes.push(readUint(1));
		cells[row++].textContent = bytesToReadableString(formatBytes);
		
		let pageSize: int = readUint(2);
		if (pageSize == 1)
			pageSize = 65536;
		cells[row++].textContent = `${pageSize} bytes`;
		
		const READ_WRITE_VERSIONS = new Map<int,string>([
			[1, "Legacy"],
			[2, "WAL"],
		]);
		
		const writeVersion: int = readUint(1);
		cells[row++].textContent = `${READ_WRITE_VERSIONS.has(writeVersion) ? READ_WRITE_VERSIONS.get(writeVersion) : "Unknown"} (${writeVersion})`;
		
		const readVersion: int = readUint(1);
		cells[row++].textContent = `${READ_WRITE_VERSIONS.has(writeVersion) ? READ_WRITE_VERSIONS.get(readVersion) : "Unknown"} (${readVersion})`;
		
		const pageEndReservedSpace: int = readUint(1);
		cells[row++].textContent = `${pageEndReservedSpace} bytes`;
		
		const maxEmbeddedPayloadFraction: int = readUint(1);
		cells[row++].textContent = `${maxEmbeddedPayloadFraction}`;
		
		const minEmbeddedPayloadFraction: int = readUint(1);
		cells[row++].textContent = `${minEmbeddedPayloadFraction}`;
		
		const leafPayloadFraction: int = readUint(1);
		cells[row++].textContent = `${leafPayloadFraction}`;
		
		const fileChangeCounter: int = readUint(4);
		cells[row++].textContent = `${fileChangeCounter}`;
		
		const numPages: int = readUint(4);
		cells[row++].textContent = `${numPages} pages`;
		
		const firstFreelistTrunkPage: int = readUint(4);
		cells[row++].textContent = `${firstFreelistTrunkPage}`;
		
		const numFreelistPages: int = readUint(4);
		cells[row++].textContent = `${numFreelistPages}`;
		
		const schemaCookie: int = readUint(4);
		cells[row++].textContent = `${schemaCookie}`;
		
		const schemaFormat: int = readUint(4);
		cells[row++].textContent = `${schemaFormat}`;
		
		const defaultPageCacheSize: int = readUint(4);
		cells[row++].textContent = `${defaultPageCacheSize}`;
		
		const largestRootBtreePage: int = readUint(4);
		cells[row++].textContent = `${largestRootBtreePage}`;
		
		const TEXT_ENCODINGS = new Map<int,string>([
			[1, "UTF-8"],
			[2, "UTF-16LE"],
			[3, "UTF-16BE"],
		]);
		const textEncoding: int = readUint(4);
		cells[row++].textContent = `${TEXT_ENCODINGS.has(textEncoding) ? TEXT_ENCODINGS.get(textEncoding) : "Unknown"} (${textEncoding})`;
		
		const userVersion: int = readUint(4);
		cells[row++].textContent = `${userVersion}`;
		
		const incrementalVacuum: int = readUint(4);
		cells[row++].textContent = `${incrementalVacuum}`;
		
		const applicationId: int = readUint(4);
		cells[row++].textContent = `${applicationId}`;
		
		let reserved: Array<byte> = [];
		for (let i = 0; i < 20; i++)
			reserved.push(readUint(1));
		cells[row++].textContent = reserved.map(b => b.toString(16).padStart(2, "0")).join(" ");
		
		const versionValidForNumber: int = readUint(4);
		cells[row++].textContent = `${versionValidForNumber}`;
		
		const sqliteVersionNumber: int = readUint(4);
		cells[row++].textContent = `${Math.floor(sqliteVersionNumber/1_000_000)}.${Math.floor(sqliteVersionNumber/1_000)%1_000}.${sqliteVersionNumber%1_000} (${sqliteVersionNumber})`;
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
