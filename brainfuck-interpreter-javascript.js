/*
 * Brainfuck interpreter
 * Copyright (c) 2011 Nayuki Minase
 */


var instance = null;

/* Entry points from the HTML code */

function run() {
	try {
		stop();
		instance = new Brainfuck(document.getElementById("code").value);
		instance.run();
	} catch (e) {
		alert(e);
	}
}

function stop() {
	if (instance != null)
		instance.stop();
	instance = null;
}


/* Brainfuck interpreter core */

// Constants for the opcodes
var LEFT = 0, RIGHT = 1, PLUS = 2, MINUS = 3, IN = 4, OUT = 5, LOOP = 6, BACK = 7;

function Brainfuck(code) {
	var program = compile(code);
	var programCounter;
	var memory;
	var memoryIndex;
	var input;
	var inputIndex;
	var output;
	var steps;
	var lastStepsUpdate;
	var timeout = null;
	
	
	this.reset = function() {
		this.stop();
		programCounter = 0;
		memory = [];
		memoryIndex = 0;
		input = document.getElementById("input").value;
		inputIndex = 0;
		output = "";
		setOutput();
		steps = 0;
		lastStepsUpdate = new Date().getTime();
	}
	
	this.run = function() {
		this.stop();
		execute(1);
	}
	
	this.stop = function() {
		if (timeout != null)
			clearTimeout(timeout);
		timeout = null;
	}
	
	
	this.reset();
	
	
	function execute(iters) {
		var startTime = new Date().getTime();
		var outputChanged = false;
		for (var i = 0; i < iters && programCounter < program.length; i++, steps++) {
			switch (program[programCounter]) {
				case LEFT:
					memoryIndex--;
					programCounter++;
					break;
				case RIGHT:
					memoryIndex++;
					programCounter++;
					break;
				case PLUS:
					setCell((getCell() + 1) & 0xFF);
					programCounter++;
					break;
				case MINUS:
					setCell((getCell() - 1) & 0xFF);
					programCounter++;
					break;
				case IN:
					setCell(getInput());
					programCounter++;
					break;
				case OUT:
					output += String.fromCharCode(getCell());
					outputChanged = true;
					programCounter++;
					break;
				case LOOP:
					if (getCell() == 0)
						programCounter = program[programCounter + 1];
					programCounter += 2;
					break;
				case BACK:
					if (getCell() != 0)
						programCounter = program[programCounter + 1];
					programCounter += 2;
					break;
				default:
					throw "Assertion error";
			}
		}
		
		var halted = programCounter == program.length;
		
		if (outputChanged)
			setOutput();
		if (halted || new Date().getTime() - lastStepsUpdate >= 100) {
			document.getElementById("steps").value = steps.toString();
			lastStepsUpdate = new Date().getTime();
		}
		
		if (halted)
			return;
		
		// Regulate the number of iterations to execute before relinquishing control of the main JavaScript thread
		var time = new Date().getTime() - startTime;
		var multiplier = time > 0 ? 20 / time : 2.0;
		if (multiplier > 10.0) multiplier = 10.0;
		else if (multiplier < 0.1) multiplier = 0.1;
		var nextIters = Math.max(Math.round(multiplier * iters), 1);
		
		timeout = setTimeout(function() { execute(nextIters); }, 1);
	}
	
	
	function getCell() {
		if (memory[memoryIndex] === undefined)
			memory[memoryIndex] = 0;
		return memory[memoryIndex];
	}
	
	function setCell(value) {
		memory[memoryIndex] = value;
	}
	
	
	function getInput() {
		if (inputIndex == input.length)
			return 0;
		else if (input.charCodeAt(inputIndex) >= 256)
			throw "Error: Input has character code greater than 255";
		else
			return input.charCodeAt(inputIndex++);
	}
	
	function setOutput() {
		document.getElementById("output").value = output;
	}
	
}


// Given the program string, returns an array of numeric opcodes and jump targets.
function compile(str) {
	var result = [];
	var openBracketIndices = [];
	for (var i = 0; i < str.length; i++) {
		var op;
		switch (str.charAt(i)) {
			case '<':  op = LEFT;   break;
			case '>':  op = RIGHT;  break;
			case '+':  op = PLUS;   break;
			case '-':  op = MINUS;  break;
			case ',':  op = IN;     break;
			case '.':  op = OUT;    break;
			case '[':  op = LOOP;   break;
			case ']':  op = BACK;   break;
			default:   op = -1;     break;
		}
		if (op != -1)
			result.push(op);
		
		// Add jump targets
		if (op == LOOP) {
			openBracketIndices.push(result.length - 1);
			result.push(-1);  // Placeholder
		} else if (op == BACK) {
			if (openBracketIndices.length == 0)
				throw "Mismatched brackets (extra right bracket)";
			var index = openBracketIndices.pop();
			result[index + 1] = result.length - 1;
			result.push(index);
		}
	}
	if (openBracketIndices.length > 0)
		throw "Mismatched brackets (extra left bracket)";
	return result;
}
