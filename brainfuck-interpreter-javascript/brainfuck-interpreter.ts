/* 
 * Brainfuck interpreter
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/brainfuck-interpreter-javascript
 */


namespace app {
	
	type int = number;
	
	let instance: Brainfuck|null = null;
	let stepButton  = document.getElementById("step" ) as HTMLButtonElement;
	let runButton   = document.getElementById("run"  ) as HTMLButtonElement;
	let pauseButton = document.getElementById("pause") as HTMLButtonElement;
	
	
	
	/*---- Entry points from the HTML code ----*/
	
	export function doLoad(): void {
		if (instance !== null) {
			instance.pause();
			instance = null;
		}
		try {
			instance = new Brainfuck((document.getElementById("code") as HTMLInputElement).value);
		} catch (e) {
			alert(e);
			return;
		}
	}
	
	
	export function doDemo(s: string): void {
		(document.getElementById("code") as HTMLTextAreaElement).value = s;
		doLoad();
	}
	
	
	export function doStep(): void {
		if (instance !== null)
			instance.step();
	}
	
	
	export function doRun(): void {
		if (instance !== null) {
			stepButton.disabled = true;
			runButton.disabled = true;
			pauseButton.disabled = false;
			instance.run();
		}
	}
	
	
	export function doPause(): void {
		if (instance !== null) {
			instance.pause();
			stepButton.disabled = false;
			runButton.disabled = false;
			pauseButton.disabled = true;
		}
	}
	
	
	
	/*---- Brainfuck interpreter core ----*/
	
	class Brainfuck {
		
		// State variables
		private program: Array<int>;
		private programCounter: int = 0;
		private memory: Array<int> = [];
		private memoryIndex: int = 0;
		private input: string = (document.getElementById("input") as HTMLTextAreaElement).value;
		private inputIndex: int = 0;
		private output: string = "";
		private outputChanged: boolean = false;
		
		private steps: int = 0;
		private lastStepsUpdate: number|null = null;
		private timeout: int|null = null;
		private minMemoryWrite: int;  // Inclusive
		private maxMemoryWrite: int;  // Inclusive
		
		
		public constructor(code: string) {
			this.program = compile(code);
			this.minMemoryWrite = this.memoryIndex;
			this.maxMemoryWrite = this.memoryIndex;
			this.showState();
			stepButton.disabled = this.isHalted();
			runButton.disabled = this.isHalted();
			pauseButton.disabled = true;
		}
		
		
		// Public controls
		
		public run(): void {
			if (!this.isHalted() && this.timeout === null)
				this.runInternal(1);
		}
		
		public step(): void {
			if (!this.isHalted() && this.timeout === null) {
				this.stepInternal();
				this.showState();
				if (this.isHalted()) {
					stepButton.disabled = true;
					runButton.disabled = true;
				}
			}
		}
		
		public pause(): void {
			if (this.timeout !== null) {
				window.clearTimeout(this.timeout);
				this.timeout = null;
				this.showState();
			}
		}
		
		
		// Execution
		
		private runInternal(iters: int): void {
			const startTime: number = Date.now();
			this.outputChanged = false;
			
			for (let i = 0; i < iters && this.stepInternal(); i++);
			
			if (this.isHalted()) {
				this.showState();
				pauseButton.disabled = true;
			
			} else {
				if (this.outputChanged)
					this.showOutput();
				if (this.lastStepsUpdate === null || Date.now() - this.lastStepsUpdate >= 100) {
					this.showSteps();
					this.lastStepsUpdate = Date.now();
				}
				
				// Regulate the number of iterations to execute before relinquishing control of the main JavaScript thread
				const execTime: number = Date.now() - startTime;  // How long this execution took
				const nextIters: int = Brainfuck.calcNextIters(execTime, iters);
				this.timeout = window.setTimeout(() => {
						this.timeout = null;
						this.runInternal(nextIters);
					}, 1);
			}
		}
		
		
		private stepInternal(): boolean {
			if (this.isHalted())
				return false;
			switch (this.program[this.programCounter]) {
				case Operation.LEFT:
					this.memoryIndex--;
					this.programCounter++;
					break;
				case Operation.RIGHT:
					this.memoryIndex++;
					this.programCounter++;
					break;
				case Operation.PLUS:
					this.setCell((this.getCell() + 1) & 0xFF);
					this.programCounter++;
					break;
				case Operation.MINUS:
					this.setCell((this.getCell() - 1) & 0xFF);
					this.programCounter++;
					break;
				case Operation.IN:
					this.setCell(this.getNextInputByte());
					this.programCounter++;
					break;
				case Operation.OUT:
					this.output += String.fromCharCode(this.getCell());
					this.outputChanged = true;
					this.programCounter++;
					break;
				case Operation.LOOP:
					if (this.getCell() == 0)
						this.programCounter = this.program[this.programCounter + 1];
					this.programCounter += 2;
					break;
				case Operation.BACK:
					if (this.getCell() != 0)
						this.programCounter = this.program[this.programCounter + 1];
					this.programCounter += 2;
					break;
				default:
					throw "Assertion error";
			}
			this.steps++;
			return !this.isHalted();
		}
		
		
		// Helper functions
		
