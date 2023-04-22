/* 
 * Knuth's -yllion number notation demo (TypeScript)
 * 
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/knuths-yllion-number-notation
 */


namespace app {
	
	let numberInput = document.querySelector("article input#number") as HTMLInputElement;
	let conventionalEnglishGroupingOutput = document.querySelector("article output#conventional-english-grouping") as HTMLElement;
	let conventionalEnglishNotationOutput = document.querySelector("article output#conventional-english-notation") as HTMLElement;
	let yllionGroupingOutput              = document.querySelector("article output#yllion-grouping              ") as HTMLElement;
	let yllionEnglishOutput               = document.querySelector("article output#yllion-english               ") as HTMLElement;
	let yllionChineseOutput               = document.querySelector("article output#yllion-chinese               ") as HTMLElement;
	
	
	function update(): void {
		conventionalEnglishGroupingOutput.textContent = "";
		conventionalEnglishNotationOutput.textContent = "";
		yllionGroupingOutput             .textContent = "";
		yllionEnglishOutput              .textContent = "";
		yllionChineseOutput              .textContent = "";
		const number: bigint = BigInt(numberInput.value);
		conventionalEnglishGroupingOutput.textContent = ConventionalEnglishNotation.toStringWithCommas    (number);
		yllionGroupingOutput             .textContent = YllionEnglishNotation      .toStringWithSeparators(number);
		yllionEnglishOutput              .textContent = YllionEnglishNotation      .numberToWords         (number);
		yllionChineseOutput              .textContent = YllionChineseNotation      .numberToWords         (number);
		conventionalEnglishNotationOutput.textContent = ConventionalEnglishNotation.numberToWords         (number);
	}
	
	setTimeout(update);
	
	numberInput.oninput = update;
	
	
	
	/*---- Submodules for different number formats ----*/
	
	// See https://en.wikipedia.org/wiki/English_numerals .
	class ConventionalEnglishNotation {
		
