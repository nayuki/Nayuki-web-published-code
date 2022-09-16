/* 
 * Brainfuck interpreter
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/brainfuck-interpreter-javascript
 */


namespace app {
	
	/*---- Mostly HTML input/output elements ----*/
	
	type int = number;
	
	let inputsElem    = queryHtml("#inputs");
	let inputCodeElem = queryElem("#input-code", HTMLTextAreaElement);
	let inputTextElem = queryElem("#input-text", HTMLTextAreaElement);
	let outputsElem   = queryHtml("#outputs");
	let outputTextPre = queryHtml("#output-text pre");
	let stepButton    = queryElem("#execute-step" , HTMLButtonElement);
	let runButton     = queryElem("#execute-run"  , HTMLButtonElement);
	let pauseButton   = queryElem("#execute-pause", HTMLButtonElement);
	
	let instance: Brainfuck|null = null;
	
	
	
	/*---- Entry points ----*/
	
	export function doDemo(code: string): void {
		doEditCodeInput();
		inputCodeElem.value = code;
		queryHtml("h2#program").scrollIntoView({behavior:"smooth"});
	}
	
	
	export function doExecute(): void {
		doEditCodeInput();
		try {
			instance = new Brainfuck(inputCodeElem.value, inputTextElem.value);
		} catch (e) {
			alert("Error: " + e.message);
			return;
		}
		inputsElem.style.display = "none";
		outputsElem.style.removeProperty("display");
		stepButton.focus();
	}
	
	
	export function doEditCodeInput(): void {
		if (instance !== null) {
			instance.pause();
			instance = null;
		}
		outputsElem.style.display = "none";
		inputsElem.style.removeProperty("display");
	}
	
	
	
	/*---- Visual brainfuck machine ----*/
	
	class Brainfuck {
		
		private readonly instructions: Array<Instruction> = [];
		private instructionsText: string = "";
		private instructionIndex: int = 0;
		private numExecuted: int = 0;
		
		private memory: Array<int> = [];
		private memoryIndex: int = 0;
		private memoryViewIndex: int = 0;
		
		private readonly inputText: string;
		private inputIndex: int = 0;
		
		private runTimeout: int = -1;
		private runIterations: int = 1;
		
