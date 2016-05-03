/* 
 * Knuth's -yllion number notation test (Java)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/knuths-yllion-number-notation
 */

import static org.junit.Assert.assertEquals;
import java.math.BigInteger;
import org.junit.Test;


public final class IntegerToWordsTest {
	
	@Test public void testConventionalSeparators() {
		String[][] cases = {
			{"0", "0"},
			{"10", "10"},
			{"327", "327"},
			{"1,000", "1000"},
			{"32,768", "32768"},
			{"123,456", "123456"},
			{"9,999,999", "9999999"},
			{"123,456,789", "123456789"},
			{"314,159,265,358,979,323,846,264,338,327,950,288,419,716,939,937,510", "314159265358979323846264338327950288419716939937510"},
			{"-1", "-1"},
			{"-23", "-23"},
			{"-456", "-456"},
			{"-7,890", "-7890"},
			{"-12,345", "-12345"},
		};
		for (String[] cs : cases)
			assertEquals(cs[0], ConventionalEnglishNotation.toStringWithCommas(new BigInteger(cs[1])));
	}
	
	
	@Test public void testYllionSeparators() {
		String[][] cases = {
			{"0", "0"},
			{"10", "10"},
			{"327", "327"},
			{"1000", "1000"},
			{"3,2768", "32768"},
			{"12,3456", "123456"},
			{"999,9999", "9999999"},
			{"1;2345,6789", "123456789"},
			{"314:1592,6535;8979,3238'4626,4338;3279,5028:8419,7169;3993,7510", "314159265358979323846264338327950288419716939937510"},
			{"-1", "-1"},
			{"-23", "-23"},
			{"-456", "-456"},
			{"-7890", "-7890"},
			{"-1,2345", "-12345"},
		};
		for (String[] cs : cases)
			assertEquals(cs[0], YllionEnglishNotation.toStringWithSeparators(new BigInteger(cs[1])));
	}
	
	
	@Test public void testConventionalNotation() {
		String[][] cases = {
			{"zero", "0"},
			{"one", "1"},
			{"seven", "7"},
			{"ten", "10"},
			{"fifteen", "15"},
			{"twenty", "20"},
			{"thirty-six", "36"},
			{"eighty-two", "82"},
			{"one hundred", "100"},
			{"one hundred four", "104"},
			{"three hundred", "300"},
			{"seven hundred ninety-five", "795"},
			{"one thousand", "1000"},
			{"eight thousand forty-nine", "8049"},
			{"nine hundred fifty-two thousand six hundred", "952600"},
			{"sixty million twelve thousand", "60012000"},
			{"one hundred billion", "100000000000"},
			{"negative two", "-2"},
			{"negative sixteen", "-16"},
			{"negative seventy-three", "-73"},
			{"negative ten thousand", "-10000"},
		};
		for (String[] cs : cases)
			assertEquals(cs[0], ConventionalEnglishNotation.numberToWords(new BigInteger(cs[1])));
	}
	
	
	@Test public void testYllionEnglishNotation() {
		String[][] cases = {
			{"zero", "0"},
			{"one", "1"},
			{"seven", "7"},
			{"ten", "10"},
			{"fifteen", "15"},
			{"twenty", "20"},
			{"thirty-six", "36"},
			{"eighty-two", "82"},
			{"one hundred", "100"},
			{"one hundred four", "104"},
			{"three hundred", "300"},
			{"seven hundred ninety-five", "795"},
			{"ten hundred", "1000"},
			{"eighty hundred forty-nine", "8049"},
			{"ninety-five myriad twenty-six hundred", "952600"},
			{"sixty hundred one myriad twenty hundred", "60012000"},
			{"ten hundred myllion", "100000000000"},
			{"negative two", "-2"},
			{"negative sixteen", "-16"},
			{"negative seventy-three", "-73"},
			{"negative one myriad", "-10000"},
		};
		for (String[] cs : cases)
			assertEquals(cs[0], YllionEnglishNotation.numberToWords(new BigInteger(cs[1])));
	}
	
	
	@Test public void testYllionChineseNotation() {
		String[][] cases = {
			{"零", "0"},
			{"一", "1"},
			{"七", "7"},
			{"十", "10"},
			{"十五", "15"},
			{"二十", "20"},
			{"三十六", "36"},
			{"八十二", "82"},
			{"一百", "100"},
			{"一百四", "104"},
			{"三百", "300"},
			{"七百九十五", "795"},
			{"十百", "1000"},
			{"八十百四十九", "8049"},
			{"九十五萬二十六百", "952600"},
			{"六十百一萬二十百", "60012000"},
			{"十百億", "100000000000"},
			{"負二", "-2"},
			{"負十六", "-16"},
			{"負七十三", "-73"},
			{"負一萬", "-10000"},
		};
		for (String[] cs : cases)
			assertEquals(cs[0], YllionChineseNotation.numberToWords(new BigInteger(cs[1])));
	}
	
}