		// For example: numberToWords(1234567) -> "one million two hundred thirty-four thousand five hundred sixty-seven".
		static numberToWords(n: bigint): string {
			// Simple cases
			if (n < 0n)
				return "negative " + ConventionalEnglishNotation.numberToWords(-n);
			else if (n == 0n)
				return "zero";
			
			// 1 <= n <= 999
			else if (n < 1000n) {
				let s: string = "";
				if (n >= 100n) {
					s += ConventionalEnglishNotation.ONES[Number(n / 100n)] + " hundred";
					if (n % 100n != 0n)
						s += " ";
					n %= 100n;
				}
				s += ConventionalEnglishNotation.TENS[Number(n / 10n)];
				if (n < 20n)
					s += ConventionalEnglishNotation.ONES[Number(n)];
				else if (n % 10n != 0n)
					s += "-" + ConventionalEnglishNotation.ONES[Number(n % 10n)];
				return s;
			}
			
			else {  // n >= 1000
				let parts: Array<String> = [];
				for (const illion of ConventionalEnglishNotation.ILLIONS) {
					if (n == 0n)
						break;
					const rem: bigint = n % 1000n;
					if (rem > 0n)
						parts.push(ConventionalEnglishNotation.numberToWords(rem) + (illion != "" ? " " + illion : ""));
					n /= 1000n;
				}
				if (n != 0n)
					throw new Error("Number too large");
				parts.reverse();
				return parts.join(" ");
			}
		}
		
		
		// For example: toStringWithCommas(-123456789) -> "-123,456,798".
		static toStringWithCommas(n: bigint): string {
			if (n < 0n)
				return "-" + ConventionalEnglishNotation.toStringWithCommas(-n);
			else {
				let s: string = n.toString();
				for (let i = s.length - 3; i > 0; i -= 3)
					s = s.substring(0, i) + "," + s.substring(i);
				return s;
			}
		}
		
		
		static ONES: Array<string> = [
			"", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
			"ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
		
		static TENS: Array<string> = [
			"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
		
		static ILLIONS: Array<string> = [
			"", "thousand", "million", "billion", "trillion", "quadrillion",
			"quintillion", "sextillion", "septillion", "octillion", "nonillion",
			"decillion", "undecillion", "duodecillion", "tredecillion", "quattuordecillion",
			"quindecillion", "sexdecillion", "septendecillion", "octodecillion", "novemdecillion",
			"vigintillion"];
		
	}
	
	
	
	// Donald Knuth's system; see https://en.wikipedia.org/wiki/-yllion .
	class YllionEnglishNotation {
		
		static numberToWords(n: bigint): string {
			if (n < 0n)
				return "negative " + YllionChineseNotation.numberToWords(-n);
			// 0 <= n <= 99, borrow functionality from another class
			else if (n < 100n)
				return ConventionalEnglishNotation.numberToWords(n);
			
			else {  // n >= 100
				const temp: string = n.toString();
				const yllionsLen: number = YllionEnglishNotation.YLLIONS.length;
				if (temp.length > (1 << yllionsLen))
					throw new RangeError("Number too large");
				for (let i = yllionsLen - 1; i >= 1; i--) {
					if (temp.length > (1 << i)) {
						const split: number = temp.length - (1 << i);
						const high: bigint = BigInt(temp.substring(0, split));
						const low: bigint = BigInt(temp.substring(split));
						return (high > 0n ? YllionEnglishNotation.numberToWords(high) + " " + YllionEnglishNotation.YLLIONS[i] : "") +
							(high > 0n && low > 0n ? " " : "") +
							(low > 0n ? YllionEnglishNotation.numberToWords(low) : "");
					}
				}
				throw new Error("Unreachable value");
			}
		}
		
		
		// For example: toStringWithSeparators(12345678901234567890) -> "1234:5678,9012;3456,7890".
		static toStringWithSeparators(n: bigint): string {
			if (n < 0n)
				return "-" + YllionEnglishNotation.toStringWithSeparators(-n);
			else {
				let s: string = n.toString();
				for (let i = s.length - 4, j = 1; i > 0; i -= 4, j++) {
					const k: number = Math.min(YllionEnglishNotation.numTrailingZeros(j), YllionEnglishNotation.SEPARATORS.length - 1);
					s = s.substring(0, i) + YllionEnglishNotation.SEPARATORS[k] + s.substring(i);
				}
				return s;
			}
		}
		
		
		static numTrailingZeros(n: number): number {
			if (n == 0 || Math.floor(n) != n)
				throw new RangeError();
			let result: number = 0;
			for (; (n & 1) == 0; n >>>= 1)
				result++;
			return result;
		}
		
		
		static YLLIONS: Array<string> = [
			"", "hundred", "myriad", "myllion", "byllion", "tryllion", "quadryllion",
			"quintyllion", "sextyllion", "septyllion", "octyllion", "nonyllion", "decyllion"];
		
		static SEPARATORS: Array<string> = [",", ";", ":", "'"];
		
	}
	
	
	
	// Donald Knuth's system; see https://en.wikipedia.org/wiki/-yllion .
	class YllionChineseNotation {
		
		static numberToWords(n: bigint): string {
			if (n < 0n)
				return "\u8CA0" + YllionChineseNotation.numberToWords(-n);
			else if (n == 0n)
				return "\u96F6";
			else if (n < 100n) {
				return (n >= 10n ? (n >= 20n ? YllionChineseNotation.ONES[Number(n / 10n)] : "") + "\u5341" : "") + YllionChineseNotation.ONES[Number(n % 10n)];
			} else {
				const temp: string = n.toString();
				const yllionsLen: number = YllionChineseNotation.YLLIONS.length;
				if (temp.length > (1 << yllionsLen))
					throw new RangeError("Number too large");
				for (let i = yllionsLen - 1; i >= 1; i--) {
					if (temp.length > (1 << i)) {
						const split: number = temp.length - (1 << i);
						const high: bigint = BigInt(temp.substring(0, split));
						const low: bigint = BigInt(temp.substring(split));
						return (high > 0n ? YllionChineseNotation.numberToWords(high) + YllionChineseNotation.YLLIONS[i] : "") +
							(low > 0n ? YllionChineseNotation.numberToWords(low) : "");
					}
				}
				throw new Error("Unreachable value");
			}
		}
		
		
		static ONES: Array<string> = ["", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D"];
		
		static YLLIONS: Array<string> = ["", "\u767E", "\u842C", "\u5104", "\u5146", "\u4EAC", "\u5793", "\u79ED", "\u7A70", "\u6E9D", "\u6F97", "\u6B63", "\u8F09"];
		
	}
	
}