		private static MEMORY_VIEW_WINDOW: int = 30;
		private static TARGET_RUN_TIME: number = 50;  // Milliseconds
		
		
		public constructor(code: string, text: string) {
			// Parse/compile the code
			let openBracketIndexes: Array<int> = [];
			for (let i = 0; i < code.length; i++) {
				let inst: Instruction;
				switch (code.charAt(i)) {
					case "<":  inst = LEFT  ;  break;
					case ">":  inst = RIGHT ;  break;
					case "-":  inst = MINUS ;  break;
					case "+":  inst = PLUS  ;  break;
					case ",":  inst = INPUT ;  break;
					case ".":  inst = OUTPUT;  break;
					case "[":
						inst = new BeginLoop(-1);  // Dummy
						openBracketIndexes.push(this.instructions.length);
						break;
					case "]":
						const j: int|undefined = openBracketIndexes.pop();
						if (j === undefined)
							throw new RangeError("Mismatched brackets (extra right bracket)");
						inst = new EndLoop(j + 1);
						this.instructions[j] = new BeginLoop(this.instructions.length + 1);
						break;
					default:
						continue;
				}
				this.instructions.push(inst);
				this.instructionsText += code.charAt(i);
			}
			if (openBracketIndexes.length > 0)
				throw new RangeError("Mismatched brackets (extra left bracket)");
			
			// Set buttons
			stepButton.disabled = false;
			runButton.disabled = false;
			pauseButton.disabled = true;
			stepButton.onclick = () => {
				this.step();
				this.showState();
			};
			runButton.onclick = () => {
				stepButton.disabled = true;
				runButton.disabled = true;
				pauseButton.disabled = false;
				this.run();
			};
			pauseButton.onclick = () => {
				this.pause();
			};
			queryHtml("#output-memory p button:nth-child(1)").onclick = () => {
				this.memoryViewIndex = Math.max(this.memoryViewIndex - Brainfuck.MEMORY_VIEW_WINDOW, 0);
				this.showMemoryView();
			};
			queryHtml("#output-memory p button:nth-child(2)").onclick = () => {
				this.memoryViewIndex += Brainfuck.MEMORY_VIEW_WINDOW;
				this.showMemoryView();
			};
			
			// Set UI elements
			this.inputText = text;
			outputTextPre.textContent = "";
			this.showState();
		}
		
		
		public pause(): void {
			pauseButton.disabled = true;
			if (this.runTimeout != -1) {
				window.clearTimeout(this.runTimeout);
				this.runTimeout = -1;
				stepButton.disabled = false;
				runButton.disabled = false;
			}
		}
		
		
		private isHalted(): boolean {
			return this.instructionIndex >= this.instructions.length;
		}
		
		
		private step(): void {
			if (this.isHalted())
				return;
			const inst: Instruction = this.instructions[this.instructionIndex];
			this.instructionIndex++;
			try {
				inst.execute(this);
				this.numExecuted++;
			} catch (e) {
				alert("Error: " + e.message);
				this.instructionIndex = this.instructions.length;
			}
		}
		
		
		private run(): void {
			if (this.runTimeout != -1)
				throw new Error("Assertion error");
			const startTime: number = Date.now();
			for (let i = 0; i < this.runIterations; i++)
				this.step();
			const elapsedTime: number = Date.now() - startTime;
			if (elapsedTime <= 0)
				this.runIterations *= 2;
			else
				this.runIterations *= Brainfuck.TARGET_RUN_TIME / elapsedTime;
			this.showState();
			if (!this.isHalted()) {
				this.runTimeout = window.setTimeout(() => {
						this.runTimeout = -1;
						this.run();
					});
			}
		}
		
		
		public setInstructionIndex(newIndex: int): void {
			if (!(0 <= newIndex && newIndex <= this.instructions.length))
				throw new RangeError("Invalid instruction index");
			this.instructionIndex = newIndex;
		}
		
		
		public addMemoryIndex(delta: int): void {
			const newIndex = this.memoryIndex + delta
			if (newIndex < 0)
				throw new RangeError("Negative memory index");
			this.memoryIndex = newIndex;
		}
		
		
		public addMemoryValue(delta: int): void {
			while (this.memoryIndex >= this.memory.length)
				this.memory.push(0);
			this.memory[this.memoryIndex] = (this.memory[this.memoryIndex] + delta) & 0xFF;
		}
		
		
		public isMemoryZero(): boolean {
			return this.memoryIndex >= this.memory.length || this.memory[this.memoryIndex] == 0;
		}
		
		
		public readInput(): void {
			while (this.memoryIndex >= this.memory.length)
				this.memory.push(0);
			let val: int = 0;
			if (this.inputIndex < this.inputText.length) {
				val = this.inputText.charCodeAt(this.inputIndex);
				if (val > 0xFF)
					throw new Error("Input has character code greater than 255");
				this.inputIndex++;
			}
			this.memory[this.memoryIndex] = val;
		}
		
		
		public writeOutput(): void {
			const val: int = this.memoryIndex < this.memory.length ? this.memory[this.memoryIndex] : 0;
			outputTextPre.textContent += String.fromCharCode(val);
		}
		
		
		public showState(): void {
			queryHtml("#output-instructions p").textContent =
				`Length = ${addSeparators(this.instructions.length)}; ` +
				`Index = ${addSeparators(this.instructionIndex)}; ` +
				`Executed = ${addSeparators(this.numExecuted)}` +
				(this.isHalted() ? "; Finished" : "");
			{
				const left: string = this.instructionsText.substring(0, this.instructionIndex);
				let outputInstructionsPre = queryHtml("#output-instructions pre");
				outputInstructionsPre.replaceChildren();
				outputInstructionsPre.textContent = left;
				if (this.instructionIndex < this.instructions.length) {
					const mid: string = this.instructionsText.charAt(this.instructionIndex);
					const right: string = this.instructionsText.substring(this.instructionIndex + 1);
					appendElem(outputInstructionsPre, "strong", mid);
					outputInstructionsPre.append(right);
				}
			}
			
			queryHtml("#output-memory p span").textContent =
				`Index = ${addSeparators(this.memoryIndex)}`;
			{
				const MEMORY_VIEW_STEP: int = Math.floor(Brainfuck.MEMORY_VIEW_WINDOW / 2);
				while (this.memoryIndex < this.memoryViewIndex && this.memoryViewIndex >= MEMORY_VIEW_STEP)
					this.memoryViewIndex -= MEMORY_VIEW_STEP;
				while (this.memoryIndex >= this.memoryViewIndex + Brainfuck.MEMORY_VIEW_WINDOW)
					this.memoryViewIndex += MEMORY_VIEW_STEP;
				this.showMemoryView();
			}
			
			queryHtml("#output-input p").textContent =
				`Length = ${addSeparators(this.inputText.length)}; ` +
				`Index = ${addSeparators(this.inputIndex)}`;
			{
				const left: string = this.inputText.substring(0, this.inputIndex);
				let outputInputPre = queryHtml("#output-input pre");
				outputInputPre.replaceChildren();
				outputInputPre.textContent = left;
				if (this.inputIndex < this.inputText.length) {
					const mid: string = this.inputText.charAt(this.inputIndex);
					const right: string = this.inputText.substring(this.inputIndex + 1);
					appendElem(outputInputPre, "strong", mid);
					outputInputPre.append(right);
				}
			}
			
			{
				const outputText: string|null = outputTextPre.textContent;
				if (outputText === null)
					throw new Error("Assertion error");
				queryHtml("#output-text p").textContent = `Length = ${addSeparators(outputText.length)}`;
			}
			
			if (this.isHalted()) {
				stepButton .disabled = true;
				runButton  .disabled = true;
				pauseButton.disabled = true;
			}
		}
		
		
		private showMemoryView(): void {
			let outputMemoryTbody = queryHtml("#output-memory tbody");
			outputMemoryTbody.replaceChildren();
			for (let i = 0; i < Brainfuck.MEMORY_VIEW_WINDOW; i++) {
				const index: int = this.memoryViewIndex + i;
				let tr = appendElem(outputMemoryTbody, "tr");
				if (index == this.memoryIndex)
					tr.classList.add("active");
				appendElem(tr, "td", index.toString());
				const val: int = index < this.memory.length ? this.memory[index] : 0;
				appendElem(tr, "td", val.toString());
			}
		}
		
	}
	
	
	
