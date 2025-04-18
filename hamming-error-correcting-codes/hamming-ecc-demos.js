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
    let simpleParity;
    (function (simpleParity) {
        let root = queryHtml("article .demo.simple-parity");
        let msgLenInput = subqueryElem(root, "input", HTMLInputElement);
        let codeLenOutput = subqueryElem(root, "output.codeword-length", HTMLElement);
        let inputTbody = subqueryElem(root, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(root, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(root, ".output-message", HTMLElement);
        let changedElem = subqueryElem(root, "output.bits-changed", HTMLElement);
        let errorElem = subqueryElem(root, "output.detected-error", HTMLElement);
        let matchesElem = subqueryElem(root, "output.matches-input", HTMLElement);
        let inputBits = [];
        let sentCodewordBits = [];
        let recvCodewordBits = [];
        root.hidden = false;
        msgLenInput.oninput = paramsChanged;
        paramsChanged();
        function paramsChanged() {
            const msgLen = parseInt(msgLenInput.value, 10);
            resizeArray(inputBits, msgLen, 0);
            codeLenOutput.textContent = (msgLen + 1).toString();
            resizeArray(sentCodewordBits, msgLen + 1, 0);
            resizeArray(recvCodewordBits, sentCodewordBits.length, 0);
            visualizeLength(inputBits, inputChanged, null, inputTbody);
            const types = inputBits.map(_ => "data").concat(["parity"]);
            visualizeLength(recvCodewordBits, codewordChanged, types, codewordTbody);
            visualizeLength(inputBits, null, null, outputTbody);
            inputChanged();
        }
        function inputChanged() {
            visualizeValues(inputBits, inputTbody);
            inputBits.forEach((x, i) => sentCodewordBits[i] = x);
            sentCodewordBits[sentCodewordBits.length - 1] = calcParity(inputBits);
            sentCodewordBits.forEach((x, i) => recvCodewordBits[i] = x);
            codewordChanged();
        }
        function codewordChanged() {
            visualizeValues(recvCodewordBits, codewordTbody);
            const outputBits = calcParity(recvCodewordBits) == 0 ?
                recvCodewordBits.slice(0, -1) : null;
            changedElem.textContent = recvCodewordBits.filter((x, i) => sentCodewordBits[i] != x).length.toString();
            visualizeValues(outputBits, outputTbody);
            errorElem.textContent = outputBits === null ? "True" : "False";
            matchesElem.textContent = outputBits !== null && areArraysEqual(outputBits, inputBits) ? "True" : "False";
        }
        function visualizeLength(bits, changeFunc, types, tbody) {
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
                let td = addElem(indexRow, "td", i.toString());
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
        function visualizeValues(bits, tbody) {
            tbody.classList.toggle("error", bits === null);
            tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
                let button = td.querySelector("button");
                (button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
            });
        }
    })(simpleParity || (simpleParity = {}));
    let gridParity;
    (function (gridParity) {
        let root = queryHtml("article .demo.grid-parity");
        let msgRowsInput = subqueryElem(root, "#grid-parity-message-rows", HTMLInputElement);
        let msgColsInput = subqueryElem(root, "#grid-parity-message-columns", HTMLInputElement);
        let msgLenOutput = subqueryElem(root, "output.message-length ", HTMLElement);
        let codeLenOutput = subqueryElem(root, "output.codeword-length", HTMLElement);
        let inputTbody = subqueryElem(root, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(root, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(root, ".output-message", HTMLElement);
        let changedElem = subqueryElem(root, "output.bits-changed", HTMLElement);
        let errorElem = subqueryElem(root, "output.detected-error", HTMLElement);
        let matchesElem = subqueryElem(root, "output.matches-input", HTMLElement);
        let inputBits = [];
        let sentCodewordBits = [];
        let recvCodewordBits = [];
        root.hidden = false;
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
            let outputBits = recvCodewordBits.slice(0, -1).map(row => row.slice(0, -1));
            if (rowFails == 0 && columnFails == 0) {
            }
            else if (rowFails == 1) {
                const i = rowParities.findIndex(x => x == 1);
                columnParities.forEach((x, j) => {
                    if (x == 1)
                        notNull(outputBits)[i][j] ^= 1;
                });
            }
            else if (columnFails == 1) {
                const j = columnParities.findIndex(x => x == 1);
                rowParities.forEach((x, i) => {
                    if (x == 1)
                        notNull(outputBits)[i][j] ^= 1;
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
    let almostHamming;
    (function (almostHamming) {
        let root = queryHtml("article .demo.almost-hamming");
        let msgLenInput = subqueryElem(root, "input", HTMLInputElement);
        let codeLenOutput = subqueryElem(root, "output.codeword-length", HTMLElement);
        let inputTbody = subqueryElem(root, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(root, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(root, ".output-message", HTMLElement);
        let changedElem = subqueryElem(root, "output.bits-changed", HTMLElement);
        let errorElem = subqueryElem(root, "output.detected-error", HTMLElement);
        let matchesElem = subqueryElem(root, "output.matches-input", HTMLElement);
        let inputBits = [];
        let sentCodewordBits = [];
        let recvCodewordBits = [];
        root.hidden = false;
        msgLenInput.oninput = paramsChanged;
        paramsChanged();
        function paramsChanged() {
            const msgLen = parseInt(msgLenInput.value, 10);
            resizeArray(inputBits, msgLen, 0);
            let numParity = 0;
            for (; 1 << numParity < msgLen; numParity++) { }
            const codeLen = msgLen + numParity;
            codeLenOutput.textContent = codeLen.toString();
            resizeArray(sentCodewordBits, codeLen, 0);
            resizeArray(recvCodewordBits, sentCodewordBits.length, 0);
            visualizeLength(inputBits, inputChanged, null, inputTbody);
            const types = recvCodewordBits.map((_, i) => i < msgLen ? "data" : "parity");
            visualizeLength(recvCodewordBits, codewordChanged, types, codewordTbody);
            visualizeLength(inputBits, null, null, outputTbody);
            inputChanged();
        }
        function inputChanged() {
            visualizeValues(inputBits, inputTbody);
            inputBits.forEach((x, i) => sentCodewordBits[i] = x);
            const numParity = sentCodewordBits.length - inputBits.length;
            for (let i = 0; i < numParity; i++)
                sentCodewordBits[inputBits.length + i] = calcParity(inputBits.filter((_, j) => (j & (1 << i)) != 0));
            sentCodewordBits.forEach((x, i) => recvCodewordBits[i] = x);
            codewordChanged();
        }
        function codewordChanged() {
            visualizeValues(recvCodewordBits, codewordTbody);
            changedElem.textContent = recvCodewordBits.filter((x, i) => sentCodewordBits[i] != x).length.toString();
            const msg = recvCodewordBits.slice(0, inputBits.length);
            let syndrome = 0;
            const numParity = recvCodewordBits.length - inputBits.length;
            for (let i = 0; i < numParity; i++) {
                if (calcParity(msg.filter((_, j) => (j & (1 << i)) != 0)) != recvCodewordBits[msg.length + i])
                    syndrome += 1 << i;
            }
            let outputBits;
            if (syndrome < msg.length) {
                if (syndrome > 0)
                    msg[syndrome] ^= 1;
                outputBits = msg;
            }
            else
                outputBits = null;
            visualizeValues(outputBits, outputTbody);
            errorElem.textContent = outputBits === null || syndrome != 0 ? "True" : "False";
            matchesElem.textContent = outputBits !== null && areArraysEqual(outputBits, inputBits) ? "True" : "False";
        }
        function visualizeLength(bits, changeFunc, types, tbody) {
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
                let td = addElem(indexRow, "td", i.toString());
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
        function visualizeValues(bits, tbody) {
            tbody.classList.toggle("error", bits === null);
            tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
                let button = td.querySelector("button");
                (button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
            });
        }
    })(almostHamming || (almostHamming = {}));
    let hammingCodes;
    (function (hammingCodes) {
        let root = queryHtml("article .demo.hamming-codes");
        let msgLenOutput = subqueryElem(root, "output.message-length", HTMLElement);
        let codeLenInput = subqueryElem(root, "input", HTMLInputElement);
        let inputTbody = subqueryElem(root, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(root, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(root, ".output-message", HTMLElement);
        let changedElem = subqueryElem(root, "output.bits-changed", HTMLElement);
        let errorElem = subqueryElem(root, "output.detected-error", HTMLElement);
        let matchesElem = subqueryElem(root, "output.matches-input", HTMLElement);
        let inputBits = [];
        let sentCodewordBits = [];
        let recvCodewordBits = [];
        root.hidden = false;
        codeLenInput.oninput = paramsChanged;
        paramsChanged();
        function paramsChanged() {
            const codeLen = parseInt(codeLenInput.value, 10);
            let numParity = 0;
            for (; 1 << numParity <= codeLen; numParity++) { }
            const msgLen = codeLen - numParity;
            msgLenOutput.textContent = msgLen.toString();
            resizeArray(inputBits, msgLen, 0);
            resizeArray(sentCodewordBits, codeLen, 0);
            resizeArray(recvCodewordBits, sentCodewordBits.length, 0);
            visualizeLength(inputBits, inputChanged, null, inputTbody);
            const types = recvCodewordBits.map((_, i) => ((i + 1) & i) != 0 ? "data" : "parity");
            visualizeLength(recvCodewordBits, codewordChanged, types, codewordTbody);
            visualizeLength(inputBits, null, null, outputTbody);
            inputChanged();
        }
        function inputChanged() {
            visualizeValues(inputBits, inputTbody);
            let inputIndex = 0;
            sentCodewordBits.forEach((_, i) => {
                if (((i + 1) & i) != 0) {
                    sentCodewordBits[i] = inputBits[inputIndex];
                    inputIndex++;
                }
                else
                    sentCodewordBits[i] = 0;
            });
            sentCodewordBits.forEach((_, i) => {
                if (((i + 1) & i) == 0)
                    sentCodewordBits[i] = calcParity(sentCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0));
            });
            sentCodewordBits.forEach((x, i) => recvCodewordBits[i] = x);
            codewordChanged();
        }
        function codewordChanged() {
            visualizeValues(recvCodewordBits, codewordTbody);
            changedElem.textContent = recvCodewordBits.filter((x, i) => sentCodewordBits[i] != x).length.toString();
            let syndrome = 0;
            recvCodewordBits.forEach((x, i) => {
                if (((i + 1) & i) == 0 && calcParity(recvCodewordBits.filter((_, j) => ((j + 1) & (i + 1)) != 0)) != 0)
                    syndrome += i + 1;
            });
            let outputBits;
            if (syndrome <= recvCodewordBits.length) {
                let corrected = recvCodewordBits.slice();
                if (syndrome > 0)
                    corrected[syndrome - 1] ^= 1;
                outputBits = corrected.filter((_, i) => ((i + 1) & i) != 0);
            }
            else
                outputBits = null;
            visualizeValues(outputBits, outputTbody);
            errorElem.textContent = outputBits === null || syndrome != 0 ? "True" : "False";
            matchesElem.textContent = outputBits !== null && areArraysEqual(outputBits, inputBits) ? "True" : "False";
        }
        function visualizeLength(bits, changeFunc, types, tbody) {
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
                let td = addElem(indexRow, "td", (i + 1).toString());
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
        function visualizeValues(bits, tbody) {
            tbody.classList.toggle("error", bits === null);
            tbody.querySelectorAll(":scope > tr:nth-child(2) > td").forEach((td, i) => {
                let button = td.querySelector("button");
                (button === null ? td : button).textContent = bits !== null ? bits[i].toString() : "\u2012";
            });
        }
    })(hammingCodes || (hammingCodes = {}));
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
    function notNull(val) {
        if (val === null)
            throw new TypeError();
        return val;
    }
    function notUndefined(val) {
        if (val === undefined)
            throw new TypeError();
        return val;
    }
})(app || (app = {}));
