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
        let inputTbody = subqueryElem(root, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(root, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(root, ".output-message", HTMLElement);
        let statusElem = subqueryElem(root, "output", HTMLElement);
        let inputBits = [];
        let codewordBits = [];
        root.hidden = false;
        msgLenInput.oninput = paramsChanged;
        paramsChanged();
        function paramsChanged() {
            const msgLen = parseInt(msgLenInput.value, 10);
            resizeArray(inputBits, msgLen, 0);
            resizeArray(codewordBits, msgLen + 1, 0);
            visualizeLength(inputBits, inputChanged, null, inputTbody);
            const types = inputBits.map(_ => "data").concat(["parity"]);
            visualizeLength(codewordBits, codewordChanged, types, codewordTbody);
            visualizeLength(inputBits, null, null, outputTbody);
            inputChanged();
        }
        function inputChanged() {
            visualizeValues(inputBits, inputTbody);
            inputBits.forEach((x, i) => codewordBits[i] = x);
            codewordBits[codewordBits.length - 1] = calcParity(inputBits);
            codewordChanged();
        }
        function codewordChanged() {
            visualizeValues(codewordBits, codewordTbody);
            const outputBits = calcParity(codewordBits) == 0 ?
                codewordBits.slice(0, -1) : null;
            visualizeValues(outputBits, outputTbody);
            if (outputBits === null)
                statusElem.textContent = "Error";
            else if (areArraysEqual(outputBits, inputBits))
                statusElem.textContent = "Same message";
            else
                statusElem.textContent = "Different message";
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
        let inputTbody = subqueryElem(root, ".input-message", HTMLElement);
        let codewordTbody = subqueryElem(root, ".codeword", HTMLElement);
        let outputTbody = subqueryElem(root, ".output-message", HTMLElement);
        let statusElem = subqueryElem(root, "output", HTMLElement);
        let inputBits = [];
        let codewordBits = [];
        root.hidden = false;
        msgColsInput.oninput = paramsChanged;
        msgRowsInput.oninput = paramsChanged;
        paramsChanged();
        function paramsChanged() {
            const msgRows = parseInt(msgRowsInput.value, 10);
            const msgCols = parseInt(msgColsInput.value, 10);
            while (inputBits.length < msgRows)
                inputBits.push([]);
            inputBits.splice(msgRows, inputBits.length - msgRows);
            for (let row of inputBits)
                resizeArray(row, msgCols, 0);
            codewordBits.pop();
            while (codewordBits.length < msgRows)
                codewordBits.push([]);
            codewordBits.splice(msgRows, codewordBits.length - msgRows);
            for (let row of codewordBits)
                resizeArray(row, msgCols + 1, 0);
            let row = [];
            resizeArray(row, msgCols, 0);
            codewordBits.push(row);
            visualizeSize(inputBits, inputChanged, null, inputTbody);
            const types = codewordBits.map((row, i) => row.map((_, j) => i < codewordBits.length - 1 && j < row.length - 1 ? "data" : "parity"));
            visualizeSize(codewordBits, codewordChanged, types, codewordTbody);
            visualizeSize(inputBits, null, null, outputTbody);
            inputChanged();
        }
        function inputChanged() {
            visualizeValues(inputBits, inputTbody);
            let columnParities = codewordBits[codewordBits.length - 1];
            columnParities.forEach((_, i) => columnParities[i] = 0);
            inputBits.forEach((row, i) => {
                row.forEach((x, j) => {
                    codewordBits[i][j] = x;
                    columnParities[j] ^= x;
                });
                codewordBits[i][row.length] = calcParity(row);
            });
            codewordChanged();
        }
        function codewordChanged() {
            visualizeValues(codewordBits, codewordTbody);
            const rowParities = codewordBits.slice(0, -1).map(row => calcParity(row));
            let columnParities = [];
            for (let j = 0; j < codewordBits[0].length - 1; j++)
                columnParities.push(calcParity(codewordBits.map(row => row[j])));
            const rowFails = rowParities.reduce((x, y) => x + y, 0);
            const columnFails = columnParities.reduce((x, y) => x + y, 0);
            let outputBits = codewordBits.slice(0, -1).map(row => row.slice(0, -1));
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
            if (outputBits === null)
                statusElem.textContent = "Error";
            else if (outputBits.every((row, i) => areArraysEqual(row, inputBits[i])))
                statusElem.textContent = "Same message";
            else
                statusElem.textContent = "Different message";
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
