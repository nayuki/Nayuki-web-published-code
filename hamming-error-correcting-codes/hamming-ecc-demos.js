/*
 * Hamming error-correcting code (compiled from TypeScript)
 *
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hamming-error-correcting-codes
 */
"use strict";
var app;
(function (app) {
    class OneDimensionalCodeDemo {
        constructor(rootHtmlClass) {
            this.inputBits = [];
            this.sentCodewordBits = [];
            this.recvCodewordBits = [];
            this.outputBits = null;
            this.outputError = false;
            this.rootElem = queryHtml("article .demo." + rootHtmlClass);
            subqueryElem(this.rootElem, "tbody", HTMLElement).append(OneDimensionalCodeDemo.template.content.cloneNode(true));
            this.inputTbody = subqueryElem(this.rootElem, ".input-message", HTMLElement);
            this.codewordTbody = subqueryElem(this.rootElem, ".codeword", HTMLElement);
            this.changedElem = subqueryElem(this.rootElem, "output.bits-changed", HTMLElement);
            this.outputTbody = subqueryElem(this.rootElem, ".output-message", HTMLElement);
            this.errorElem = subqueryElem(this.rootElem, "output.detected-error", HTMLElement);
            this.matchesElem = subqueryElem(this.rootElem, "output.matches-input", HTMLElement);
            this.rootElem.hidden = false;
        }
        paramsChanged(msgLen, codeBitTypes) {
            resizeArray(this.inputBits, msgLen, 0);
            OneDimensionalCodeDemo.visualizeLength(this.inputBits, i => i, () => this.inputChanged(), null, this.inputTbody);
            resizeArray(this.sentCodewordBits, codeBitTypes.length, 0);
            resizeArray(this.recvCodewordBits, this.sentCodewordBits.length, 0);
            OneDimensionalCodeDemo.visualizeLength(this.recvCodewordBits, this.mapCodewordIndex, () => this.codewordChanged(), codeBitTypes, this.codewordTbody);
            OneDimensionalCodeDemo.visualizeLength(this.inputBits, i => i, null, null, this.outputTbody);
            this.inputChanged();
        }
        inputChanged() {
            OneDimensionalCodeDemo.visualizeValues(this.inputBits, this.inputTbody);
            this.sentCodewordBits.forEach((x, i) => this.recvCodewordBits[i] = x);
            this.codewordChanged();
        }
        codewordChanged() {
            OneDimensionalCodeDemo.visualizeValues(this.recvCodewordBits, this.codewordTbody);
            this.changedElem.textContent = this.recvCodewordBits.filter((x, i) => this.sentCodewordBits[i] != x).length.toString();
            OneDimensionalCodeDemo.visualizeValues(this.outputBits, this.outputTbody);
            this.errorElem.textContent = this.outputError ? "True" : "False";
            this.matchesElem.textContent = this.outputBits !== null && areArraysEqual(this.outputBits, this.inputBits) ? "True" : "False";
        }
        mapCodewordIndex(i) {
            return i;
        }
        static visualizeLength(bits, indexMapper, changeFunc, types, tbody) {
            let indexRow = subqueryElem(tbody, ":scope > tr:nth-child(1)", HTMLElement);
            let bitRow = subqueryElem(tbody, ":scope > tr:nth-child(2)", HTMLElement);
            let indexCells = Array.from(indexRow.querySelectorAll(":scope > td"));
            let bitCells = Array.from(bitRow.querySelectorAll(":scope > td"));
            while (indexCells.length > bits.length) {
                notUndefined(indexCells.pop()).remove();
                notUndefined(bitCells.pop()).remove();
            }
            while (indexCells.length < bits.length) {
                const i = indexCells.length;
                let td = addElem(indexRow, "td", indexMapper(i).toString());
                indexCells.push(td);
                td = addElem(bitRow, "td");
                bitCells.push(td);
                td.classList.add("bit");
                if (changeFunc !== null) {
                    let button = addElem(td, "button");
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
        static visualizeValues(bits, tbody) {
            tbody.classList.toggle("error", bits === null);
            tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
                let button = td.querySelector("button");
                (button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
            });
        }
    }
    OneDimensionalCodeDemo.template = queryElem("#one-dimensional-code-demo-input-output-rows", HTMLTemplateElement);
    class SimpleParityDemo extends OneDimensionalCodeDemo {
        constructor() {
            super("simple-parity");
            this.msgLenInput = subqueryElem(this.rootElem, "input", HTMLInputElement);
            this.codeLenOutput = subqueryElem(this.rootElem, "output.codeword-length", HTMLElement);
            const func = () => {
                const msgLen = parseInt(this.msgLenInput.value, 10);
                let types = [];
                for (let i = 0; i < msgLen; i++)
                    types.push("data");
                types.push("parity");
                this.paramsChanged(msgLen, types);
            };
            this.msgLenInput.oninput = func;
            func();
        }
        paramsChanged(msgLen, codeBitTypes) {
            this.codeLenOutput.textContent = codeBitTypes.length.toString();
            super.paramsChanged(msgLen, codeBitTypes);
        }
        inputChanged() {
            this.inputBits.forEach((x, i) => this.sentCodewordBits[i] = x);
            this.sentCodewordBits[this.sentCodewordBits.length - 1] = calcParity(this.inputBits);
            super.inputChanged();
        }
        codewordChanged() {
            this.outputBits = calcParity(this.recvCodewordBits) == 0 ?
                this.recvCodewordBits.slice(0, -1) : null;
            this.outputError = this.outputBits === null;
            super.codewordChanged();
        }
    }
    SimpleParityDemo.SINGLETON = new SimpleParityDemo();
    let gridParity;
    (function (gridParity) {
        let rootElem = queryHtml("article .demo.grid-parity");
        let msgRowsInput = subqueryElem(rootElem, "#grid-parity-message-rows", HTMLInputElement);
        let msgColsInput = subqueryElem(rootElem, "#grid-parity-message-columns", HTMLInputElement);
        let msgLenOutput = subqueryElem(rootElem, "output.message-length ", HTMLElement);
        let codeLenOutput = subqueryElem(rootElem, "output.codeword-length", HTMLElement);
        let inputTbody = subqueryElem(rootElem, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(rootElem, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(rootElem, ".output-message", HTMLElement);
        let changedElem = subqueryElem(rootElem, "output.bits-changed", HTMLElement);
        let errorElem = subqueryElem(rootElem, "output.detected-error", HTMLElement);
        let matchesElem = subqueryElem(rootElem, "output.matches-input", HTMLElement);
        let inputBits = [];
        let sentCodewordBits = [];
        let recvCodewordBits = [];
        rootElem.hidden = false;
        msgColsInput.oninput = paramsChanged;
        msgRowsInput.oninput = paramsChanged;
        paramsChanged();
        function paramsChanged() {
            const msgRows = parseInt(msgRowsInput.value, 10);
            const msgCols = parseInt(msgColsInput.value, 10);
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
            let row = [];
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
            const types = recvCodewordBits.map((row, i) => row.map((_, j) => i < recvCodewordBits.length - 1 && j < row.length - 1 ? "data" : "parity"));
            visualizeSize(recvCodewordBits, codewordChanged, types, codewordTbody);
            visualizeSize(inputBits, null, null, outputTbody);
            inputChanged();
        }
        function inputChanged() {
            visualizeValues(inputBits, inputTbody);
            let columnParities = sentCodewordBits[sentCodewordBits.length - 1];
            columnParities.forEach((_, i) => columnParities[i] = 0);
            inputBits.forEach((row, i) => {
                row.forEach((x, j) => {
                    sentCodewordBits[i][j] = x;
                    columnParities[j] ^= x;
                });
                sentCodewordBits[i][row.length] = calcParity(row);
            });
            sentCodewordBits.forEach((row, i) => row.forEach((x, j) => recvCodewordBits[i][j] = x));
            codewordChanged();
        }
        function codewordChanged() {
            visualizeValues(recvCodewordBits, codewordTbody);
            let changes = 0;
            sentCodewordBits.forEach((row, i) => {
                row.forEach((x, j) => {
                    if (recvCodewordBits[i][j] != x)
                        changes++;
                });
            });
            changedElem.textContent = changes.toString();
            const rowParities = recvCodewordBits.slice(0, -1).map(row => calcParity(row));
            let columnParities = [];
            for (let j = 0; j < recvCodewordBits[0].length - 1; j++)
                columnParities.push(calcParity(recvCodewordBits.map(row => row[j])));
            const rowFails = rowParities.reduce((x, y) => x + y, 0);
            const columnFails = columnParities.reduce((x, y) => x + y, 0);
            let outBits = recvCodewordBits.slice(0, -1).map(row => row.slice(0, -1));
            let outputBits = outBits;
            if (rowFails == 0 && columnFails == 0) {
            }
            else if (rowFails == 1) {
                const i = rowParities.findIndex(x => x == 1);
                columnParities.forEach((x, j) => {
                    if (x == 1)
                        outBits[i][j] ^= 1;
                });
            }
            else if (columnFails == 1) {
                const j = columnParities.findIndex(x => x == 1);
                rowParities.forEach((x, i) => {
                    if (x == 1)
                        outBits[i][j] ^= 1;
                });
            }
            else
                outputBits = null;
            visualizeValues(outputBits, outputTbody);
            errorElem.textContent = outputBits === null || rowFails > 0 || columnFails > 0 ? "True" : "False";
            matchesElem.textContent = outputBits !== null && outputBits.every((row, i) => areArraysEqual(row, inputBits[i])) ? "True" : "False";
        }
        function visualizeSize(bits, changeFunc, types, tbody) {
            let columnRow = subqueryElem(tbody, ":scope > tr:nth-child(1)", HTMLElement);
            let columnCells = Array.from(columnRow.querySelectorAll(":scope > td"));
            while (columnCells.length > bits[0].length)
                notUndefined(columnCells.pop()).remove();
            while (columnCells.length < bits[0].length) {
                let td = addElem(columnRow, "td", columnCells.length.toString());
                columnCells.push(td);
            }
            let bitRows = Array.from(tbody.querySelectorAll(":scope > tr:not(:first-child)"));
            while (bitRows.length > bits.length)
                notUndefined(bitRows.pop()).remove();
            while (bitRows.length < bits.length) {
                let tr = addElem(tbody, "tr");
                addElem(tr, "td", bitRows.length.toString());
                bitRows.push(tr);
            }
            bitRows.forEach((bitRow, i) => {
                let bitCells = Array.from(bitRow.querySelectorAll(":scope > td:not(:first-child)"));
                while (bitCells.length > bits[0].length)
                    notUndefined(bitCells.pop()).remove();
                while (bitCells.length < bits[0].length) {
                    let td = addElem(bitRow, "td");
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
                        let button = addElem(td, "button");
                        button.onclick = () => {
                            bits[i][j] ^= 1;
                            changeFunc();
                        };
                    }
                });
            });
        }
        function visualizeValues(bits, tbody) {
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
    })(gridParity || (gridParity = {}));
    class AlmostHammingDemo extends OneDimensionalCodeDemo {
        constructor() {
            super("almost-hamming");
            this.numParity = 0;
            this.msgLenInput = subqueryElem(this.rootElem, "input", HTMLInputElement);
            this.codeLenOutput = subqueryElem(this.rootElem, "output.codeword-length", HTMLElement);
            const func = () => {
                const msgLen = parseInt(this.msgLenInput.value, 10);
                this.numParity = 0;
                for (; 1 << this.numParity < msgLen; this.numParity++) { }
                let types = [];
                for (let i = 0; i < msgLen; i++)
                    types.push("data");
                for (let i = 0; i < this.numParity; i++)
                    types.push("parity");
                this.paramsChanged(msgLen, types);
            };
            this.msgLenInput.oninput = func;
            func();
        }
        paramsChanged(msgLen, codeBitTypes) {
            this.codeLenOutput.textContent = codeBitTypes.length.toString();
            super.paramsChanged(msgLen, codeBitTypes);
        }
        inputChanged() {
            this.inputBits.forEach((x, i) => this.sentCodewordBits[i] = x);
            for (let i = 0; i < this.numParity; i++)
                this.sentCodewordBits[this.inputBits.length + i] = calcParity(this.inputBits.filter((_, j) => (j & (1 << i)) != 0));
            super.inputChanged();
        }
        codewordChanged() {
            const msg = this.recvCodewordBits.slice(0, this.inputBits.length);
            let syndrome = 0;
            for (let i = 0; i < this.numParity; i++) {
                if (calcParity(msg.filter((_, j) => (j & (1 << i)) != 0)) != this.recvCodewordBits[msg.length + i])
                    syndrome += 1 << i;
            }
            if (syndrome < msg.length) {
                if (syndrome > 0)
                    msg[syndrome] ^= 1;
                this.outputBits = msg;
            }
            else
                this.outputBits = null;
            this.outputError = this.outputBits === null || syndrome != 0;
            super.codewordChanged();
        }
    }
    AlmostHammingDemo.SINGLETON = new AlmostHammingDemo();
    class HammingCodesDemo extends OneDimensionalCodeDemo {
        constructor() {
            super("hamming-codes");
            this.codeLenInput = subqueryElem(this.rootElem, "input", HTMLInputElement);
            this.msgLenOutput = subqueryElem(this.rootElem, "output.message-length", HTMLElement);
            const func = () => {
                const codeLen = parseInt(this.codeLenInput.value, 10);
                let numParity = 0;
                for (; 1 << numParity <= codeLen; numParity++) { }
                let types = [];
                for (let i = 0; i < codeLen; i++)
                    types.push(((i + 1) & i) != 0 ? "data" : "parity");
                this.paramsChanged(codeLen - numParity, types);
            };
            this.codeLenInput.oninput = func;
            func();
        }
        paramsChanged(msgLen, codeBitTypes) {
            this.msgLenOutput.textContent = msgLen.toString();
            super.paramsChanged(msgLen, codeBitTypes);
        }
        inputChanged() {
            let inputIndex = 0;
            this.sentCodewordBits.forEach((_, i) => {
                if (((i + 1) & i) != 0) {
                    this.sentCodewordBits[i] = this.inputBits[inputIndex];
                    inputIndex++;
                }
                else
                    this.sentCodewordBits[i] = 0;
            });
            this.sentCodewordBits.forEach((_, i) => {
                if (((i + 1) & i) == 0)
                    this.sentCodewordBits[i] = calcParity(this.sentCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0));
            });
            super.inputChanged();
        }
        codewordChanged() {
            let syndrome = 0;
            this.recvCodewordBits.forEach((x, i) => {
                if (((i + 1) & i) == 0 && calcParity(this.recvCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0)) != 0)
                    syndrome += i + 1;
            });
            if (syndrome <= this.recvCodewordBits.length) {
                let corrected = this.recvCodewordBits.slice();
                if (syndrome > 0)
                    corrected[syndrome - 1] ^= 1;
                this.outputBits = corrected.filter((_, i) => ((i + 1) & i) != 0);
            }
            else
                this.outputBits = null;
            this.outputError = this.outputBits === null || syndrome != 0;
            super.codewordChanged();
        }
        mapCodewordIndex(i) {
            return i + 1;
        }
    }
    HammingCodesDemo.SINGLETON = new HammingCodesDemo();
    function calcParity(bits) {
        return bits.reduce((x, y) => (x + y) % 2, 0);
    }
    function subqueryElem(root, query, type) {
        let result = root.querySelector(query);
        if (result instanceof type)
            return result;
        else if (result === null)
            throw new Error("Element not found");
        else
            throw new TypeError("Invalid element type");
    }
    function addElem(container, tagName, text) {
        let result = document.createElement(tagName);
        if (text !== undefined)
            result.textContent = text;
        container.append(result);
        return result;
    }
    function areArraysEqual(a, b) {
        return a.length == b.length && a.every((x, i) => x == b[i]);
    }
    function resizeArray(arr, newLen, fillVal) {
        while (arr.length < newLen)
            arr.push(fillVal);
        arr.splice(newLen, arr.length - newLen);
    }
    function notUndefined(val) {
        if (val === undefined)
            throw new TypeError();
        return val;
    }
})(app || (app = {}));
