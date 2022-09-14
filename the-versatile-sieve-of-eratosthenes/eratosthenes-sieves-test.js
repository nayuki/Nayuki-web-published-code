/*
 * Test of variants of the sieve of Eratosthenes (compiled from TypeScript)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */
"use strict";
/*---- Test suite ----*/
const TEST_SUITE_FUNCS = [
    function testValues() {
        assertArrayEquals(sievePrimeness(30), [false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false]);
        assertArrayEquals(sieveSmallestPrimeFactor(30), [0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2]);
        assertArrayEquals(sieveTotient(30), [0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8]);
        assertArrayEquals(sieveOmega(30), [0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3]);
        assertArrayEquals(sieveRadical(30), [0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30]);
    },
    function testPrefixConsistency() {
        const N = 3000;
        const FUNCS = [
            sievePrimeness,
            sieveSmallestPrimeFactor,
            sieveTotient,
            sieveOmega,
            sieveRadical,
        ];
        for (const func of FUNCS) {
            let prev = [];
            for (let i = 0; i < N; i++) {
                let cur = func(i);
                assertEquals(cur.length, prev.length + 1);
                assertArrayEquals(cur.slice(0, -1), prev);
                prev = cur;
            }
        }
    },
];
/*---- Helper definitions ----*/
function assertEquals(expect, actual) {
    if (actual !== expect)
        throw new Error("Assertion error");
}
function assertArrayEquals(expected, actual) {
    if (!(expected instanceof Array) || !(actual instanceof Array))
        throw new TypeError("Illegal argument");
    if (expected.length != actual.length)
        throw new Error("Array length mismatch");
    for (let i = 0; i < expected.length; i++)
        assertEquals(expected[i], actual[i]);
}
/*---- Main runner ----*/
(function () {
    let i = 0;
    function iterate() {
        let msg;
        if (i >= TEST_SUITE_FUNCS.length)
            msg = "Finished";
        else {
            msg = TEST_SUITE_FUNCS[i].name + "(): ";
            try {
                TEST_SUITE_FUNCS[i]();
                msg += "Pass";
            }
            catch (e) {
                msg += "Fail - " + e.message;
            }
            i++;
            setTimeout(iterate);
        }
        let li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("results").append(li);
    }
    iterate();
})();
