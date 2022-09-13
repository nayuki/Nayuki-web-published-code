/*
 * Brainfuck interpreter (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/brainfuck-interpreter-javascript
 */
"use strict";
var app;
(function (app) {
    /*---- Mostly HTML input/output elements ----*/
    let inputsElem = queryHtml("#inputs");
    let inputCodeElem = queryElem("#input-code", HTMLTextAreaElement);
    let inputTextElem = queryElem("#input-text", HTMLTextAreaElement);
    let outputsElem = queryHtml("#outputs");
    let outputTextPre = queryHtml("#output-text pre");
    let stepButton = queryElem("#execute-step", HTMLButtonElement);
    let runButton = queryElem("#execute-run", HTMLButtonElement);
    let pauseButton = queryElem("#execute-pause", HTMLButtonElement);
    let instance = null;
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
    class Brainfuck {
        constructor(code, text) {
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
            let openBracketIndexes = [];
            for (let i = 0; i < code.length; i++) {
                let inst;
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
                        const j = openBracketIndexes.pop();
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
        pause() {
            pauseButton.disabled = true;
            if (this.runTimeout != -1) {
                window.clearTimeout(this.runTimeout);
                this.runTimeout = -1;
                stepButton.disabled = false;
                runButton.disabled = false;
            }
        }
        isHalted() {
            return this.instructionIndex >= this.instructions.length;
        }
        step() {
            if (this.isHalted())
                return;
            const inst = this.instructions[this.instructionIndex];
            this.instructionIndex++;
            try {
                inst.execute(this);
                this.numExecuted++;
            }
            catch (e) {
                alert("Error: " + e.message);
                this.instructionIndex = this.instructions.length;
            }
        }
        run() {
            if (this.runTimeout != -1)
                throw new Error("Assertion error");
            const startTime = Date.now();
            for (let i = 0; i < this.runIterations; i++)
                this.step();
            const elapsedTime = Date.now() - startTime;
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
        setInstructionIndex(newIndex) {
            if (!(0 <= newIndex && newIndex <= this.instructions.length))
                throw new RangeError("Invalid instruction index");
            this.instructionIndex = newIndex;
        }
        addMemoryIndex(delta) {
            const newIndex = this.memoryIndex + delta;
            if (newIndex < 0)
                throw new RangeError("Negative memory index");
            this.memoryIndex = newIndex;
        }
        addMemoryValue(delta) {
            while (this.memoryIndex >= this.memory.length)
                this.memory.push(0);
            this.memory[this.memoryIndex] = (this.memory[this.memoryIndex] + delta) & 0xFF;
        }
        isMemoryZero() {
            return this.memoryIndex >= this.memory.length || this.memory[this.memoryIndex] == 0;
        }
        readInput() {
            while (this.memoryIndex >= this.memory.length)
                this.memory.push(0);
            let val = 0;
            if (this.inputIndex < this.inputText.length) {
                val = this.inputText.charCodeAt(this.inputIndex);
                if (val > 0xFF)
                    throw new Error("Input has character code greater than 255");
                this.inputIndex++;
            }
            this.memory[this.memoryIndex] = val;
        }
        writeOutput() {
            const val = this.memoryIndex < this.memory.length ? this.memory[this.memoryIndex] : 0;
            outputTextPre.textContent += String.fromCharCode(val);
        }
        showState() {
            queryHtml("#output-instructions p").textContent =
                `Length = ${addSeparators(this.instructions.length)}; ` +
                    `Index = ${addSeparators(this.instructionIndex)}; ` +
                    `Executed = ${addSeparators(this.numExecuted)}` +
                    (this.isHalted() ? "; Finished" : "");
            {
                const left = this.instructionsText.substring(0, this.instructionIndex);
                let outputInstructionsPre = queryHtml("#output-instructions pre");
                clearChildren(outputInstructionsPre);
                outputInstructionsPre.textContent = left;
                if (this.instructionIndex < this.instructions.length) {
                    const mid = this.instructionsText.charAt(this.instructionIndex);
                    const right = this.instructionsText.substring(this.instructionIndex + 1);
                    appendElem(outputInstructionsPre, "strong", mid);
                    outputInstructionsPre.appendChild(document.createTextNode(right));
                }
            }
            queryHtml("#output-memory p span").textContent =
                `Index = ${addSeparators(this.memoryIndex)}`;
            {
                const MEMORY_VIEW_STEP = Math.floor(Brainfuck.MEMORY_VIEW_WINDOW / 2);
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
                const left = this.inputText.substring(0, this.inputIndex);
                let outputInputPre = queryHtml("#output-input pre");
                clearChildren(outputInputPre);
                outputInputPre.textContent = left;
                if (this.inputIndex < this.inputText.length) {
                    const mid = this.inputText.charAt(this.inputIndex);
                    const right = this.inputText.substring(this.inputIndex + 1);
                    appendElem(outputInputPre, "strong", mid);
                    outputInputPre.appendChild(document.createTextNode(right));
                }
            }
            {
                const outputText = outputTextPre.textContent;
                if (outputText === null)
                    throw new Error("Assertion error");
                queryHtml("#output-text p").textContent = `Length = ${addSeparators(outputText.length)}`;
            }
            if (this.isHalted()) {
                stepButton.disabled = true;
                runButton.disabled = true;
                pauseButton.disabled = true;
            }
        }
        showMemoryView() {
            let outputMemoryTbody = queryHtml("#output-memory tbody");
            clearChildren(outputMemoryTbody);
            for (let i = 0; i < Brainfuck.MEMORY_VIEW_WINDOW; i++) {
                const index = this.memoryViewIndex + i;
                let tr = appendElem(outputMemoryTbody, "tr");
                if (index == this.memoryIndex)
                    tr.classList.add("active");
                appendElem(tr, "td", index.toString());
                const val = index < this.memory.length ? this.memory[index] : 0;
                appendElem(tr, "td", val.toString());
            }
        }
    }
    Brainfuck.MEMORY_VIEW_WINDOW = 30;
    Brainfuck.TARGET_RUN_TIME = 50; // Milliseconds
    /*---- Brainfuck instruction/operation types ----*/
    class Instruction {
    }
    const LEFT = new class extends Instruction {
        execute(bf) {
            bf.addMemoryIndex(-1);
        }
    };
    const RIGHT = new class extends Instruction {
        execute(bf) {
            bf.addMemoryIndex(+1);
        }
    };
    const MINUS = new class extends Instruction {
        execute(bf) {
            bf.addMemoryValue(-1);
        }
    };
    const PLUS = new class extends Instruction {
        execute(bf) {
            bf.addMemoryValue(+1);
        }
    };
    const INPUT = new class extends Instruction {
        execute(bf) {
            bf.readInput();
        }
    };
    const OUTPUT = new class extends Instruction {
        execute(bf) {
            bf.writeOutput();
        }
    };
    class BeginLoop extends Instruction {
        constructor(exitIndex) {
            super();
            this.exitIndex = exitIndex;
        }
        execute(bf) {
            if (bf.isMemoryZero())
                bf.setInstructionIndex(this.exitIndex);
        }
    }
    class EndLoop extends Instruction {
        constructor(enterIndex) {
            super();
            this.enterIndex = enterIndex;
        }
        execute(bf) {
            if (!bf.isMemoryZero())
                bf.setInstructionIndex(this.enterIndex);
        }
    }
    /*---- Utility functions ----*/
    function addSeparators(val) {
        let result = val.toString();
        for (let i = result.length - 3; i > 0; i -= 3)
            result = result.substring(0, i) + "\u00A0" + result.substring(i); // Non-breaking space
        return result;
    }
    function queryHtml(query) {
        return queryElem(query, HTMLElement);
    }
    function queryElem(query, type) {
        let result = document.querySelector(query);
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
        let result = document.createElement(tagName);
        if (text !== undefined)
            result.textContent = text;
        return container.appendChild(result);
    }
})(app || (app = {}));
