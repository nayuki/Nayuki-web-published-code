/*
 * Brainfuck interpreter (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/brainfuck-interpreter-javascript
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var app;
(function (app) {
    /*---- Mostly HTML input/output elements ----*/
    var inputsElem = queryHtml("#inputs");
    var inputCodeElem = queryElem("#input-code", HTMLTextAreaElement);
    var inputTextElem = queryElem("#input-text", HTMLTextAreaElement);
    var outputsElem = queryHtml("#outputs");
    var outputTextPre = queryHtml("#output-text pre");
    var stepButton = queryElem("#execute-step", HTMLButtonElement);
    var runButton = queryElem("#execute-run", HTMLButtonElement);
    var pauseButton = queryElem("#execute-pause", HTMLButtonElement);
    var instance = null;
    /*---- Entry points ----*/
    function doDemo(code) {
        doEditCodeInput();
        inputCodeElem.value = code;
        queryHtml("h2#program").scrollIntoView({ behavior: "smooth" });
    }
    app.doDemo = doDemo;
    function doExecute() {
        doEditCodeInput();
        try {
            instance = new Brainfuck(inputCodeElem.value, inputTextElem.value);
        }
        catch (e) {
            alert("Error: " + e.message);
            return;
        }
        inputsElem.style.display = "none";
        outputsElem.style.removeProperty("display");
        stepButton.focus();
    }
    app.doExecute = doExecute;
    function doEditCodeInput() {
        if (instance !== null) {
            instance.pause();
            instance = null;
        }
        outputsElem.style.display = "none";
        inputsElem.style.removeProperty("display");
    }
    app.doEditCodeInput = doEditCodeInput;
    /*---- Visual brainfuck machine ----*/
    var Brainfuck = /** @class */ (function () {
        function Brainfuck(code, text) {
            var _this = this;
            this.instructions = [];
            this.instructionsText = "";
            this.instructionIndex = 0;
            this.numExecuted = 0;
            this.memory = [];
            this.memoryIndex = 0;
            this.memoryViewIndex = 0;
            this.inputIndex = 0;
            this.runTimeout = -1;
            this.runIterations = 1;
            // Parse/compile the code
            var openBracketIndexes = [];
            for (var i = 0; i < code.length; i++) {
                var inst = void 0;
                switch (code.charAt(i)) {
                    case "<":
                        inst = LEFT;
                        break;
                    case ">":
                        inst = RIGHT;
                        break;
                    case "-":
                        inst = MINUS;
                        break;
                    case "+":
                        inst = PLUS;
                        break;
                    case ",":
                        inst = INPUT;
                        break;
                    case ".":
                        inst = OUTPUT;
                        break;
                    case "[":
                        inst = new BeginLoop(-1); // Dummy
                        openBracketIndexes.push(this.instructions.length);
                        break;
                    case "]":
                        var j = openBracketIndexes.pop();
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
            stepButton.onclick = function () {
                _this.step();
                _this.showState();
            };
            runButton.onclick = function () {
                stepButton.disabled = true;
                runButton.disabled = true;
                pauseButton.disabled = false;
                _this.run();
            };
            pauseButton.onclick = function () {
                _this.pause();
            };
            queryHtml("#output-memory p button:nth-child(1)").onclick = function () {
                _this.memoryViewIndex = Math.max(_this.memoryViewIndex - Brainfuck.MEMORY_VIEW_WINDOW, 0);
                _this.showMemoryView();
            };
            queryHtml("#output-memory p button:nth-child(2)").onclick = function () {
                _this.memoryViewIndex += Brainfuck.MEMORY_VIEW_WINDOW;
                _this.showMemoryView();
            };
            // Set UI elements
            this.inputText = text;
            outputTextPre.textContent = "";
            this.showState();
        }
        Brainfuck.prototype.pause = function () {
            pauseButton.disabled = true;
            if (this.runTimeout != -1) {
                window.clearTimeout(this.runTimeout);
                this.runTimeout = -1;
                stepButton.disabled = false;
                runButton.disabled = false;
            }
        };
        Brainfuck.prototype.isHalted = function () {
            return this.instructionIndex >= this.instructions.length;
        };
        Brainfuck.prototype.step = function () {
            if (this.isHalted())
                return;
            var inst = this.instructions[this.instructionIndex];
            this.instructionIndex++;
            try {
                inst.execute(this);
                this.numExecuted++;
            }
            catch (e) {
                alert("Error: " + e.message);
                this.instructionIndex = this.instructions.length;
            }
        };
        Brainfuck.prototype.run = function () {
            var _this = this;
            if (this.runTimeout != -1)
                throw new Error("Assertion error");
            var startTime = Date.now();
            for (var i = 0; i < this.runIterations; i++)
                this.step();
            var elapsedTime = Date.now() - startTime;
            if (elapsedTime <= 0)
                this.runIterations *= 2;
            else
                this.runIterations *= Brainfuck.TARGET_RUN_TIME / elapsedTime;
            this.showState();
            if (!this.isHalted()) {
                this.runTimeout = window.setTimeout(function () {
                    _this.runTimeout = -1;
                    _this.run();
                });
            }
        };
        Brainfuck.prototype.setInstructionIndex = function (newIndex) {
            if (!(0 <= newIndex && newIndex <= this.instructions.length))
                throw new RangeError("Invalid instruction index");
            this.instructionIndex = newIndex;
        };
        Brainfuck.prototype.addMemoryIndex = function (delta) {
            var newIndex = this.memoryIndex + delta;
            if (newIndex < 0)
                throw new RangeError("Negative memory index");
            this.memoryIndex = newIndex;
        };
        Brainfuck.prototype.addMemoryValue = function (delta) {
            while (this.memoryIndex >= this.memory.length)
                this.memory.push(0);
            this.memory[this.memoryIndex] = (this.memory[this.memoryIndex] + delta) & 0xFF;
        };
        Brainfuck.prototype.isMemoryZero = function () {
            return this.memoryIndex >= this.memory.length || this.memory[this.memoryIndex] == 0;
        };
        Brainfuck.prototype.readInput = function () {
            while (this.memoryIndex >= this.memory.length)
                this.memory.push(0);
            var val = 0;
            if (this.inputIndex < this.inputText.length) {
                val = this.inputText.charCodeAt(this.inputIndex);
                if (val > 0xFF)
                    throw new Error("Input has character code greater than 255");
                this.inputIndex++;
            }
            this.memory[this.memoryIndex] = val;
        };
        Brainfuck.prototype.writeOutput = function () {
            var val = this.memoryIndex < this.memory.length ? this.memory[this.memoryIndex] : 0;
            outputTextPre.textContent += String.fromCharCode(val);
        };
        Brainfuck.prototype.showState = function () {
            queryHtml("#output-instructions p").textContent =
                "Length = " + addSeparators(this.instructions.length) + "; " +
                    ("Index = " + addSeparators(this.instructionIndex) + "; ") +
                    ("Executed = " + addSeparators(this.numExecuted)) +
                    (this.isHalted() ? "; Finished" : "");
            {
                var left = this.instructionsText.substring(0, this.instructionIndex);
                var outputInstructionsPre = queryHtml("#output-instructions pre");
                clearChildren(outputInstructionsPre);
                outputInstructionsPre.textContent = left;
                if (this.instructionIndex < this.instructions.length) {
                    var mid = this.instructionsText.charAt(this.instructionIndex);
                    var right = this.instructionsText.substring(this.instructionIndex + 1);
                    appendElem(outputInstructionsPre, "strong", mid);
                    outputInstructionsPre.appendChild(document.createTextNode(right));
                }
            }
            queryHtml("#output-memory p span").textContent =
                "Index = " + addSeparators(this.memoryIndex);
            {
                var MEMORY_VIEW_STEP = Math.floor(Brainfuck.MEMORY_VIEW_WINDOW / 2);
                while (this.memoryIndex < this.memoryViewIndex && this.memoryViewIndex >= MEMORY_VIEW_STEP)
                    this.memoryViewIndex -= MEMORY_VIEW_STEP;
                while (this.memoryIndex >= this.memoryViewIndex + Brainfuck.MEMORY_VIEW_WINDOW)
                    this.memoryViewIndex += MEMORY_VIEW_STEP;
                this.showMemoryView();
            }
            queryHtml("#output-input p").textContent =
                "Length = " + addSeparators(this.inputText.length) + "; " +
                    ("Index = " + addSeparators(this.inputIndex));
            {
                var left = this.inputText.substring(0, this.inputIndex);
                var outputInputPre = queryHtml("#output-input pre");
                clearChildren(outputInputPre);
                outputInputPre.textContent = left;
                if (this.inputIndex < this.inputText.length) {
                    var mid = this.inputText.charAt(this.inputIndex);
                    var right = this.inputText.substring(this.inputIndex + 1);
                    appendElem(outputInputPre, "strong", mid);
                    outputInputPre.appendChild(document.createTextNode(right));
                }
            }
            {
                var outputText = outputTextPre.textContent;
                if (outputText === null)
                    throw new Error("Assertion error");
                queryHtml("#output-text p").textContent = "Length = " + addSeparators(outputText.length);
            }
            if (this.isHalted()) {
                stepButton.disabled = true;
                runButton.disabled = true;
                pauseButton.disabled = true;
            }
        };
        Brainfuck.prototype.showMemoryView = function () {
            var outputMemoryTbody = queryHtml("#output-memory tbody");
            clearChildren(outputMemoryTbody);
            for (var i = 0; i < Brainfuck.MEMORY_VIEW_WINDOW; i++) {
                var index = this.memoryViewIndex + i;
                var tr = appendElem(outputMemoryTbody, "tr");
                if (index == this.memoryIndex)
                    tr.classList.add("active");
                appendElem(tr, "td", index.toString());
                var val = index < this.memory.length ? this.memory[index] : 0;
                appendElem(tr, "td", val.toString());
            }
        };
        Brainfuck.MEMORY_VIEW_WINDOW = 30;
        Brainfuck.TARGET_RUN_TIME = 50; // Milliseconds
        return Brainfuck;
    }());
    /*---- Brainfuck instruction/operation types ----*/
    var Instruction = /** @class */ (function () {
        function Instruction() {
        }
        return Instruction;
    }());
    var LEFT = new /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_1.prototype.execute = function (bf) {
            bf.addMemoryIndex(-1);
        };
        return class_1;
    }(Instruction));
    var RIGHT = new /** @class */ (function (_super) {
        __extends(class_2, _super);
        function class_2() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_2.prototype.execute = function (bf) {
            bf.addMemoryIndex(+1);
        };
        return class_2;
    }(Instruction));
    var MINUS = new /** @class */ (function (_super) {
        __extends(class_3, _super);
        function class_3() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_3.prototype.execute = function (bf) {
            bf.addMemoryValue(-1);
        };
        return class_3;
    }(Instruction));
    var PLUS = new /** @class */ (function (_super) {
        __extends(class_4, _super);
        function class_4() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_4.prototype.execute = function (bf) {
            bf.addMemoryValue(+1);
        };
        return class_4;
    }(Instruction));
    var INPUT = new /** @class */ (function (_super) {
        __extends(class_5, _super);
        function class_5() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_5.prototype.execute = function (bf) {
            bf.readInput();
        };
        return class_5;
    }(Instruction));
    var OUTPUT = new /** @class */ (function (_super) {
        __extends(class_6, _super);
        function class_6() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        class_6.prototype.execute = function (bf) {
            bf.writeOutput();
        };
        return class_6;
    }(Instruction));
    var BeginLoop = /** @class */ (function (_super) {
        __extends(BeginLoop, _super);
        function BeginLoop(exitIndex) {
            var _this = _super.call(this) || this;
            _this.exitIndex = exitIndex;
            return _this;
        }
        BeginLoop.prototype.execute = function (bf) {
            if (bf.isMemoryZero())
                bf.setInstructionIndex(this.exitIndex);
        };
        return BeginLoop;
    }(Instruction));
    var EndLoop = /** @class */ (function (_super) {
        __extends(EndLoop, _super);
        function EndLoop(enterIndex) {
            var _this = _super.call(this) || this;
            _this.enterIndex = enterIndex;
            return _this;
        }
        EndLoop.prototype.execute = function (bf) {
            if (!bf.isMemoryZero())
                bf.setInstructionIndex(this.enterIndex);
        };
        return EndLoop;
    }(Instruction));
    /*---- Utility functions ----*/
    function addSeparators(val) {
        var result = val.toString();
        for (var i = result.length - 3; i > 0; i -= 3)
            result = result.substring(0, i) + "\u00A0" + result.substring(i); // Non-breaking space
        return result;
    }
    function queryHtml(query) {
        return queryElem(query, HTMLElement);
    }
    function queryElem(query, type) {
        var result = document.querySelector(query);
        if (result instanceof type)
            return result;
        else if (result === null)
            throw new Error("Element not found");
        else
            throw new TypeError("Invalid element type");
    }
    function clearChildren(elem) {
        while (elem.firstChild !== null)
            elem.removeChild(elem.firstChild);
    }
    function appendElem(container, tagName, text) {
        var result = document.createElement(tagName);
        if (text !== undefined)
            result.textContent = text;
        return container.appendChild(result);
    }
})(app || (app = {}));
