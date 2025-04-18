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
	
	abstract class OneDimensionalCodeDemo {
		
		protected rootElem: HTMLElement;
		
		protected inputBits: Array<bit> = [];
		private inputTbody: HTMLElement;
		
		protected sentCodewordBits: Array<bit> = [];
		protected recvCodewordBits: Array<bit> = [];
		private codewordTbody: HTMLElement;
		private changedElem: HTMLElement;
		
		protected outputBits: Array<bit>|null = null;
		protected outputError: boolean = false;
		private outputTbody: HTMLElement;
		private errorElem: HTMLElement;
		private matchesElem: HTMLElement;
		
		
		public constructor(rootHtmlClass: string) {
			this.rootElem = queryHtml("article .demo." + rootHtmlClass);
			this.inputTbody    = subqueryElem(this.rootElem, ".input-message"       , HTMLElement);
			this.codewordTbody = subqueryElem(this.rootElem, ".codeword"            , HTMLElement);
			this.changedElem   = subqueryElem(this.rootElem, "output.bits-changed"  , HTMLElement);
			this.outputTbody   = subqueryElem(this.rootElem, ".output-message"      , HTMLElement);
			this.errorElem     = subqueryElem(this.rootElem, "output.detected-error", HTMLElement);
			this.matchesElem   = subqueryElem(this.rootElem, "output.matches-input" , HTMLElement);
			this.rootElem.hidden = false;
		}
		
		
		protected paramsChanged(msgLen: int, codeBitTypes: Array<string>): void {
			resizeArray(this.inputBits, msgLen, 0);
			OneDimensionalCodeDemo.visualizeLength(this.inputBits, () => this.inputChanged(), null, this.inputTbody);
			resizeArray(this.sentCodewordBits, codeBitTypes.length, 0);
			resizeArray(this.recvCodewordBits, this.sentCodewordBits.length, 0);
			OneDimensionalCodeDemo.visualizeLength(this.recvCodewordBits, () => this.codewordChanged(), codeBitTypes, this.codewordTbody);
			OneDimensionalCodeDemo.visualizeLength(this.inputBits, null, null, this.outputTbody);
			this.inputChanged();
		}
		
		
		protected inputChanged(): void {
			OneDimensionalCodeDemo.visualizeValues(this.inputBits, this.inputTbody);
			this.sentCodewordBits.forEach((x, i) => this.recvCodewordBits[i] = x);
			this.codewordChanged();
		}
		
		
		protected codewordChanged(): void {
			OneDimensionalCodeDemo.visualizeValues(this.recvCodewordBits, this.codewordTbody);
			this.changedElem.textContent = this.recvCodewordBits.filter((x, i) => this.sentCodewordBits[i] != x).length.toString();
			OneDimensionalCodeDemo.visualizeValues(this.outputBits, this.outputTbody);
			this.errorElem.textContent = this.outputError ? "True" : "False";
			this.matchesElem.textContent = this.outputBits !== null && areArraysEqual(this.outputBits, this.inputBits) ? "True" : "False";
		}
		
		
		private static visualizeLength(bits: Array<bit>, changeFunc: (()=>void)|null, types: Array<string>|null, tbody: HTMLElement): void {
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
		
		
		private static visualizeValues(bits: Array<bit>|null, tbody: HTMLElement) {
			tbody.classList.toggle("error", bits === null);
			tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
				let button = td.querySelector("button");
				(button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
			});
		}
		
	}
	
	
	
	class SimpleParityDemo extends OneDimensionalCodeDemo {
		
		private msgLenInput: HTMLInputElement;
		private codeLenOutput: HTMLElement;
		
		
		private constructor() {
			super("simple-parity");
			this.msgLenInput = subqueryElem(this.rootElem, "input", HTMLInputElement);
			this.codeLenOutput = subqueryElem(this.rootElem, "output.codeword-length", HTMLElement);
			const func: ()=>void = () => {
				const msgLen: int = parseInt(this.msgLenInput.value, 10);
				let types: Array<string> = [];
				for (let i = 0; i < msgLen; i++)
					types.push("data");
				types.push("parity");
				this.paramsChanged(msgLen, types);
			};
			this.msgLenInput.oninput = func;
			func();
		}
		
		
		protected paramsChanged(msgLen: int, codeBitTypes: Array<string>): void {
			this.codeLenOutput.textContent = codeBitTypes.length.toString();
			super.paramsChanged(msgLen, codeBitTypes);
		}
		
		
		protected inputChanged(): void {
			this.inputBits.forEach((x, i) => this.sentCodewordBits[i] = x);
			this.sentCodewordBits[this.sentCodewordBits.length - 1] = calcParity(this.inputBits);
			super.inputChanged();
		}
		
		
		protected codewordChanged(): void {
			this.outputBits = calcParity(this.recvCodewordBits) == 0 ?
				this.recvCodewordBits.slice(0, -1) : null;
			this.outputError = this.outputBits === null;
			super.codewordChanged();
		}
		
		
		private static SINGLETON: SimpleParityDemo = new SimpleParityDemo();
		
	}
	
	
	
	namespace gridParity {
		let rootElem: HTMLElement = queryHtml("article .demo.grid-parity");
		let msgRowsInput: HTMLInputElement = subqueryElem(rootElem, "#grid-parity-message-rows"   , HTMLInputElement);
		let msgColsInput: HTMLInputElement = subqueryElem(rootElem, "#grid-parity-message-columns", HTMLInputElement);
		let msgLenOutput : HTMLElement = subqueryElem(rootElem, "output.message-length ", HTMLElement);
		let codeLenOutput: HTMLElement = subqueryElem(rootElem, "output.codeword-length", HTMLElement);
		let inputTbody   : HTMLElement = subqueryElem(rootElem, ".input-message"  , HTMLElement);
		let codewordTbody: HTMLElement = subqueryElem(rootElem, ".codeword"       , HTMLElement);
		let outputTbody  : HTMLElement = subqueryElem(rootElem, ".output-message" , HTMLElement);
		let changedElem: HTMLElement = subqueryElem(rootElem, "output.bits-changed"  , HTMLElement);
		let errorElem  : HTMLElement = subqueryElem(rootElem, "output.detected-error", HTMLElement);
		let matchesElem: HTMLElement = subqueryElem(rootElem, "output.matches-input" , HTMLElement);
		let inputBits: Array<Array<bit>> = [];
		let sentCodewordBits: Array<Array<bit>> = [];
		let recvCodewordBits: Array<Array<bit>> = [];
		
		rootElem.hidden = false;
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
	
	
	
	class AlmostHammingDemo extends OneDimensionalCodeDemo {
		
		private msgLenInput: HTMLInputElement;
		private codeLenOutput: HTMLElement;
		
		
		private constructor() {
			super("almost-hamming");
			this.msgLenInput = subqueryElem(this.rootElem, "input", HTMLInputElement);
			this.codeLenOutput = subqueryElem(this.rootElem, "output.codeword-length", HTMLElement);
			const func: ()=>void = () => {
				const msgLen: int = parseInt(this.msgLenInput.value, 10);
				let numParity: int = 0;
				for (; 1 << numParity < msgLen; numParity++) {}
				let types: Array<string> = [];
				for (let i = 0; i < msgLen; i++)
					types.push("data");
				for (let i = 0; i < numParity; i++)
					types.push("parity");
				this.paramsChanged(msgLen, types);
			};
			this.msgLenInput.oninput = func;
			func();
		}
		
		
		protected paramsChanged(msgLen: int, codeBitTypes: Array<string>): void {
			this.codeLenOutput.textContent = codeBitTypes.length.toString();
			super.paramsChanged(msgLen, codeBitTypes);
		}
		
		
		protected inputChanged(): void {
			this.inputBits.forEach((x, i) => this.sentCodewordBits[i] = x);
			const numParity: int = this.sentCodewordBits.length - this.inputBits.length;
			for (let i = 0; i < numParity; i++)
				this.sentCodewordBits[this.inputBits.length + i] = calcParity(this.inputBits.filter((_, j) => (j & (1 << i)) != 0));
			super.inputChanged();
		}
		
		
		protected codewordChanged(): void {
			const msg: Array<bit> = this.recvCodewordBits.slice(0, this.inputBits.length);
			let syndrome: int = 0;
			const numParity: int = this.recvCodewordBits.length - this.inputBits.length;
			for (let i = 0; i < numParity; i++) {
				if (calcParity(msg.filter((_, j) => (j & (1 << i)) != 0)) != this.recvCodewordBits[msg.length + i])
					syndrome += 1 << i;
			}
			if (syndrome < msg.length) {
				if (syndrome > 0)
					msg[syndrome] ^= 1;
				this.outputBits = msg;
			} else
				this.outputBits = null;
			this.outputError = this.outputBits === null || syndrome != 0;
			super.codewordChanged();
		}
		
		
		private static SINGLETON: AlmostHammingDemo = new AlmostHammingDemo();
		
	}
	
	
	
	class HammingCodesDemo extends OneDimensionalCodeDemo {
		
		private msgLenOutput: HTMLElement;
		private codeLenInput: HTMLInputElement;
		
		
		private constructor() {
			super("hamming-codes");
			this.codeLenInput = subqueryElem(this.rootElem, "input", HTMLInputElement);
			this.msgLenOutput = subqueryElem(this.rootElem, "output.message-length", HTMLElement);
			const func: ()=>void = () => {
				const codeLen: int = parseInt(this.codeLenInput.value, 10);
				let numParity: int = 0;
				for (; 1 << numParity <= codeLen; numParity++) {}
				let types: Array<string> = [];
				for (let i = 0; i < codeLen; i++)
					types.push(((i + 1) & i) != 0 ? "data" : "parity");
				this.paramsChanged(codeLen - numParity, types);
			};
			this.codeLenInput.oninput = func;
			func();
		}
		
		
		protected paramsChanged(msgLen: int, codeBitTypes: Array<string>): void {
			this.msgLenOutput.textContent = msgLen.toString();
			super.paramsChanged(msgLen, codeBitTypes);
		}
		
		
		protected inputChanged(): void {
			let inputIndex: int = 0;
			this.sentCodewordBits.forEach((_, i) => {
				if (((i + 1) & i) != 0) {
					this.sentCodewordBits[i] = this.inputBits[inputIndex];
					inputIndex++;
				} else
					this.sentCodewordBits[i] = 0;
			});
			this.sentCodewordBits.forEach((_, i) => {
				if (((i + 1) & i) == 0)
					this.sentCodewordBits[i] = calcParity(this.sentCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0));
			});
			super.inputChanged();
		}
		
		
		protected codewordChanged(): void {
			let syndrome: int = 0;
			this.recvCodewordBits.forEach((x, i) => {
				if (((i + 1) & i) == 0 && calcParity(this.recvCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0)) != 0)
					syndrome += i + 1;
			});
			if (syndrome <= this.recvCodewordBits.length) {
				let corrected: Array<bit> = this.recvCodewordBits.slice();
				if (syndrome > 0)
					corrected[syndrome - 1] ^= 1;
				this.outputBits = corrected.filter((_, i) => ((i + 1) & i) != 0);
			} else
				this.outputBits = null;
			this.outputError = this.outputBits === null || syndrome != 0;
			super.codewordChanged();
		}
		
		
		private static SINGLETON: HammingCodesDemo = new HammingCodesDemo();
		
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
