/* 
 * Hamming error-correcting code
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hamming-error-correcting-codes
 */

type bit = number;
type int = number;


namespace app {
	
	namespace simpleParity {
		let root: HTMLElement = queryHtml("article .demo.simple-parity");
		let msgLenInput: HTMLInputElement = subqueryElem(root, "input", HTMLInputElement);
		let codeLenOutput: HTMLElement = subqueryElem(root, "output.codeword-length", HTMLElement);
		let inputTbody   : HTMLElement = subqueryElem(root, ".input-message"  , HTMLElement);
		let codewordTbody: HTMLElement = subqueryElem(root, ".codeword"       , HTMLElement);
		let outputTbody  : HTMLElement = subqueryElem(root, ".output-message" , HTMLElement);
		let changedElem: HTMLElement = subqueryElem(root, "output.bits-changed"  , HTMLElement);
		let errorElem  : HTMLElement = subqueryElem(root, "output.detected-error", HTMLElement);
		let matchesElem: HTMLElement = subqueryElem(root, "output.matches-input" , HTMLElement);
		let inputBits: Array<bit> = [];
		let sentCodewordBits: Array<bit> = [];
		let recvCodewordBits: Array<bit> = [];
		
		root.hidden = false;
		msgLenInput.oninput = paramsChanged;
		paramsChanged();
		
		
		function paramsChanged(): void {
			const msgLen: int = parseInt(msgLenInput.value, 10);
			resizeArray(inputBits, msgLen, 0);
			codeLenOutput.textContent = (msgLen + 1).toString();
			resizeArray(sentCodewordBits, msgLen + 1, 0);
			resizeArray(recvCodewordBits, sentCodewordBits.length, 0);
			visualizeLength(inputBits, inputChanged, null, inputTbody);
			const types: Array<string> = inputBits.map(_ => "data").concat(["parity"]);
			visualizeLength(recvCodewordBits, codewordChanged, types, codewordTbody);
			visualizeLength(inputBits, null, null, outputTbody);
			inputChanged();
		}
		
		
		function inputChanged(): void {
			visualizeValues(inputBits, inputTbody);
			inputBits.forEach((x, i) => sentCodewordBits[i] = x);
			sentCodewordBits[sentCodewordBits.length - 1] = calcParity(inputBits);
			sentCodewordBits.forEach((x, i) => recvCodewordBits[i] = x);
			codewordChanged();
		}
		
		
		function codewordChanged(): void {
			visualizeValues(recvCodewordBits, codewordTbody);
			const outputBits: Array<bit>|null = calcParity(recvCodewordBits) == 0 ?
				recvCodewordBits.slice(0, -1) : null;
			changedElem.textContent = recvCodewordBits.filter((x, i) => sentCodewordBits[i] != x).length.toString();
			visualizeValues(outputBits, outputTbody);
			errorElem.textContent = outputBits === null ? "True" : "False";
			matchesElem.textContent = outputBits !== null && areArraysEqual(outputBits, inputBits) ? "True" : "False";
		}
		
		
		function visualizeLength(bits: Array<bit>, changeFunc: (()=>void)|null, types: Array<string>|null, tbody: HTMLElement): void {
			let indexRow: HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(1)", HTMLElement);
			let bitRow  : HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(2)", HTMLElement);
			let indexCells: Array<HTMLElement> = Array.from(indexRow.querySelectorAll(":scope > td"));
			let bitCells  : Array<HTMLElement> = Array.from(bitRow  .querySelectorAll(":scope > td"));
			while (indexCells.length > bits.length) {
				notUndefined(indexCells.pop()).remove();
				notUndefined(bitCells  .pop()).remove();
			}
			while (indexCells.length < bits.length) {
				const i: int = indexCells.length;
				let td: HTMLElement = addElem(indexRow, "td", i.toString());
				indexCells.push(td);
				td = addElem(bitRow, "td");
				bitCells.push(td);
				td.classList.add("bit");
				if (changeFunc !== null) {
					let button: HTMLElement = addElem(td, "button");
					button.onclick = () => {
						bits[i] ^= 1;
						changeFunc();
					};
				}
			}
			if (types !== null) {
				bitCells.forEach((td, i) => {
					td.className = "";
					td.classList.add("bit", types[i]);
				});
			}
		}
		
		
		function visualizeValues(bits: Array<bit>|null, tbody: HTMLElement) {
			tbody.classList.toggle("error", bits === null);
			tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
				let button = td.querySelector("button");
				(button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
			});
		}
	}
	
	
	
	namespace gridParity {
		let root: HTMLElement = queryHtml("article .demo.grid-parity");
		let msgRowsInput: HTMLInputElement = subqueryElem(root, "#grid-parity-message-rows"   , HTMLInputElement);
		let msgColsInput: HTMLInputElement = subqueryElem(root, "#grid-parity-message-columns", HTMLInputElement);
		let msgLenOutput : HTMLElement = subqueryElem(root, "output.message-length ", HTMLElement);
		let codeLenOutput: HTMLElement = subqueryElem(root, "output.codeword-length", HTMLElement);
		let inputTbody   : HTMLElement = subqueryElem(root, ".input-message"  , HTMLElement);
		let codewordTbody: HTMLElement = subqueryElem(root, ".codeword"       , HTMLElement);
		let outputTbody  : HTMLElement = subqueryElem(root, ".output-message" , HTMLElement);
		let changedElem: HTMLElement = subqueryElem(root, "output.bits-changed"  , HTMLElement);
		let errorElem  : HTMLElement = subqueryElem(root, "output.detected-error", HTMLElement);
		let matchesElem: HTMLElement = subqueryElem(root, "output.matches-input" , HTMLElement);
		let inputBits: Array<Array<bit>> = [];
		let sentCodewordBits: Array<Array<bit>> = [];
		let recvCodewordBits: Array<Array<bit>> = [];
		
		root.hidden = false;
		msgColsInput.oninput = paramsChanged;
		msgRowsInput.oninput = paramsChanged;
		paramsChanged();
		
		
		function paramsChanged(): void {
			const msgRows: int = parseInt(msgRowsInput.value, 10);
			const msgCols: int = parseInt(msgColsInput.value, 10);
			msgLenOutput.textContent = (msgRows * msgCols).toString();
			codeLenOutput.textContent = (msgRows * msgCols + msgRows + msgCols).toString();
			
			while (inputBits.length < msgRows)
				inputBits.push([]);
			inputBits.splice(msgRows, inputBits.length - msgRows);
			for (let row of inputBits)
				resizeArray(row, msgCols, 0);
			
			sentCodewordBits.pop();
			while (sentCodewordBits.length < msgRows)
				sentCodewordBits.push([]);
			sentCodewordBits.splice(msgRows, sentCodewordBits.length - msgRows);
			for (let row of sentCodewordBits)
				resizeArray(row, msgCols + 1, 0);
			let row: Array<bit> = [];
			resizeArray(row, msgCols, 0);
			sentCodewordBits.push(row);
			
			recvCodewordBits.pop();
			while (recvCodewordBits.length < msgRows)
				recvCodewordBits.push([]);
			recvCodewordBits.splice(msgRows, recvCodewordBits.length - msgRows);
			for (let row of recvCodewordBits)
				resizeArray(row, msgCols + 1, 0);
			row = [];
			resizeArray(row, msgCols, 0);
			recvCodewordBits.push(row);
			
			visualizeSize(inputBits, inputChanged, null, inputTbody);
			const types: Array<Array<string>> = recvCodewordBits.map((row, i) =>
				row.map((_, j) => i < recvCodewordBits.length - 1 && j < row.length - 1 ? "data" : "parity"));
			visualizeSize(recvCodewordBits, codewordChanged, types, codewordTbody);
			visualizeSize(inputBits, null, null, outputTbody);
			inputChanged();
		}
		
		
		function inputChanged(): void {
			visualizeValues(inputBits, inputTbody);
			let columnParities: Array<bit> = sentCodewordBits[sentCodewordBits.length - 1];
			columnParities.forEach((_, i) => columnParities[i] = 0);
			inputBits.forEach((row, i) => {
				row.forEach((x, j) => {
					sentCodewordBits[i][j] = x;
					columnParities[j] ^= x;
				});
				sentCodewordBits[i][row.length] = calcParity(row);
			});
			sentCodewordBits.forEach((row, i) =>
				row.forEach((x, j) => recvCodewordBits[i][j] = x));
			codewordChanged();
		}
		
		
		function codewordChanged(): void {
			visualizeValues(recvCodewordBits, codewordTbody);
			let changes: int = 0;
			sentCodewordBits.forEach((row, i) => {
				row.forEach((x, j) => {
					if (recvCodewordBits[i][j] != x)
						changes++;
				});
			});
			changedElem.textContent = changes.toString();
			
			const rowParities: Array<bit> = recvCodewordBits.slice(0, -1).map(row => calcParity(row));
			let columnParities: Array<bit> = [];
			for (let j = 0; j < recvCodewordBits[0].length - 1; j++)
				columnParities.push(calcParity(recvCodewordBits.map(row => row[j])));
			const rowFails: int = rowParities.reduce((x, y) => x + y, 0);
			const columnFails: int = columnParities.reduce((x, y) => x + y, 0);
			
			let outputBits: Array<Array<bit>>|null = recvCodewordBits.slice(0, -1).map(row => row.slice(0, -1));
			if (rowFails == 0 && columnFails == 0) {
			} else if (rowFails == 1) {
				const i: int = rowParities.findIndex(x => x == 1);
				columnParities.forEach((x, j) => {
					if (x == 1)
						notNull(outputBits)[i][j] ^= 1;
				});
			} else if (columnFails == 1) {
				const j: int = columnParities.findIndex(x => x == 1);
				rowParities.forEach((x, i) => {
					if (x == 1)
						notNull(outputBits)[i][j] ^= 1;
				});
			} else
				outputBits = null;
			visualizeValues(outputBits, outputTbody);
			
			errorElem.textContent = outputBits === null || rowFails > 0 || columnFails > 0 ? "True" : "False";
			matchesElem.textContent = outputBits !== null && outputBits.every((row, i) => areArraysEqual(row, inputBits[i])) ? "True" : "False";
		}
		
		
		function visualizeSize(bits: Array<Array<bit>>, changeFunc: (()=>void)|null, types: Array<Array<string>>|null, tbody: HTMLElement): void {
			let columnRow: HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(1)", HTMLElement);
			let columnCells: Array<HTMLElement> = Array.from(columnRow.querySelectorAll(":scope > td"));
			while (columnCells.length > bits[0].length)
				notUndefined(columnCells.pop()).remove();
			while (columnCells.length < bits[0].length) {
				let td: HTMLElement = addElem(columnRow, "td", columnCells.length.toString());
				columnCells.push(td);
			}
			
			let bitRows: Array<HTMLElement> = Array.from(tbody.querySelectorAll(":scope > tr:not(:first-child)"));
			while (bitRows.length > bits.length)
				notUndefined(bitRows.pop()).remove();
			while (bitRows.length < bits.length) {
				let tr: HTMLElement = addElem(tbody, "tr");
				addElem(tr, "td", bitRows.length.toString());
				bitRows.push(tr);
			}
			
			bitRows.forEach((bitRow, i) => {
				let bitCells: Array<HTMLElement> = Array.from(bitRow.querySelectorAll(":scope > td:not(:first-child)"));
				while (bitCells.length > bits[0].length)
					notUndefined(bitCells.pop()).remove();
				while (bitCells.length < bits[0].length) {
					let td: HTMLElement = addElem(bitRow, "td");
					bitCells.push(td);
				}
				bitCells.forEach((td, j) => {
					td.className = "";
					if (j >= bits[i].length)
						return;
					td.classList.add("bit");
					if (types !== null)
						td.classList.add("bit", types[i][j]);
					td.replaceChildren();
					if (changeFunc !== null) {
						let button: HTMLElement = addElem(td, "button");
						button.onclick = () => {
							bits[i][j] ^= 1;
							changeFunc();
						};
					}
				});
			});
		}
		
		
		function visualizeValues(bits: Array<Array<bit>>|null, tbody: HTMLElement) {
			tbody.classList.toggle("error", bits === null);
			tbody.querySelectorAll(":scope > tr:not(:first-child)").forEach((tr, i) => {
				tr.querySelectorAll(":scope > td:not(:first-child)").forEach((td, j) => {
					if (td.classList.contains("bit")) {
						let button = td.querySelector("button");
						(button === null ? td : button).textContent = bits !== null ? bits[i][j].toString() : "\u2012";
					}
				});
			});
		}
	}
	
	
	
	namespace almostHamming {
		let root: HTMLElement = queryHtml("article .demo.almost-hamming");
		let msgLenInput: HTMLInputElement = subqueryElem(root, "input", HTMLInputElement);
		let codeLenOutput: HTMLElement = subqueryElem(root, "output.codeword-length", HTMLElement);
		let inputTbody   : HTMLElement = subqueryElem(root, ".input-message"  , HTMLElement);
		let codewordTbody: HTMLElement = subqueryElem(root, ".codeword"       , HTMLElement);
		let outputTbody  : HTMLElement = subqueryElem(root, ".output-message" , HTMLElement);
		let changedElem: HTMLElement = subqueryElem(root, "output.bits-changed"  , HTMLElement);
		let errorElem  : HTMLElement = subqueryElem(root, "output.detected-error", HTMLElement);
		let matchesElem: HTMLElement = subqueryElem(root, "output.matches-input" , HTMLElement);
		let inputBits: Array<bit> = [];
		let sentCodewordBits: Array<bit> = [];
		let recvCodewordBits: Array<bit> = [];
		
		root.hidden = false;
		msgLenInput.oninput = paramsChanged;
		paramsChanged();
		
		
		function paramsChanged(): void {
			const msgLen: int = parseInt(msgLenInput.value, 10);
			resizeArray(inputBits, msgLen, 0);
			let numParity: int = 0;
			for (; 1 << numParity < msgLen; numParity++) {}
			const codeLen: int = msgLen + numParity;
			codeLenOutput.textContent = codeLen.toString();
			resizeArray(sentCodewordBits, codeLen, 0);
			resizeArray(recvCodewordBits, sentCodewordBits.length, 0);
			visualizeLength(inputBits, inputChanged, null, inputTbody);
			const types: Array<string> = recvCodewordBits.map((_, i) => i < msgLen ? "data" : "parity");
			visualizeLength(recvCodewordBits, codewordChanged, types, codewordTbody);
			visualizeLength(inputBits, null, null, outputTbody);
			inputChanged();
		}
		
		
		function inputChanged(): void {
			visualizeValues(inputBits, inputTbody);
			inputBits.forEach((x, i) => sentCodewordBits[i] = x);
			const numParity: int = sentCodewordBits.length - inputBits.length;
			for (let i = 0; i < numParity; i++)
				sentCodewordBits[inputBits.length + i] = calcParity(inputBits.filter((_, j) => (j & (1 << i)) != 0));
			sentCodewordBits.forEach((x, i) => recvCodewordBits[i] = x);
			codewordChanged();
		}
		
		
		function codewordChanged(): void {
			visualizeValues(recvCodewordBits, codewordTbody);
			changedElem.textContent = recvCodewordBits.filter((x, i) => sentCodewordBits[i] != x).length.toString();
			
			const msg: Array<bit> = recvCodewordBits.slice(0, inputBits.length);
			let syndrome: int = 0;
			const numParity: int = recvCodewordBits.length - inputBits.length;
			for (let i = 0; i < numParity; i++) {
				if (calcParity(msg.filter((_, j) => (j & (1 << i)) != 0)) != recvCodewordBits[msg.length + i])
					syndrome += 1 << i;
			}
			let outputBits: Array<bit>|null;
			if (syndrome < msg.length) {
				if (syndrome > 0)
					msg[syndrome] ^= 1;
				outputBits = msg;
			} else
				outputBits = null;
			
			visualizeValues(outputBits, outputTbody);
			errorElem.textContent = outputBits === null || syndrome != 0 ? "True" : "False";
			matchesElem.textContent = outputBits !== null && areArraysEqual(outputBits, inputBits) ? "True" : "False";
		}
		
		
		function visualizeLength(bits: Array<bit>, changeFunc: (()=>void)|null, types: Array<string>|null, tbody: HTMLElement): void {
			let indexRow: HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(1)", HTMLElement);
			let bitRow  : HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(2)", HTMLElement);
			let indexCells: Array<HTMLElement> = Array.from(indexRow.querySelectorAll(":scope > td"));
			let bitCells  : Array<HTMLElement> = Array.from(bitRow  .querySelectorAll(":scope > td"));
			while (indexCells.length > bits.length) {
				notUndefined(indexCells.pop()).remove();
				notUndefined(bitCells  .pop()).remove();
			}
			while (indexCells.length < bits.length) {
				const i: int = indexCells.length;
				let td: HTMLElement = addElem(indexRow, "td", i.toString());
				indexCells.push(td);
				td = addElem(bitRow, "td");
				bitCells.push(td);
				td.classList.add("bit");
				if (changeFunc !== null) {
					let button: HTMLElement = addElem(td, "button");
					button.onclick = () => {
						bits[i] ^= 1;
						changeFunc();
					};
				}
			}
			if (types !== null) {
				bitCells.forEach((td, i) => {
					td.className = "";
					td.classList.add("bit", types[i]);
				});
			}
		}
		
		
		function visualizeValues(bits: Array<bit>|null, tbody: HTMLElement) {
			tbody.classList.toggle("error", bits === null);
			tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
				let button = td.querySelector("button");
				(button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
			});
		}
	}
	
	
	
	namespace hammingCodes {
		let root: HTMLElement = queryHtml("article .demo.hamming-codes");
		let msgLenOutput: HTMLElement = subqueryElem(root, "output.message-length", HTMLElement);
		let codeLenInput: HTMLInputElement = subqueryElem(root, "input", HTMLInputElement);
		let inputTbody   : HTMLElement = subqueryElem(root, ".input-message"  , HTMLElement);
		let codewordTbody: HTMLElement = subqueryElem(root, ".codeword"       , HTMLElement);
		let outputTbody  : HTMLElement = subqueryElem(root, ".output-message" , HTMLElement);
		let changedElem: HTMLElement = subqueryElem(root, "output.bits-changed"  , HTMLElement);
		let errorElem  : HTMLElement = subqueryElem(root, "output.detected-error", HTMLElement);
		let matchesElem: HTMLElement = subqueryElem(root, "output.matches-input" , HTMLElement);
		let inputBits: Array<bit> = [];
		let sentCodewordBits: Array<bit> = [];
		let recvCodewordBits: Array<bit> = [];
		
		root.hidden = false;
		codeLenInput.oninput = paramsChanged;
		paramsChanged();
		
		
		function paramsChanged(): void {
			const codeLen: int = parseInt(codeLenInput.value, 10);
			let numParity: int = 0;
			for (; 1 << numParity <= codeLen; numParity++) {}
			const msgLen: int = codeLen - numParity;
			msgLenOutput.textContent = msgLen.toString();
			resizeArray(inputBits, msgLen, 0);
			resizeArray(sentCodewordBits, codeLen, 0);
			resizeArray(recvCodewordBits, sentCodewordBits.length, 0);
			visualizeLength(inputBits, inputChanged, null, inputTbody);
			const types: Array<string> = recvCodewordBits.map((_, i) => ((i + 1) & i) != 0 ? "data" : "parity");
			visualizeLength(recvCodewordBits, codewordChanged, types, codewordTbody);
			visualizeLength(inputBits, null, null, outputTbody);
			inputChanged();
		}
		
		
		function inputChanged(): void {
			visualizeValues(inputBits, inputTbody);
			let inputIndex: int = 0;
			sentCodewordBits.forEach((_, i) => {
				if (((i + 1) & i) != 0) {
					sentCodewordBits[i] = inputBits[inputIndex];
					inputIndex++;
				} else
					sentCodewordBits[i] = 0;
			});
			sentCodewordBits.forEach((_, i) => {
				if (((i + 1) & i) == 0)
					sentCodewordBits[i] = calcParity(sentCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0));
			});
			sentCodewordBits.forEach((x, i) => recvCodewordBits[i] = x);
			codewordChanged();
		}
		
		
		function codewordChanged(): void {
			visualizeValues(recvCodewordBits, codewordTbody);
			changedElem.textContent = recvCodewordBits.filter((x, i) => sentCodewordBits[i] != x).length.toString();
			
			let syndrome: int = 0;
			recvCodewordBits.forEach((x, i) => {
				if (((i + 1) & i) == 0 && calcParity(recvCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0)) != 0)
					syndrome += i + 1;
			});
			let outputBits: Array<bit>|null;
			if (syndrome <= recvCodewordBits.length) {
				let corrected: Array<bit> = recvCodewordBits.slice();
				if (syndrome > 0)
					corrected[syndrome - 1] ^= 1;
				outputBits = corrected.filter((_, i) => ((i + 1) & i) != 0);
			} else
				outputBits = null;
			
			visualizeValues(outputBits, outputTbody);
			errorElem.textContent = outputBits === null || syndrome != 0 ? "True" : "False";
			matchesElem.textContent = outputBits !== null && areArraysEqual(outputBits, inputBits) ? "True" : "False";
		}
		
		
		function visualizeLength(bits: Array<bit>, changeFunc: (()=>void)|null, types: Array<string>|null, tbody: HTMLElement): void {
			let indexRow: HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(1)", HTMLElement);
			let bitRow  : HTMLElement = subqueryElem(tbody, ":scope > tr:nth-child(2)", HTMLElement);
			let indexCells: Array<HTMLElement> = Array.from(indexRow.querySelectorAll(":scope > td"));
			let bitCells  : Array<HTMLElement> = Array.from(bitRow  .querySelectorAll(":scope > td"));
			while (indexCells.length > bits.length) {
				notUndefined(indexCells.pop()).remove();
				notUndefined(bitCells  .pop()).remove();
			}
			while (indexCells.length < bits.length) {
				const i: int = indexCells.length;
				let td: HTMLElement = addElem(indexRow, "td", (i + 1).toString());
				indexCells.push(td);
				td = addElem(bitRow, "td");
				bitCells.push(td);
				td.classList.add("bit");
				if (changeFunc !== null) {
					let button: HTMLElement = addElem(td, "button");
					button.onclick = () => {
						bits[i] ^= 1;
						changeFunc();
					};
				}
			}
			if (types !== null) {
				bitCells.forEach((td, i) => {
					td.className = "";
					td.classList.add("bit", types[i]);
				});
			}
		}
		
		
		function visualizeValues(bits: Array<bit>|null, tbody: HTMLElement) {
			tbody.classList.toggle("error", bits === null);
			tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
				let button = td.querySelector("button");
				(button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
			});
		}
	}
	
	
	
	function calcParity(bits: Array<bit>): bit {
		return bits.reduce((x, y) => (x + y) % 2, 0);
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
	
	
	function addElem(container: Element|DocumentFragment, tagName: string, text?: string): HTMLElement {
		let result: HTMLElement = document.createElement(tagName);
		if (text !== undefined)
			result.textContent = text;
		container.append(result);
		return result;
	}
	
	
	function areArraysEqual<E>(a: Array<E>, b: Array<E>): boolean {
		return a.length == b.length && a.every((x, i) => x == b[i]);
	}
	
	
	function resizeArray<E>(arr: Array<E>, newLen: int, fillVal: E): void {
		while (arr.length < newLen)
			arr.push(fillVal);
		arr.splice(newLen, arr.length - newLen);
	}
	
	
	function notNull<T>(val: T|null): T {
		if (val === null)
			throw new TypeError();
		return val;
	}
	
	
	function notUndefined<T>(val: T|undefined): T {
		if (val === undefined)
			throw new TypeError();
		return val;
	}
	
}
