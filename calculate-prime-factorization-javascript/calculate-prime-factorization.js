/*
 * Calculate prime factorization (compiled from TypeScript)
 *
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-prime-factorization-javascript
 */
"use strict";
var app;
(function (app) {
    let container = queryHtml("article .program-container");
    let numberElem = queryInput("article .program-container #number");
    let previousInput = "";
    function initialize() {
        container.hidden = false;
        numberElem.focus();
    }
    setTimeout(initialize);
    function doRandom() {
        numberElem.value = Math.floor(Math.pow(1000000, Math.random()) + 2).toString();
        doCalculate();
    }
    app.doRandom = doRandom;
    /*
     * Handles the HTML input/output for factoring an integer.
     */
    function doCalculate() {
        // Don't factor if input text didn't change
        const numberText = numberElem.value;
        if (numberText == previousInput)
            return;
        previousInput = numberText;
        // Clear outputs
        let [primeListOut, primePowerListOut] = container.querySelectorAll("output");
        primeListOut.textContent = "";
        let sup = document.createElement("sup");
        sup.textContent = NBSP; // Use spaces to prevent layout shift
        primePowerListOut.replaceChildren(NBSP, sup);
        if (!/^-?\d+$/.test(numberText)) {
            primeListOut.textContent = "Not an integer";
            return;
        }
        const n = parseInt(numberText, 10);
        if (n < 2)
            primeListOut.textContent = "Number out of range (< 2)";
        else if (n >= 9007199254740992)
            primeListOut.textContent = "Number too large";
        else {
            // Main case
            const factors = calcPrimeFactorList(n);
            primeListOut.textContent = "= " + factors.join(` ${TIMES} `);
            const factorPowers = toFactorPowerList(factors);
            if (factorPowers.length < factors.length) {
                primePowerListOut.replaceChildren("= ");
                factorPowers.forEach(([base, exp], i) => {
                    if (i > 0)
                        primePowerListOut.append(` ${TIMES} `);
                    primePowerListOut.append(base.toString());
                    if (exp > 1) {
                        let sup = primePowerListOut.appendChild(document.createElement("sup"));
                        sup.textContent = exp.toString();
                    }
                });
            }
        }
    }
    app.doCalculate = doCalculate;
    /*
     * Returns the list of (not necessarily unique) prime factors
     * (in non-descending order) of the given integer. Examples:
     * - calcPrimeFactorList(1) = [].
     * - calcPrimeFactorList(7) = [7].
     * - calcPrimeFactorList(60) = [2, 2, 3, 5].
     */
    function calcPrimeFactorList(n) {
        if (n < 1)
            throw new RangeError("Number is less than 1");
        let result = [];
        while (n != 1) {
            const factor = calcSmallestFactor(n);
            result.push(factor);
            n /= factor;
        }
        return result;
    }
    /*
     * Returns the smallest prime factor of the given integer. Examples:
     * - calcSmallestFactor(2) = 2.
     * - calcSmallestFactor(9) = 3.
     * - calcSmallestFactor(35) = 5.
     */
    function calcSmallestFactor(n) {
        if (n < 2)
            throw new RangeError("Number is less than 2");
        if (n % 2 == 0)
            return 2;
        const end = Math.floor(Math.sqrt(n));
        for (let i = 3; i <= end; i += 2) {
            if (n % i == 0)
                return i;
        }
        return n;
    }
    /*
     * Given a non-empty list of non-descending numbers, this returns a list of
     * pairs where in each pair, the initial element is a unique number from
     * the input and the final element is the number of repeats. Examples:
     * - toFactorPowerList([2, 2, 2]) = [[2, 3]].
     * - toFactorPowerList([3, 5]) = [[3, 1], [5, 1]].
     */
    function toFactorPowerList(factors) {
        let result = [];
        let prevFactor = factors[0];
        let count = 1;
        for (const factor of factors.slice(1)) {
            if (factor == prevFactor)
                count++;
            else {
                result.push([prevFactor, count]);
                prevFactor = factor;
                count = 1;
            }
        }
        return result.concat([[prevFactor, count]]);
    }
    const TIMES = "\u00D7"; // Times sign
    const NBSP = "\u00A0"; // No-break space
})(app || (app = {}));
