/* 
 * Tax-free savings account simulator
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/canada-tax-free-savings-account-simulator-javascript
 */

"use strict";


// All monetary amounts are in whole cents

/* State variables */

var showAllTransactions = false;
var date = 2009 * 12 + 0;
var contributionRoom = 500000;  // Current contribution room, carries over indefinitely; negative means over-contribution
var chequingTransactions = [[date, "New account", 0, 0]];  // New transactions are appended
var tfsaTransactions     = [[date, "New account", 0, 0, contributionRoom, 0]];
var maxExcess = 0;  // Maximum excess amount encountered this month
var withdrawn = 0;  // Amount withdrawn this year (excluding "qualifying withdrawals" that reduce the excess amount)


/* User interaction handlers */

function transaction(func) {
	try {
		// Parse amount
		var amountElem = document.getElementById("amount");
		var s = amountElem.value;
		s = s.replace(/^\s+|\s+$/g, "");  // Trim whitespace
		if (!/^(\d{1,13}(\.\d{0,2})?|\.\d{1,2})$/.test(s))
			throw "Invalid amount number";
		
		func(Math.round(parseFloat(s) * 100));
		
		display();
		setText("amount-error", "");
	} catch (e) {
		setText("amount-error", "Error: " + e);
	}
}


function deposit(amount) {
	var ct = chequingTransactions;
	var balance = ct[ct.length - 1][3];
	ct.push([date, "Deposit", amount, balance + amount]);
}


function withdraw(amount) {
	var ct = chequingTransactions;
	var balance = ct[ct.length - 1][3];
	if (balance < amount)
		throw "Not enough money in chequing account";
	ct.push([date, "Withdraw", amount, balance - amount]);
}


function transferIn(amount) {
	var ct = chequingTransactions;
	var balance = ct[ct.length - 1][3];
	if (balance < amount)
		throw "Not enough money in chequing account";
	ct.push([date, "Transfer out", amount, balance - amount]);
	
	contributionRoom -= amount;
	maxExcess = Math.max(-contributionRoom, maxExcess);
	var tt = tfsaTransactions;
	balance = tt[tt.length - 1][3];
	tt.push([date, "Transfer in", amount, balance + amount, contributionRoom, withdrawn]);
}


function transferOut(amount) {
	var tt = tfsaTransactions;
	var balance = tt[tt.length - 1][3];
	if (balance < amount)
		throw "Not enough money in TFSA";
	
	var qualifying = Math.min(Math.max(-contributionRoom, 0), amount);
	contributionRoom += qualifying;
	withdrawn += amount - qualifying;
	tt.push([date, "Transfer out", amount, balance - amount, contributionRoom, withdrawn]);
	
	var ct = chequingTransactions;
	balance = ct[ct.length - 1][3];
	ct.push([date, "Transfer in", amount, balance + amount]);
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
	var tt = tfsaTransactions;
	var balance = tt[tt.length - 1][3];
	var amount = Math.round(balance * parseFloat(s) / 1200);
	if (amount != 0)
		tt.push([date, "Interest", amount, balance + amount, contributionRoom, withdrawn, contributionRoom, withdrawn]);
	
	// Handle excess amount
	var ct = chequingTransactions;
	amount = Math.round(maxExcess / 100);
	if (amount > 0) {
		balance = ct[ct.length - 1][3];
		ct.push([date, "TFSA tax", amount, balance - amount]);
	}
	
	// Increment month
	date++;
	if (date % 12 == 0) {
		// Raise contribution room
		var year = Math.floor(date / 12);
		if (year < 2013)
			amount = 500000;  // Known amount
		else if (year < 2015)
			amount = 550000;  // Known amount
		else
			amount = 1000000;  // Accurate for year 2015; beyond 2015 is based on the assumption of unchanged laws
		amount += withdrawn;
		contributionRoom += amount;
		withdrawn = 0;
		balance = tt[tt.length - 1][3];
		tt.push([date, "Raise room", amount, balance, contributionRoom, withdrawn]);
	}
	maxExcess = Math.max(-contributionRoom, 0);
	
	display();
}


function changeShowTransactions() {
	var showRecent = document.getElementById("show-recent").checked;
	var showAll    = document.getElementById("show-all"   ).checked;
	if (showRecent == showAll)
		throw "Invalid states of radio buttons";
	if (showAllTransactions != showAll) {
		showAllTransactions = showAll;
		display();
	}
}


/* HTML output logic and formatting utilities */

var TRANSACTION_ROWS = 16;

function display() {
	var tr;
	function appendTd(content) {
		if (typeof content == "string")
			content = [document.createTextNode(content)];
		var td = document.createElement("td");
		content.forEach(function(item) {
			td.appendChild(item);
		});
		tr.appendChild(td);
	}
	
	function formatMoney(amount) {
		if (isNaN(amount))
			return [document.createTextNode("NaN")];
		else if (Math.abs(amount) > 1e15)
			return [document.createTextNode("Overflow")];
		else if (amount < 0) {
			var result = formatMoney(-amount);
			result.splice(0, 0, document.createTextNode(MINUS));
			return result;
		} else {
			var result = [];
			var s = Math.floor(amount / 100) + "";
			while (s.length > 0) {
				var i = Math.max(s.length - 3, 0);
				var span = document.createElement("span");
				span.appendChild(document.createTextNode(s.substring(i)));
				span.className = "digitgrouper";
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
	
	var cheqElem = document.getElementById("chequing-transactions");
	removeAllChildren(cheqElem);
	for (var i = showAllTransactions ? 0 : chequingTransactions.length - TRANSACTION_ROWS; i < chequingTransactions.length; i++) {
		tr = document.createElement("tr");
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
		cheqElem.appendChild(tr);
	}
	
	var tfsaElem = document.getElementById("tfsa-transactions");
	removeAllChildren(tfsaElem);
	for (var i = showAllTransactions ? 0 : tfsaTransactions.length - TRANSACTION_ROWS; i < tfsaTransactions.length; i++) {
		tr = document.createElement("tr");
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
		tfsaElem.appendChild(tr);
	}
	
	setText("current-date", formatDate(date));
}


function setText(elementName, text) {
	var elem = document.getElementById(elementName);
	removeAllChildren(elem);
	elem.appendChild(document.createTextNode(text));
}


function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}


/* String constants */

var NBSP = "\u00A0";
var MINUS = "\u2212";
var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


/* Initialization */

display();
document.getElementById("amount").focus();
