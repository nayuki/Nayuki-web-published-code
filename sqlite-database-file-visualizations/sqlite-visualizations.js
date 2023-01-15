/*
 * SQLite database file visualizations (compiled from TypeScript)
 *
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/sqlite-database-file-visualizations
 */
"use strict";
/*---- File header ----*/
(function () {
    let container = queryHtml("article section.file-header");
    let fileElem = subqueryElem(container, "input", HTMLInputElement);
    let tableElem = subqueryElem(container, "table", HTMLElement);
    fileElem.onchange = async () => {
        const files = fileElem.files;
        if (files === null || files.length < 1)
            return;
        let reader = new FileReader();
        const arrayBuf = await new Promise(resolve => {
            reader.onload = () => {
                const temp = reader.result;
                if (!(temp instanceof ArrayBuffer))
                    throw new TypeError();
                resolve(temp);
            };
            reader.readAsArrayBuffer(files[0]);
        });
        visualize(arrayBuf);
    };
    function visualize(fileArray) {
        const fileBytes = new Uint8Array(fileArray);
        let readIndex = 0;
        function readUint(numBytes) {
            if (numBytes > fileBytes.length - readIndex)
                return null;
            let result = 0;
            for (let i = 0; i < numBytes; i++, readIndex++)
                result = (result << 8) | fileBytes[readIndex];
            return result >>> 0;
        }
        let interpretedValues = container.querySelectorAll("tbody td:nth-child(2)");
        let errorMessages = container.querySelectorAll("tbody td:nth-child(3)");
        for (let cell of [...interpretedValues, ...errorMessages])
            cell.textContent = "";
        let row = 0;
        let formatBytes = [];
        for (let i = 0; i < 16; i++) {
            const b = readUint(1);
            if (b === null)
                break;
            formatBytes.push(b);
        }
        interpretedValues[row].textContent = bytesToReadableString(formatBytes);
        if (formatBytes.length < 16) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        else if (String.fromCharCode.apply(null, formatBytes) != "SQLite format 3\0") {
            errorMessages[row].textContent = "Unrecognized value";
            return;
        }
        row++;
        let pageSize = readUint(2);
        if (pageSize === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        if (pageSize == 1)
            pageSize = 65536;
        if ((pageSize & (pageSize - 1)) != 0)
            errorMessages[row].textContent = "Not a power of 2";
        else if (pageSize < 512)
            errorMessages[row].textContent = "Too small";
        interpretedValues[row++].textContent = `${pageSize} bytes`;
        const READ_WRITE_VERSIONS = new Map([
            [1, "Legacy"],
            [2, "WAL"],
        ]);
        const writeVersion = readUint(1);
        if (writeVersion === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        if (!READ_WRITE_VERSIONS.has(writeVersion))
            errorMessages[row].textContent = "Unrecognized value";
        interpretedValues[row++].textContent = `${READ_WRITE_VERSIONS.has(writeVersion) ? READ_WRITE_VERSIONS.get(writeVersion) : "Unknown"} (${writeVersion})`;
        const readVersion = readUint(1);
        if (readVersion === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        if (!READ_WRITE_VERSIONS.has(readVersion))
            errorMessages[row].textContent = "Unrecognized value";
        interpretedValues[row++].textContent = `${READ_WRITE_VERSIONS.has(readVersion) ? READ_WRITE_VERSIONS.get(readVersion) : "Unknown"} (${readVersion})`;
        const pageEndReservedSpace = readUint(1);
        if (pageEndReservedSpace === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        if (pageSize - pageEndReservedSpace < 480)
            errorMessages[row].textContent = "Too large";
        interpretedValues[row++].textContent = `${pageEndReservedSpace} bytes`;
        const maxEmbeddedPayloadFraction = readUint(1);
        if (maxEmbeddedPayloadFraction === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        else if (maxEmbeddedPayloadFraction != 64)
            errorMessages[row].textContent = "Must be 64";
        interpretedValues[row++].textContent = `${maxEmbeddedPayloadFraction}`;
        const minEmbeddedPayloadFraction = readUint(1);
        if (minEmbeddedPayloadFraction === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        else if (minEmbeddedPayloadFraction != 32)
            errorMessages[row].textContent = "Must be 32";
        interpretedValues[row++].textContent = `${minEmbeddedPayloadFraction}`;
        const leafPayloadFraction = readUint(1);
        if (leafPayloadFraction === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        else if (leafPayloadFraction != 32)
            errorMessages[row].textContent = "Must be 32";
        interpretedValues[row++].textContent = `${leafPayloadFraction}`;
        const fileChangeCounter = readUint(4);
        if (fileChangeCounter === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${fileChangeCounter}`;
        const numPages = readUint(4);
        if (numPages === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${numPages} pages`;
        const firstFreelistTrunkPage = readUint(4);
        if (firstFreelistTrunkPage === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = firstFreelistTrunkPage != 0 ? firstFreelistTrunkPage.toString() : "None (0)";
        const numFreelistPages = readUint(4);
        if (numFreelistPages === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${numFreelistPages}`;
        const schemaCookie = readUint(4);
        if (schemaCookie === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${schemaCookie}`;
        const schemaFormat = readUint(4);
        if (schemaFormat === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        if (!(1 <= schemaFormat && schemaFormat <= 4))
            errorMessages[row].textContent = "Unrecognized value";
        interpretedValues[row++].textContent = `${schemaFormat}`;
        const defaultPageCacheSize = readUint(4);
        if (defaultPageCacheSize === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${defaultPageCacheSize}`;
        const largestRootBtreePage = readUint(4);
        if (largestRootBtreePage === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${largestRootBtreePage}`;
        const TEXT_ENCODINGS = new Map([
            [1, "UTF-8"],
            [2, "UTF-16LE"],
            [3, "UTF-16BE"],
        ]);
        const textEncoding = readUint(4);
        if (textEncoding === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        if (!TEXT_ENCODINGS.has(textEncoding))
            errorMessages[row].textContent = "Unrecognized value";
        interpretedValues[row++].textContent = `${TEXT_ENCODINGS.has(textEncoding) ? TEXT_ENCODINGS.get(textEncoding) : "Unknown"} (${textEncoding})`;
        const userVersion = readUint(4);
        if (userVersion === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${userVersion}`;
        const incrementalVacuum = readUint(4);
        if (incrementalVacuum === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${incrementalVacuum}`;
        const applicationId = readUint(4);
        if (applicationId === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${applicationId}`;
        let reserved = [];
        for (let i = 0; i < 20; i++) {
            const b = readUint(1);
            if (b === null)
                break;
            reserved.push(b);
        }
        interpretedValues[row].textContent = reserved.map(b => b.toString(16).padStart(2, "0")).join(" ");
        if (reserved.length < 20) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        else if (reserved.some(b => b != 0))
            errorMessages[row].textContent = "Must be all zeros";
        row++;
        const versionValidForNumber = readUint(4);
        if (versionValidForNumber === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${versionValidForNumber}`;
        const sqliteVersionNumber = readUint(4);
        if (sqliteVersionNumber === null) {
            errorMessages[row].textContent = "Premature end of file";
            return;
        }
        interpretedValues[row++].textContent = `${Math.floor(sqliteVersionNumber / 1000000)}.${Math.floor(sqliteVersionNumber / 1000) % 1000}.${sqliteVersionNumber % 1000} (${sqliteVersionNumber})`;
    }
    function bytesToReadableString(bytes) {
        let result = "";
        for (const b of bytes) {
            let cc = b;
            if (b < 0x20)
                cc += 0x2400;
            else if (b == 0x7F)
                cc = 0x2421;
            else if (0x80 <= b && b < 0xA0)
                cc = 0x25AF;
            result += String.fromCodePoint(cc);
        }
        return result;
    }
})();
/*---- Shared utilities ----*/
function queryHtml(query) {
    return subqueryElem(document, query, HTMLElement);
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
