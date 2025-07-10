/* 
 * Hash calculator
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hash-calculator-javascript
 */


namespace app {
	
	let container: HTMLElement = queryHtml("article .program-container");
	let textRadio: HTMLInputElement = queryInput("article .program-container #text-radio");
	let textTextarea: HTMLTextAreaElement = queryElem("article .program-container textarea", HTMLTextAreaElement);
	let textConversionSelect: HTMLSelectElement = queryElem("article .program-container select", HTMLSelectElement);
	let fileRadio: HTMLInputElement = queryInput("article .program-container #file-radio");
	let fileInput: HTMLInputElement = queryInput("article .program-container input[type=file]");
	let miscellaneousLengthInput: HTMLInputElement = queryInput("article .program-container #miscellaneous-length");
	let miscellaneousSpeedInput: HTMLInputElement = queryInput("article .program-container #miscellaneous-speed");
	let miscellaneousElapsedTimeInput: HTMLInputElement = queryInput("article .program-container #miscellaneous-elapsed-time");
	let calculateButton: HTMLButtonElement = queryElem("article .program-container button", HTMLButtonElement);
	let outputEmptyElem: HTMLElement = queryHtml("article .program-container p.output-empty");
	let outputTable: HTMLElement = queryHtml("article .program-container table.output");
	let outputTheadTr: HTMLElement = queryHtml("article .program-container table.output thead tr");
	let outputTbody: HTMLElement = queryHtml("article .program-container table.output tbody");
	
	
	function initialize(): void {
		textTextarea.oninput = () => textRadio.checked = true;
		textConversionSelect.onchange = () => textRadio.checked = true;
		fileInput.onchange = () => fileRadio.checked = true;
		calculateButton.onclick = doCalculate;
		container.hidden = false;
	}
	
	setTimeout(initialize);
	
	
	let results: Array<Result> = [];
	
	async function doCalculate(): Promise<void> {
		calculateButton.disabled = true;
		let funcSet: Set<hashlib.HashFunction> = new Set();
		for (const [func, inputName] of HASH_FUNCTIONS) {
			if (queryInput("article .program-container input#function-" + inputName).checked)
				funcSet.add(func);
		}
		
		if (textRadio.checked) {
			let text: string = textTextarea.value;
			let bytes: Uint8Array;
			switch (textConversionSelect.value) {
				case "Base64": {
					let temp: string;
					try {
						temp = window.atob(text);
					} catch (e) {
						alert("Invalid format");
						return;
					}
					bytes = new Uint8Array(temp.length);
					for (let i = 0; i < bytes.length; i++)
						bytes[i] = temp.charCodeAt(i);
					break;
				}
				case "Hexadecimal": {
					if (!/^\s*([0-9a-fA-F]{2}\s*)*$/.test(text)) {
						alert("Invalid format");
						return;
					}
					text = text.replace(/\s/g, "");
					bytes = new Uint8Array(text.length / 2);
					for (let i = 0; i < bytes.length; i++)
						bytes[i] = parseInt(text.substring(i * 2, (i + 1) * 2), 16);
					break;
				}
				case "UTF-8": {
					bytes = new TextEncoder().encode(text);
					break;
				}
				default:
					throw new RangeError("Unreachable");
			}
			results.push(await doHash(funcSet, "(Text string)", new Blob([bytes]).stream()));
		}
		if (fileRadio.checked) {
			const files: FileList|null = fileInput.files;
			if (files === null)
				throw new TypeError();
			for (const file of files)
				results.push(await doHash(funcSet, file.name, file.stream()));
		}
		
		let funcList: Array<hashlib.HashFunction> = [];
		for (const [func, _] of HASH_FUNCTIONS) {
			for (const result of results) {
				if (result.hashes.has(func)) {
					funcList.push(func);
					break;
				}
			}
		}
		
		let headings: Array<string> = ["File name"];
		if (miscellaneousLengthInput.checked)
			headings.push("Length");
		for (const func of funcList)
			headings.push(func.getName());
		outputTheadTr.replaceChildren();
		if (miscellaneousSpeedInput.checked)
			headings.push("Speed");
		if (miscellaneousElapsedTimeInput.checked)
			headings.push("Elapsed");
		for (const s of headings) {
			let th: HTMLElement = outputTheadTr.appendChild(document.createElement("th"));
			th.textContent = s;
		}
		
		outputTbody.replaceChildren();
		for (const result of results) {
			let tr: HTMLElement = outputTbody.appendChild(document.createElement("tr"));
			let cells: Array<[string,Array<string>]> = [];
			cells.push([result.fileName, []]);
			if (miscellaneousLengthInput.checked)
				cells.push([result.lengthBytes.toString(), ["number"]]);
			for (const func of funcList) {
				const hash: ArrayBuffer|undefined = result.hashes.get(func);
				cells.push([hash !== undefined ? Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("") : "", ["hash"]]);
			}
			if (miscellaneousSpeedInput.checked)
				cells.push([(result.elapsedTimeMs > 0 ? (result.lengthBytes / result.elapsedTimeMs / 1e3).toFixed(1) : "?") + "\u00A0MB/s", ["number"]]);
			if (miscellaneousElapsedTimeInput.checked)
				cells.push([(result.elapsedTimeMs / 1e3).toFixed(3) + "\u00A0s", ["number"]]);
			for (const [text, classes] of cells) {
				let td: HTMLElement = tr.appendChild(document.createElement("td"));
				for (const cls of classes)
					td.classList.add(cls);
				td.textContent = text;
			}
		}
		
		outputEmptyElem.hidden = true;
		outputTable.hidden = false;
		calculateButton.disabled = false;
	}
	
	
	async function doHash(funcs: Set<hashlib.HashFunction>, fileName: string, stream: ReadableStream): Promise<Result> {
		let reader: ReadableStreamDefaultReader = stream.getReader();
		const startTime: number = performance.now();
		let length: number = 0;
		let hashers: Map<hashlib.HashFunction,hashlib.Hasher> = new Map();
		for (const func of funcs)
			hashers.set(func, func.newHasher());
		
		while (true) {
			const item = await reader.read();
			if (item.done)
				break;
			const chunk = item.value;
			length += chunk.length;
			for (let hasher of hashers.values())
				hasher.update(chunk);
		}
		
		let hashes: Map<hashlib.HashFunction,ArrayBuffer> = new Map();
		for (let [func, hasher] of hashers.entries())
			hashes.set(func, hasher.getHashDestructively());
		return new Result(fileName, length, performance.now() - startTime, hashes);
	}
	
	
	
	class Result {
		public constructor(
			public fileName: string,
			public lengthBytes: number,
			public elapsedTimeMs: number,
			public hashes: Map<hashlib.HashFunction,ArrayBuffer>) {}
	}
	
	
	
	const HASH_FUNCTIONS: Array<[hashlib.HashFunction,string]> = [
		[hashlib.Crc32, "crc-32"],
		[hashlib.Sha1, "sha-1"],
		[hashlib.Sha256, "sha-256"],
	];
	
}