		private isHalted(): boolean {
			return this.programCounter == this.program.length;
		}
		
		private getCell(): int {
			if (this.memory[this.memoryIndex] === undefined)
				this.memory[this.memoryIndex] = 0;
			return this.memory[this.memoryIndex];
		}
		
		private setCell(value: int): void {
			this.memory[this.memoryIndex] = value;
			this.minMemoryWrite = Math.min(this.memoryIndex, this.minMemoryWrite);
			this.maxMemoryWrite = Math.max(this.memoryIndex, this.maxMemoryWrite);
		}
		
		private getNextInputByte(): int {
			if (this.inputIndex == this.input.length)
				return 0;
			else if (this.input.charCodeAt(this.inputIndex) >= 256)
				throw "Error: Input has character code greater than 255";
			else
				return this.input.charCodeAt(this.inputIndex++);
		}
		
		
		private static calcNextIters(time: number, iters: int): int {
			const TARGET_TIME: number = 20;
			
			let multiplier: number = time > 0 ? TARGET_TIME / time : 2.0;
			if (multiplier > 10.0) multiplier = 10.0;
			else if (multiplier < 0.1) multiplier = 0.1;
			
			let nextIters: int = Math.round(multiplier * iters);
			if (nextIters < 1) nextIters = 1;
			return nextIters;
		}
		
		
		private showState(): void {
			this.showOutput();
			this.showMemory();
			this.showSteps();
		}
		
		private showOutput(): void {
			(document.getElementById("output") as HTMLTextAreaElement).value = this.output;
		}
		
		private showMemory(): void {
			let s: string = "Address  Value  Pointer\n";
			const lower: int = Math.min(this.minMemoryWrite, this.memoryIndex);
			const upper: int = Math.max(this.maxMemoryWrite, this.memoryIndex);
			const start: int = Math.max(this.memoryIndex - 1000, lower);
			const end  : int = Math.min(this.memoryIndex + 1000, upper);
			if (start != lower)
				s += "(... more values, but truncated ...)\n";
			for (let i = start; i <= end; i++)
				s += padNumber(i, 7) + "  " + padNumber(this.memory[i] !== undefined ? this.memory[i] : 0, 5) + (i == this.memoryIndex ? "  <--" : "") + "\n";
			if (end != upper)
				s += "(... more values, but truncated ...)\n";
			(document.getElementById("memory") as HTMLTextAreaElement).value = s;
		}
		
		private showSteps(): void {
			(document.getElementById("steps") as HTMLInputElement).value = this.steps.toString();
		}
		
	}
	
	
	// Given the program string, returns an array of numeric opcodes and jump targets.
	function compile(str: string): Array<int> {
		let result: Array<int> = [];
		let openBracketIndices: Array<int> = [];
		for (let i = 0; i < str.length; i++) {
			let op: Operation|null = null;
			switch (str.charAt(i)) {
				case '<':  op = Operation.LEFT;   break;
				case '>':  op = Operation.RIGHT;  break;
				case '+':  op = Operation.PLUS;   break;
				case '-':  op = Operation.MINUS;  break;
				case ',':  op = Operation.IN;     break;
				case '.':  op = Operation.OUT;    break;
				case '[':  op = Operation.LOOP;   break;
				case ']':  op = Operation.BACK;   break;
			}
			if (op === null)
				continue;
			result.push(op);
			
			// Add jump targets
			if (op === Operation.LOOP) {
				openBracketIndices.push(result.length - 1);
				result.push(-1);  // Placeholder
			} else if (op === Operation.BACK) {
				const index: int|undefined = openBracketIndices.pop();
				if (index === undefined)
					throw "Mismatched brackets (extra right bracket)";
				result[index + 1] = result.length - 1;
				result.push(index);
			}
		}
		if (openBracketIndices.length > 0)
			throw "Mismatched brackets (extra left bracket)";
		return result;
	}
	
	
	function padNumber(n: int, width: int): string {
		let s: string = n.toString();
		while (s.length < width)
			s = " " + s;
		return s;
	}
	
	
	
	const enum Operation {
		LEFT,
		RIGHT,
		PLUS,
		MINUS,
		IN,
		OUT,
		LOOP,
		BACK,
	}
	
}
