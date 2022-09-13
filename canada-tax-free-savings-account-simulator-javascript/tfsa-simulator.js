/* 
 * Tax-free savings account simulator
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/canada-tax-free-savings-account-simulator-javascript
 */

"use strict";


// All monetary amounts are in whole cents

/*---- State variables ----*/

var date = 2009 * 12 + 0;
var contributionRoom = 500000;  // Current contribution room, carries over indefinitely; negative means over-contribution
var maxExcess = 0;  // Maximum excess amount encountered this month
var withdrawn = 0;  // Amount withdrawn this year (excluding "qualifying withdrawals" that reduce the excess amount)
var chequingTransactions = [[date, "New account", 0, 0]];  // New transactions are appended
var tfsaTransactions     = [[date, "New account", 0, 0, contributionRoom, 0]];


/*---- User interaction handlers ----*/

function transaction(func) {
	try {
		// Parse amount
		var amountElem = document.getElementById("amount");
		var s = amountElem.value.trim();
		if (!/^(\d{1,13}(\.\d{0,2})?|\.\d{1,2})$/.test(s))
			throw new RangeError("Invalid amount number");
		
		func(Math.round(parseFloat(s) * 100));
		
		display();
		setText("amount-error", "");
	} catch (e) {
		setText("amount-error", "Error: " + e.message);
	}
}


function deposit(amount) {
	chequingTransactions.push(
		[date, "Deposit", amount, getChequingBalance() + amount]);
}


function withdraw(amount) {
	var balance = getChequingBalance();
	if (balance < amount)
		throw new RangeError("Not enough money in chequing account");
	chequingTransactions.push(
		[date, "Withdraw", amount, balance - amount]);
}


function transferIn(amount) {
	var balance = getChequingBalance();
	if (balance < amount)
		throw new RangeError("Not enough money in chequing account");
	chequingTransactions.push(
		[date, "Transfer out", amount, balance - amount]);
	
	contributionRoom -= amount;
	maxExcess = Math.max(-contributionRoom, maxExcess);
	tfsaTransactions.push(
		[date, "Transfer in", amount, getTfsaBalance() + amount, contributionRoom, withdrawn]);
}


function transferOut(amount) {
	var balance = getTfsaBalance();
	if (balance < amount)
		throw new RangeError("Not enough money in TFSA");
	
	var qualifying = Math.min(Math.max(-contributionRoom, 0), amount);
	contributionRoom += qualifying;
	withdrawn += amount - qualifying;
	tfsaTransactions.push(
		[date, "Transfer out", amount, balance - amount, contributionRoom, withdrawn]);
	
	chequingTransactions.push(
		[date, "Transfer in", amount, getChequingBalance() + amount]);
}


function nextMonth() {
	// Add interest to TFSA
	var interestElem = document.getElementById("interest-rate");
	var s = interestElem.value;
	s = s.replace(/^\s+|\s+$/g, "");  // Trim whitespace
	if (!/^-?(\d{1,10}(\.\d*)?|\.\d+)$/.test(s)) {
		setText("interest-error", "Error: Invalid interest rate");
		interestElem.focus();
		return;
	}
	setText("interest-error", "");
	var balance = getTfsaBalance();
	var amount = Math.round(balance * parseFloat(s) / 1200);
	if (amount != 0) {
		tfsaTransactions.push(
			[date, "Interest", amount, balance + amount, contributionRoom, withdrawn]);
	}
	
	// Handle excess amount
	amount = Math.round(maxExcess / 100);
	if (amount > 0) {
		chequingTransactions.push(
			[date, "TFSA tax", amount, getChequingBalance() - amount]);
	}
	
	function getContributionRoom(year) {
		if (year <= 2008)
			return 0;
		else if (year <= 2012)
			return 500000;  // Known amount
		else if (year == 2015)
			return 1000000;  // Known amount
		else if (year <= 2018)
			return 550000;  // Known amount
		else if (year <= 2022)
			return 600000;  // Known amount
		else  // Estimate based on 2% annual inflation
			return Math.round(5000 * Math.pow(1.02, year - 2009) / 500) * 50000;
	}
	
	// Increment month
	date++;
	if (date % 12 == 0) {
		// Raise contribution room in January
		var amount = getContributionRoom(Math.floor(date / 12));
		amount += withdrawn;
		contributionRoom += amount;
		withdrawn = 0;
		tfsaTransactions.push(
			[date, "Raise room", amount, getTfsaBalance(), contributionRoom, withdrawn]);
	}
	maxExcess = Math.max(-contributionRoom, 0);
	
	display();
}


