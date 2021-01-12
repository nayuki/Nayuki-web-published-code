/*
 * Brainfuck interpreter (compiled from TypeScript)
 *
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/brainfuck-interpreter-javascript
 */
"use strict";
var app;
(function (app) {
    var instance = null;
    var stepButton = document.getElementById("step");
    var runButton = document.getElementById("run");
    var pauseButton = document.getElementById("pause");
    /*---- Entry points from the HTML code ----*/
    function doLoad() {
        if (instance !== null) {
            instance.pause();
            instance = null;
        }
        try {
            instance = new Brainfuck(document.getElementById("code").value);
        }
        catch (e) {
            alert(e);
            return;
        }
    }
    app.doLoad = doLoad;
    function doDemo(s) {
        document.getElementById("code").value = s;
        doLoad();
    }
    app.doDemo = doDemo;
    function doStep() {
        if (instance !== null)
            instance.step();
    }
    app.doStep = doStep;
    function doRun() {
        if (instance !== null) {
            stepButton.disabled = true;
            runButton.disabled = true;
            pauseButton.disabled = false;
            instance.run();
        }
    }
    app.doRun = doRun;
    function doPause() {
        if (instance !== null) {
            instance.pause();
            stepButton.disabled = false;
            runButton.disabled = false;
            pauseButton.disabled = true;
        }
    }
    app.doPause = doPause;
    /*---- Brainfuck interpreter core ----*/
    var Brainfuck = /** @class */ (function () {
        function Brainfuck(code) {
            this.programCounter = 0;
            this.memory = [];
            this.memoryIndex = 0;
            this.input = document.getElementById("input").value;
            this.inputIndex = 0;
            this.output = "";
            this.outputChanged = false;
            this.steps = 0;
            this.lastStepsUpdate = null;
            this.timeout = null;
            this.program = compile(code);
            this.minMemoryWrite = this.memoryIndex;
            this.maxMemoryWrite = this.memoryIndex;
            this.showState();
            stepButton.disabled = this.isHalted();
            runButton.disabled = this.isHalted();
            pauseButton.disabled = true;
        }
        // Public controls
        Brainfuck.prototype.run = function () {
            if (!this.isHalted() && this.timeout === null)
                this.runInternal(1);
        };
        Brainfuck.prototype.step = function () {
            if (!this.isHalted() && this.timeout === null) {
                this.stepInternal();
                this.showState();
                if (this.isHalted()) {
                    stepButton.disabled = true;
                    runButton.disabled = true;
                }
            }
        };
        Brainfuck.prototype.pause = function () {
            if (this.timeout !== null) {
                window.clearTimeout(this.timeout);
                this.timeout = null;
                this.showState();
            }
        };
        // Execution
        Brainfuck.prototype.runInternal = function (iters) {
            var _this = this;
            var startTime = Date.now();
            this.outputChanged = false;
            for (var i = 0; i < iters && this.stepInternal(); i++)
                ;
            if (this.isHalted()) {
                this.showState();
                pauseButton.disabled = true;
            }
            else {
                if (this.outputChanged)
                    this.showOutput();
                if (this.lastStepsUpdate === null || Date.now() - this.lastStepsUpdate >= 100) {
                    this.showSteps();
                    this.lastStepsUpdate = Date.now();
                }
                // Regulate the number of iterations to execute before relinquishing control of the main JavaScript thread
                var execTime = Date.now() - startTime; // How long this execution took
                var nextIters_1 = Brainfuck.calcNextIters(execTime, iters);
                this.timeout = window.setTimeout(function () {
                    _this.timeout = null;
                    _this.runInternal(nextIters_1);
                }, 1);
            }
        };
        Brainfuck.prototype.stepInternal = function () {
            if (this.isHalted())
                return false;
            switch (this.program[this.programCounter]) {
                case 0 /* LEFT */:
                    this.memoryIndex--;
                    this.programCounter++;
                    break;
                case 1 /* RIGHT */:
                    this.memoryIndex++;
                    this.programCounter++;
                    break;
                case 2 /* PLUS */:
                    this.setCell((this.getCell() + 1) & 0xFF);
                    this.programCounter++;
                    break;
                case 3 /* MINUS */:
                    this.setCell((this.getCell() - 1) & 0xFF);
                    this.programCounter++;
                    break;
                case 4 /* IN */:
                    this.setCell(this.getNextInputByte());
                    this.programCounter++;
                    break;
                case 5 /* OUT */:
                    this.output += String.fromCharCode(this.getCell());
                    this.outputChanged = true;
                    this.programCounter++;
                    break;
                case 6 /* LOOP */:
                    if (this.getCell() == 0)
                        this.programCounter = this.program[this.programCounter + 1];
                    this.programCounter += 2;
                    break;
                case 7 /* BACK */:
                    if (this.getCell() != 0)
                        this.programCounter = this.program[this.programCounter + 1];
                    this.programCounter += 2;
                    break;
                default:
                    throw "Assertion error";
            }
            this.steps++;
            return !this.isHalted();
        };
        // Helper functions
        Brainfuck.prototype.isHalted = function () {
            return this.programCounter == this.program.length;
        };
        Brainfuck.prototype.getCell = function () {
            if (this.memory[this.memoryIndex] === undefined)
                this.memory[this.memoryIndex] = 0;
            return this.memory[this.memoryIndex];
        };
        Brainfuck.prototype.setCell = function (value) {
            this.memory[this.memoryIndex] = value;
            this.minMemoryWrite = Math.min(this.memoryIndex, this.minMemoryWrite);
            this.maxMemoryWrite = Math.max(this.memoryIndex, this.maxMemoryWrite);
        };
        Brainfuck.prototype.getNextInputByte = function () {
            if (this.inputIndex == this.input.length)
                return 0;
            else if (this.input.charCodeAt(this.inputIndex) >= 256)
                throw "Error: Input has character code greater than 255";
            else
                return this.input.charCodeAt(this.inputIndex++);
        };
        Brainfuck.calcNextIters = function (time, iters) {
            var TARGET_TIME = 20;
            var multiplier = time > 0 ? TARGET_TIME / time : 2.0;
            if (multiplier > 10.0)
                multiplier = 10.0;
            else if (multiplier < 0.1)
                multiplier = 0.1;
            var nextIters = Math.round(multiplier * iters);
            if (nextIters < 1)
                nextIters = 1;
            return nextIters;
        };
        Brainfuck.prototype.showState = function () {
            this.showOutput();
            this.showMemory();
            this.showSteps();
        };
        Brainfuck.prototype.showOutput = function () {
            document.getElementById("output").value = this.output;
        };
        Brainfuck.prototype.showMemory = function () {
            var s = "Address  Value  Pointer\n";
            var lower = Math.min(this.minMemoryWrite, this.memoryIndex);
            var upper = Math.max(this.maxMemoryWrite, this.memoryIndex);
            var start = Math.max(this.memoryIndex - 1000, lower);
            var end = Math.min(this.memoryIndex + 1000, upper);
            if (start != lower)
                s += "(... more values, but truncated ...)\n";
            for (var i = start; i <= end; i++)
                s += padNumber(i, 7) + "  " + padNumber(this.memory[i] !== undefined ? this.memory[i] : 0, 5) + (i == this.memoryIndex ? "  <--" : "") + "\n";
            if (end != upper)
                s += "(... more values, but truncated ...)\n";
            document.getElementById("memory").value = s;
        };
        Brainfuck.prototype.showSteps = function () {
            document.getElementById("steps").value = this.steps.toString();
        };
        return Brainfuck;
    }());
    // Given the program string, returns an array of numeric opcodes and jump targets.
    function compile(str) {
        var result = [];
        var openBracketIndices = [];
        for (var i = 0; i < str.length; i++) {
            var op = null;
            switch (str.charAt(i)) {
                case '<':
                    op = 0 /* LEFT */;
                    break;
                case '>':
                    op = 1 /* RIGHT */;
                    break;
                case '+':
                    op = 2 /* PLUS */;
                    break;
                case '-':
                    op = 3 /* MINUS */;
                    break;
                case ',':
                    op = 4 /* IN */;
                    break;
                case '.':
                    op = 5 /* OUT */;
                    break;
                case '[':
                    op = 6 /* LOOP */;
                    break;
                case ']':
                    op = 7 /* BACK */;
                    break;
            }
            if (op === null)
                continue;
            result.push(op);
            // Add jump targets
            if (op === 6 /* LOOP */) {
                openBracketIndices.push(result.length - 1);
                result.push(-1); // Placeholder
            }
            else if (op === 7 /* BACK */) {
                var index = openBracketIndices.pop();
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
    function padNumber(n, width) {
        var s = n.toString();
        while (s.length < width)
            s = " " + s;
        return s;
    }
})(app || (app = {}));
