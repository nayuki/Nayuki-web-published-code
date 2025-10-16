/*
 * GCD calculator (compiled from TypeScript)
 *
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-gcd-javascript
 */
"use strict";
var app;
(function (app) {
    let container = queryHtml("article .program-container");
    let inputAElem = queryInput("article .program-container #number-a");
    let inputBElem = queryInput("article .program-container #number-b");
    function initialize() {
        container.hidden = false;
        inputAElem.focus();
    }
    setTimeout(initialize);
    /*---- Entry points from HTML page ----*/
    function doCalculate() {
        // Clear outputs
        let gcdOut = queryHtml("article .program-container output.gcd");
        let lcmOut = queryHtml("article .program-container output.lcm");
        let eeaOut = queryHtml("article .program-container output.eea tbody");
        gcdOut.textContent = "";
        lcmOut.textContent = "";
        eeaOut.replaceChildren();
        // Handle inputs
        const aStr = inputAElem.value;
        const bStr = inputBElem.value;
        if (aStr == "" || bStr == "")
            return;
        let a;
        let b;
        try {
            a = BigInt(aStr);
            b = BigInt(bStr);
            if (a < 0n || b < 0n)
                throw new RangeError();
        }
        catch {
            gcdOut.textContent = "Input needs to be positive integer or zero";
            return;
        }
        function addRow(i, q, r, x, y) {
            let tr = eeaOut.appendChild(document.createElement("tr"));
            for (const val of [i, q, "|", x, "\u00D7", a, "+", y, "\u00D7", b, "=", r]) {
                let td = tr.appendChild(document.createElement("td"));
                td.textContent = val.toString().replace(/-/, "\u2212");
            }
        }
        // Calculate and render
        let r0 = a, x0 = 1n, y0 = 0n;
        let r1 = b, x1 = 0n, y1 = 1n;
        addRow(0, 0n, r0, x0, y0);
        addRow(1, 0n, r1, x1, y1);
        for (let i = 2; r1 != 0n; i++) {
            const q2 = r0 / r1;
            const r2 = r0 % r1;
            const x2 = x0 - q2 * x1;
            const y2 = y0 - q2 * y1;
            addRow(i, q2, r2, x2, y2);
            r0 = r1;
            x0 = x1;
            y0 = y1;
            r1 = r2;
            x1 = x2;
            y1 = y2;
        }
        gcdOut.textContent = r0.toString();
        lcmOut.textContent = a != 0n && b != 0n ? (a / r0 * b).toString() : "N/A";
    }
    app.doCalculate = doCalculate;
    let numRandomClicked = 0;
    function doRandom() {
        numRandomClicked++;
        const limit = numRandomClicked / 10;
        const len = Math.floor(Math.random() * limit) + 1;
        for (let elem of [inputAElem, inputBElem]) {
            let s = "";
            for (let i = 0; i < len; i++)
                s += Math.floor(Math.random() * 10);
            elem.value = s.replace(/^0+(.)/g, "$1");
        }
        doCalculate();
    }
    app.doRandom = doRandom;
})(app || (app = {}));