/*---- HTML output logic and formatting utilities ----*/

var TRANSACTION_ROWS = 16;

function display() {
	var tr;
	function appendTd(content) {
		if (typeof content == "string")
			content = [document.createTextNode(content)];
		var td = tr.appendChild(document.createElement("td"));
		for (const item of content)
			td.appendChild(item);
	}
	
	function formatMoney(amount) {
		if (isNaN(amount))
			return [document.createTextNode("NaN")];
		else if (Math.abs(amount) > 1e15)
			return [document.createTextNode("Overflow")];
		else if (amount < 0) {
			var result = formatMoney(-amount);
			result.unshift(document.createTextNode(MINUS));
			return result;
		} else {
			var result = [];
			var s = Math.floor(amount / 100) + "";
			while (s.length > 0) {
				var i = Math.max(s.length - 3, 0);
				var span = document.createElement("span");
				span.textContent = s.substring(i);
				span.classList.add("digitgrouper");
				result.push(span);
				s = s.substring(0, i);
			}
			result.push(document.createTextNode("$"));
			result.reverse();
			result.push(document.createTextNode("." + Math.floor(amount / 10) % 10 + amount % 10));
			return result;
		}
	}
	
	function formatDate(d) {
		return MONTH_NAMES[d % 12] + " " + Math.floor(d / 12);
	}
	
	var showAllTransactions = document.getElementById("show-all").checked;
	
	var cheqElem = document.getElementById("chequing-transactions");
	clearChildren(cheqElem);
	for (var i = showAllTransactions ? 0 : chequingTransactions.length - TRANSACTION_ROWS; i < chequingTransactions.length; i++) {
		tr = cheqElem.appendChild(document.createElement("tr"));
		if (i < 0) {
			for (var j = 0; j < 4; j++)
				appendTd(NBSP);
		} else {
			var trans = chequingTransactions[i];
			appendTd(formatDate(trans[0]));
			appendTd(trans[1]);
			appendTd(formatMoney(trans[2]));
			appendTd(formatMoney(trans[3]));
		}
	}
	
	var tfsaElem = document.getElementById("tfsa-transactions");
	clearChildren(tfsaElem);
	for (var i = showAllTransactions ? 0 : tfsaTransactions.length - TRANSACTION_ROWS; i < tfsaTransactions.length; i++) {
		tr = tfsaElem.appendChild(document.createElement("tr"));
		if (i < 0) {
			for (var j = 0; j < 6; j++)
				appendTd(NBSP);
		} else {
			var trans = tfsaTransactions[i];
			appendTd(formatDate(trans[0]));
			appendTd(trans[1]);
			appendTd(formatMoney(trans[2]));
			appendTd(formatMoney(trans[3]));
			appendTd(formatMoney(trans[4]));
			appendTd(formatMoney(trans[5]));
		}
	}
	
	setText("current-date", formatDate(date));
}


function getChequingBalance() {
	return chequingTransactions[chequingTransactions.length - 1][3];
}


function getTfsaBalance() {
	return tfsaTransactions[tfsaTransactions.length - 1][3];
}


function setText(elementName, text) {
	document.getElementById(elementName).textContent = text;
}


function clearChildren(node) {
	while (node.firstChild !== null)
		node.removeChild(node.firstChild);
}


/*---- String constants ----*/

var NBSP = "\u00A0";
var MINUS = "\u2212";
var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


/*---- Initialization ----*/

display();
document.getElementById("amount").focus();
