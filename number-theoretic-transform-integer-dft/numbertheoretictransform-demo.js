/*
 * Number-theoretic transform demo (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */
"use strict";
var app;
(function (app) {
    { // Forward transform
        let inVecInput = getInput("forward-transform-input-vector");
        let minModInput = getInput("forward-transform-minimum-working-modulus");
        let rootInput = getInput("forward-transform-nth-root-of-unity");
        inVecInput.onkeydown = doCalculate;
        minModInput.onkeydown = doCalculate;
        rootInput.onkeydown = doCalculate;
        getHtml("forward-transform-calculate").onclick = doCalculate;
        function doCalculate(e) {
            if (e instanceof KeyboardEvent && e.key != "Enter")
                return;
            let vecLenElem = getHtml("forward-transform-vector-length");
            let modulusElem = getHtml("forward-transform-chosen-modulus");
            let rootElem = getHtml("forward-transform-chosen-nth-root-of-unity");
            let outVecElem = getHtml("forward-transform-output-vector");
            vecLenElem.textContent = "";
            modulusElem.textContent = "";
            rootElem.textContent = "";
            outVecElem.textContent = "";
            let vec;
            try {
                vec = parseVector(inVecInput.value);
                vecLenElem.textContent = vec.length.toString();
            }
            catch (e) {
                if (e instanceof Error)
                    vecLenElem.textContent = e.message;
                return;
            }
            let modulus;
            {
                let minMod;
                const s = minModInput.value;
                if (/^[0-9]+$/.test(s))
                    minMod = BigInt(s);
                else if (s == "")
                    minMod = max(vec) + 1n;
                else {
                    modulusElem.textContent = "Invalid number syntax";
                    return;
                }
                modulus = numbertheoretictransform.findModulus(vec.length, minMod);
                modulusElem.textContent = modulus.toString();
            }
            let root;
            {
                const s = rootInput.value;
                if (/^[0-9]+$/.test(s)) {
                    root = BigInt(s);
                    if (root >= modulus || !numbertheoretictransform.isPrimitiveRoot(root, BigInt(vec.length), modulus)) {
                        rootElem.textContent = "Invalid root of unity";
                        return;
                    }
                }
                else if (s == "")
                    root = numbertheoretictransform.findPrimitiveRoot(BigInt(vec.length), modulus - 1n, modulus);
                else {
                    rootElem.textContent = "Invalid number syntax";
                    return;
                }
                rootElem.textContent = root.toString();
            }
            vec = numbertheoretictransform.transform(vec, root, modulus);
            outVecElem.textContent = vectorToString(vec);
        }
    }
    { // Inverse transform
        let inVecInput = getInput("inverse-transform-input-vector");
        let minModInput = getInput("inverse-transform-minimum-working-modulus");
        let rootInput = getInput("inverse-transform-nth-root-of-unity");
        inVecInput.onkeydown = doCalculate;
        minModInput.onkeydown = doCalculate;
        rootInput.onkeydown = doCalculate;
        getHtml("inverse-transform-calculate").onclick = doCalculate;
        function doCalculate(e) {
            if (e instanceof KeyboardEvent && e.key != "Enter")
                return;
            let vecLenElem = getHtml("inverse-transform-vector-length");
            let modulusElem = getHtml("inverse-transform-chosen-modulus");
            let rootElem = getHtml("inverse-transform-chosen-nth-root-of-unity");
            let outVecElem0 = getHtml("inverse-transform-output-vector-unscaled");
            let outVecElem1 = getHtml("inverse-transform-output-vector-scaled");
            vecLenElem.textContent = "";
            modulusElem.textContent = "";
            rootElem.textContent = "";
            outVecElem0.textContent = "";
            outVecElem1.textContent = "";
            let vec;
            try {
                vec = parseVector(inVecInput.value);
                vecLenElem.textContent = vec.length.toString();
            }
            catch (e) {
                if (e instanceof Error)
                    vecLenElem.textContent = e.message;
                return;
            }
            let modulus;
            {
                let minMod;
                const s = minModInput.value;
                if (/^[0-9]+$/.test(s))
                    minMod = BigInt(s);
                else if (s == "")
                    minMod = max(vec) + 1n;
                else {
                    modulusElem.textContent = "Invalid number syntax";
                    return;
                }
                modulus = numbertheoretictransform.findModulus(vec.length, minMod);
                modulusElem.textContent = modulus.toString();
            }
            let root;
            {
                const s = rootInput.value;
                if (/^[0-9]+$/.test(s)) {
                    root = BigInt(s);
                    if (root >= modulus || !numbertheoretictransform.isPrimitiveRoot(root, BigInt(vec.length), modulus)) {
                        rootElem.textContent = "Invalid root of unity";
                        return;
                    }
                }
                else if (s == "")
                    root = numbertheoretictransform.findPrimitiveRoot(BigInt(vec.length), modulus - 1n, modulus);
                else {
                    rootElem.textContent = "Invalid number syntax";
                    return;
                }
                rootElem.textContent = root.toString();
            }
            vec = numbertheoretictransform.transform(vec, numbertheoretictransform.reciprocalMod(root, modulus), modulus);
            outVecElem0.textContent = vectorToString(vec);
            const scaler = numbertheoretictransform.reciprocalMod(BigInt(vec.length), modulus);
            outVecElem1.textContent = vectorToString(vec.map(x => x * scaler % modulus));
        }
    }
    { // Circular convolution
        let inVec0Input = getInput("circular-convolution-input-vector-0");
        let inVec1Input = getInput("circular-convolution-input-vector-1");
        let minModInput = getInput("circular-convolution-minimum-working-modulus");
        let rootInput = getInput("circular-convolution-nth-root-of-unity");
        inVec0Input.onkeydown = doCalculate;
        inVec1Input.onkeydown = doCalculate;
        minModInput.onkeydown = doCalculate;
        rootInput.onkeydown = doCalculate;
        getHtml("circular-convolution-calculate").onclick = doCalculate;
        function doCalculate(e) {
            if (e instanceof KeyboardEvent && e.key != "Enter")
                return;
            let vecLenElem = getHtml("circular-convolution-vector-length");
            let modulusElem = getHtml("circular-convolution-chosen-modulus");
            let rootElem = getHtml("circular-convolution-chosen-nth-root-of-unity");
            let transVec0Elem = getHtml("circular-convolution-transformed-vector-0");
            let transVec1Elem = getHtml("circular-convolution-transformed-vector-1");
            let multVecElem = getHtml("circular-convolution-pointwise-multiplied-vector");
            let outVecElem = getHtml("circular-convolution-output-vector");
            vecLenElem.textContent = "";
            modulusElem.textContent = "";
            rootElem.textContent = "";
            transVec0Elem.textContent = "";
            transVec1Elem.textContent = "";
            multVecElem.textContent = "";
            outVecElem.textContent = "";
            let vec0;
            let vec1;
            try {
                vec0 = parseVector(inVec0Input.value);
                vec1 = parseVector(inVec1Input.value);
                if (vec0.length != vec1.length)
                    throw new RangeError("Unequal vector lengths");
                vecLenElem.textContent = vec0.length.toString();
            }
            catch (e) {
                if (e instanceof Error)
                    vecLenElem.textContent = e.message;
                return;
            }
            let modulus;
            {
                let minMod;
                const s = minModInput.value;
                if (/^[0-9]+$/.test(s))
                    minMod = BigInt(s);
                else if (s == "") {
                    minMod = max(vec0.concat(vec1));
                    minMod = minMod * minMod * BigInt(vec0.length) + 1n;
                }
                else {
                    modulusElem.textContent = "Invalid number syntax";
                    return;
                }
                modulus = numbertheoretictransform.findModulus(vec0.length, minMod);
                modulusElem.textContent = modulus.toString();
            }
            let root;
            {
                const s = rootInput.value;
                if (/^[0-9]+$/.test(s)) {
                    root = BigInt(s);
                    if (root >= modulus || !numbertheoretictransform.isPrimitiveRoot(root, BigInt(vec0.length), modulus)) {
                        rootElem.textContent = "Invalid root of unity";
                        return;
                    }
                }
                else if (s == "")
                    root = numbertheoretictransform.findPrimitiveRoot(BigInt(vec0.length), modulus - 1n, modulus);
                else {
                    rootElem.textContent = "Invalid number syntax";
                    return;
                }
                rootElem.textContent = root.toString();
            }
            vec0 = numbertheoretictransform.transform(vec0, root, modulus);
            vec1 = numbertheoretictransform.transform(vec1, root, modulus);
            transVec0Elem.textContent = vectorToString(vec0);
            transVec1Elem.textContent = vectorToString(vec1);
            let vec = [];
            for (let i = 0; i < vec0.length; i++)
                vec.push(vec0[i] * vec1[i] % modulus);
            multVecElem.textContent = vectorToString(vec);
            vec = numbertheoretictransform.transform(vec, numbertheoretictransform.reciprocalMod(root, modulus), modulus);
            const scaler = numbertheoretictransform.reciprocalMod(BigInt(vec.length), modulus);
            outVecElem.textContent = vectorToString(vec.map(x => x * scaler % modulus));
        }
    }
    function parseVector(s) {
        {
            const m = /^\s*(.*?)\s*$/.exec(s);
            if (m === null)
                throw Error("Assertion error");
            s = m[1];
        }
        {
            const m = /^\[\s*(.*?)\s*\]$/.exec(s);
            if (m !== null)
                s = m[1];
        }
        if (s.includes(","))
            s = s.replace(/\s*,\s*/g, ",");
        else
            s = s.replace(/\s+/g, ",");
        let result = [];
        for (const v of s.split(",")) {
            if (!/^[0-9]+$/.test(v))
                throw RangeError("Invalid vector syntax");
            result.push(BigInt(v));
        }
        return result;
    }
    function max(vec) {
        if (vec.length == 0)
            throw new RangeError("Empty array");
        let result = vec[0];
        for (const x of vec) {
            if (x > result)
                result = x;
        }
        return result;
    }
    function vectorToString(vec) {
        return "[" + vec.join(", ") + "]";
    }
    function getElem(id, type) {
        const result = document.getElementById(id);
        if (result instanceof type)
            return result;
        else if (result === null)
            throw new Error("Element not found");
        else
            throw new TypeError("Invalid element type");
    }
    function getInput(id) {
        return getElem(id, HTMLInputElement);
    }
    function getHtml(id) {
        return getElem(id, HTMLElement);
    }
})(app || (app = {}));
