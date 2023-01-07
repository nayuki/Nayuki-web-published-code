"use strict";
/*
 * SQLite database file visualizations
 *
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/sqlite-database-file-visualizations
 */
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
                throw new Error("Trying to read beyond end of file");
            let result = 0;
            for (let i = 0; i < numBytes; i++, readIndex++)
                result = (result << 8) | fileBytes[readIndex];
            return result >>> 0;
        }
        let cells = container.querySelectorAll("tbody td:nth-child(2)");
        let row = 0;
        let formatBytes = [];
        for (let i = 0; i < 16; i++)
            formatBytes.push(readUint(1));
        cells[row++].textContent = bytesToReadableString(formatBytes);
        let pageSize = readUint(2);
        if (pageSize == 1)
            pageSize = 65536;
        cells[row++].textContent = `${pageSize} bytes`;
        const READ_WRITE_VERSIONS = new Map([
            [1, "Legacy"],
            [2, "WAL"],
        ]);
        const writeVersion = readUint(1);
        cells[row++].textContent = `${READ_WRITE_VERSIONS.has(writeVersion) ? READ_WRITE_VERSIONS.get(writeVersion) : "Unknown"} (${writeVersion})`;
        const readVersion = readUint(1);
        cells[row++].textContent = `${READ_WRITE_VERSIONS.has(writeVersion) ? READ_WRITE_VERSIONS.get(readVersion) : "Unknown"} (${readVersion})`;
        const pageEndReservedSpace = readUint(1);
        cells[row++].textContent = `${pageEndReservedSpace} bytes`;
        const maxEmbeddedPayloadFraction = readUint(1);
        cells[row++].textContent = `${maxEmbeddedPayloadFraction}`;
        const minEmbeddedPayloadFraction = readUint(1);
        cells[row++].textContent = `${minEmbeddedPayloadFraction}`;
        const leafPayloadFraction = readUint(1);
        cells[row++].textContent = `${leafPayloadFraction}`;
        const fileChangeCounter = readUint(4);
        cells[row++].textContent = `${fileChangeCounter}`;
        const numPages = readUint(4);
        cells[row++].textContent = `${numPages} pages`;
        const firstFreelistTrunkPage = readUint(4);
        cells[row++].textContent = `${firstFreelistTrunkPage}`;
        const numFreelistPages = readUint(4);
        cells[row++].textContent = `${numFreelistPages}`;
        const schemaCookie = readUint(4);
        cells[row++].textContent = `${schemaCookie}`;
        const schemaFormat = readUint(4);
        cells[row++].textContent = `${schemaFormat}`;
        const defaultPageCacheSize = readUint(4);
        cells[row++].textContent = `${defaultPageCacheSize}`;
        const largestRootBtreePage = readUint(4);
        cells[row++].textContent = `${largestRootBtreePage}`;
        const TEXT_ENCODINGS = new Map([
            [1, "UTF-8"],
            [2, "UTF-16LE"],
            [3, "UTF-16BE"],
        ]);
        const textEncoding = readUint(4);
        cells[row++].textContent = `${TEXT_ENCODINGS.has(textEncoding) ? TEXT_ENCODINGS.get(textEncoding) : "Unknown"} (${textEncoding})`;
        const userVersion = readUint(4);
        cells[row++].textContent = `${userVersion}`;
        const incrementalVacuum = readUint(4);
        cells[row++].textContent = `${incrementalVacuum}`;
        const applicationId = readUint(4);
        cells[row++].textContent = `${applicationId}`;
        let reserved = [];
        for (let i = 0; i < 20; i++)
            reserved.push(readUint(1));
        cells[row++].textContent = reserved.map(b => b.toString(16).padStart(2, "0")).join(" ");
        const versionValidForNumber = readUint(4);
        cells[row++].textContent = `${versionValidForNumber}`;
        const sqliteVersionNumber = readUint(4);
        cells[row++].textContent = `${Math.floor(sqliteVersionNumber / 1000000)}.${Math.floor(sqliteVersionNumber / 1000) % 1000}.${sqliteVersionNumber % 1000} (${sqliteVersionNumber})`;
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