	/*---- Brainfuck instruction/operation types ----*/
	
	abstract class Instruction {
		public abstract execute(bf: Brainfuck): void;
	}
	
	
	const LEFT = new class extends Instruction {
		public execute(bf: Brainfuck): void {
			bf.addMemoryIndex(-1);
		}
	};
	
	const RIGHT = new class extends Instruction {
		public execute(bf: Brainfuck): void {
			bf.addMemoryIndex(+1);
		}
	};
	
	const MINUS = new class extends Instruction {
		public execute(bf: Brainfuck): void {
			bf.addMemoryValue(-1);
		}
	};
	
	const PLUS = new class extends Instruction {
		public execute(bf: Brainfuck): void {
			bf.addMemoryValue(+1);
		}
	};
	
	const INPUT = new class extends Instruction {
		public execute(bf: Brainfuck): void {
			bf.readInput();
		}
	};
	
	const OUTPUT = new class extends Instruction {
		public execute(bf: Brainfuck): void {
			bf.writeOutput();
		}
	};
	
	
	class BeginLoop extends Instruction {
		public constructor(
				public readonly exitIndex: int) {
			super();
		}
		public execute(bf: Brainfuck): void {
			if (bf.isMemoryZero())
				bf.setInstructionIndex(this.exitIndex);
		}
	}
	
	
	class EndLoop extends Instruction {
		public constructor(
				public readonly enterIndex: int) {
			super();
		}
		public execute(bf: Brainfuck): void {
			if (!bf.isMemoryZero())
				bf.setInstructionIndex(this.enterIndex);
		}
	}
	
	
	
	/*---- Utility functions ----*/
	
	function addSeparators(val: int): string {
		let result: string = val.toString();
		for (let i = result.length - 3; i > 0; i -= 3)
			result = result.substring(0, i) + "\u00A0" + result.substring(i);  // Non-breaking space
		return result;
	}
	
	
	function queryHtml(query: string): HTMLElement {
		return queryElem(query, HTMLElement);
	}
	
	type Constructor<T> = { new(...args: Array<any>): T };
	
	function queryElem<T>(query: string, type: Constructor<T>): T {
		let result: Element|null = document.querySelector(query);
		if (result instanceof type)
			return result;
		else if (result === null)
			throw new Error("Element not found");
		else
			throw new TypeError("Invalid element type");
	}
	
	
	function appendElem(container: Element, tagName: string, text?: string): HTMLElement {
		let result: HTMLElement = document.createElement(tagName);
		if (text !== undefined)
			result.textContent = text;
		return container.appendChild(result);
	}
	
	
	if (!("replaceChildren" in Element.prototype)) {  // Polyfill
		Element.prototype.replaceChildren = function(...newChildren: Array<Node|string>): void {
			while (this.firstChild !== null)
				this.removeChild(this.firstChild);
			this.append(...newChildren);
		};
	}
	
}
