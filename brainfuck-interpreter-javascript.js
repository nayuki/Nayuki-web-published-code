/*
 * Brainfuck interpreter
 * Copyright (c) 2011 Nayuki Minase
 */


var program;
var programCounter;
var memory;
var memoryIndex;
var input;
var inputIndex;
var output;
var steps;

var timeout = null;


function run() {
	try {
		stop();
		program = compile(document.getElementById("code").value);
		programCounter = 0;
		memory = [];
		memoryIndex = 0;
		input = document.getElementById("input").value;
		inputIndex = 0;
		output = "";
		document.getElementById("output").value = output;
		steps = 0;
		execute(1);
	} catch (e) {
		alert(e);
	}
}


function stop() {
	if (timeout != null)
		clearTimeout(timeout);
}


var LEFT = 0, RIGHT = 1, PLUS = 2, MINUS = 3, IN = 4, OUT = 5, LOOP = 6, BACK = 7;

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
	
	if (outputChanged)
		document.getElementById("output").value = output;
	document.getElementById("steps").value = steps.toString();
	
	if (programCounter == program.length)
		return;
	
	var time = new Date().getTime() - startTime;
	var multiplier = time > 0 ? 10 / time : 2.0;
	if (multiplier > 10.0) multiplier = 10.0;
	else if (multiplier < 0.1) multiplier = 0.1;
	var nextIters = Math.max(Math.round(multiplier * iters), 1);
	timeout = setTimeout(function() { execute(nextIters); }, 10);
}


function compile(str) {
	var result = [];
	var openBracketIndices = [];
	for (var i = 0; i < str.length; i++) {
		var command;
		switch (str.charAt(i)) {
			case '<':  command = LEFT;   break;
			case '>':  command = RIGHT;  break;
			case '+':  command = PLUS;   break;
			case '-':  command = MINUS;  break;
			case ',':  command = IN;     break;
			case '.':  command = OUT;    break;
			case '[':  command = LOOP;   break;
			case ']':  command = BACK;   break;
			default:   command = -1;     break;
		}
		if (command != -1)
			result.push(command);
		
		// Add jump targets
		if (command == LOOP) {
			openBracketIndices.push(result.length - 1);
			result.push(-1);  // Placeholder
		} else if (command == BACK) {
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


function getCell() {
	if (memory[memoryIndex] === undefined)
		memory[memoryIndex] = 0;
	return memory[memoryIndex];
}

function setCell(value) {
	memory[memoryIndex] = value;
}

function getInput() {
	//if (inputIndex == input.length)
	//	throw "Error: Attempted to read past end of input";
	if (inputIndex == input.length)
		return 0;
	else if (input.charCodeAt(inputIndex) >= 256)
		throw "Error: Input has character code greater than 255";
	else
		return input.charCodeAt(inputIndex++);
}
