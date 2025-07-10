/*
 * Hash calculator (compiled from TypeScript)
 *
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hash-calculator-javascript
 */
"use strict";
var app;
(function (app) {
    let container = queryHtml("article .program-container");
    let textRadio = queryInput("article .program-container #text-radio");
    let textTextarea = queryElem("article .program-container textarea", HTMLTextAreaElement);
    let textConversionSelect = queryElem("article .program-container select", HTMLSelectElement);
    let fileRadio = queryInput("article .program-container #file-radio");
    let fileInput = queryInput("article .program-container input[type=file]");
    let miscellaneousLengthInput = queryInput("article .program-container #miscellaneous-length");
    let miscellaneousSpeedInput = queryInput("article .program-container #miscellaneous-speed");
    let miscellaneousElapsedTimeInput = queryInput("article .program-container #miscellaneous-elapsed-time");
    let calculateButton = queryElem("article .program-container button", HTMLButtonElement);
    let outputEmptyElem = queryHtml("article .program-container p.output-empty");
    let outputTable = queryHtml("article .program-container table.output");
    let outputTheadTr = queryHtml("article .program-container table.output thead tr");
    let outputTbody = queryHtml("article .program-container table.output tbody");
    function initialize() {
        textTextarea.oninput = () => textRadio.checked = true;
        textConversionSelect.onchange = () => textRadio.checked = true;
        fileInput.onchange = () => fileRadio.checked = true;
        calculateButton.onclick = doCalculate;
        container.hidden = false;
    }
    setTimeout(initialize);
    let results = [];
    async function doCalculate() {
        let funcSet = new Set();
        for (const [func, inputName] of HASH_FUNCTIONS) {
            if (queryInput("article .program-container input#function-" + inputName).checked)
                funcSet.add(func);
        }
        if (textRadio.checked) {
        }
        if (fileRadio.checked) {
            const files = fileInput.files;
            if (files === null)
                throw new TypeError();
            for (const file of files)
                results.push(await doHash(funcSet, file.name, file.stream()));
        }
        let funcList = [];
        for (const [func, _] of HASH_FUNCTIONS) {
            for (const result of results) {
                if (result.hashes.has(func)) {
                    funcList.push(func);
                    break;
                }
            }
        }
        let headings = ["Description"];
        if (miscellaneousLengthInput.checked)
            headings.push("Length");
        for (const func of funcList)
            headings.push(func.getName());
        outputTheadTr.replaceChildren();
        if (miscellaneousSpeedInput.checked)
            headings.push("Speed");
        if (miscellaneousElapsedTimeInput.checked)
            headings.push("Elapsed");
        for (const s of headings) {
            let th = outputTheadTr.appendChild(document.createElement("th"));
            th.textContent = s;
        }
        outputTbody.replaceChildren();
        for (const result of results) {
            let tr = outputTbody.appendChild(document.createElement("tr"));
            let cells = [];
            cells.push([result.description, []]);
            if (miscellaneousLengthInput.checked)
                cells.push([result.lengthBytes.toString(), ["number"]]);
            for (const func of funcList) {
                const hash = result.hashes.get(func);
                cells.push([hash !== undefined ? Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("") : "", ["hash"]]);
            }
            if (miscellaneousSpeedInput.checked)
                cells.push([(result.elapsedTimeMs > 0 ? (result.lengthBytes / result.elapsedTimeMs / 1e3).toFixed(1) : "?") + "\u00A0MB/s", ["number"]]);
            if (miscellaneousElapsedTimeInput.checked)
                cells.push([(result.elapsedTimeMs / 1e3).toFixed(3) + "\u00A0s", ["number"]]);
            for (const [text, classes] of cells) {
                let td = tr.appendChild(document.createElement("td"));
                for (const cls of classes)
                    td.classList.add(cls);
                td.textContent = text;
            }
        }
        outputEmptyElem.hidden = true;
        outputTable.hidden = false;
    }
    async function doHash(funcs, description, stream) {
        let reader = stream.getReader();
        const startTime = performance.now();
        let length = 0;
        let hashers = new Map();
        for (const func of funcs)
            hashers.set(func, func.newHasher());
        while (true) {
            const item = await reader.read();
            if (item.done)
                break;
            const chunk = item.value;
            length += chunk.length;
            for (let hasher of hashers.values())
                hasher.update(chunk);
        }
        let hashes = new Map();
        for (let [func, hasher] of hashers.entries())
            hashes.set(func, hasher.getHashDestructively());
        return new Result(description, length, performance.now() - startTime, hashes);
    }
    class Result {
        constructor(description, lengthBytes, elapsedTimeMs, hashes) {
            this.description = description;
            this.lengthBytes = lengthBytes;
            this.elapsedTimeMs = elapsedTimeMs;
            this.hashes = hashes;
        }
    }
    const HASH_FUNCTIONS = [
        [hashlib.Crc32, "crc-32"],
    ];
})(app || (app = {}));
