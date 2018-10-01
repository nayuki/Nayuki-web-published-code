/* 
 * Animated floating graph nodes
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */

"use strict";


/*---- Configurable constants ----*/

let idealNumNodes: number = NaN;
let maxExtraEdges: number = NaN;
let radiiWeightPower: number = NaN;
let driftSpeed: number = NaN;
let repulsionForce: number = NaN;
let BORDER_FADE: number = -0.02;
let FADE_IN_RATE: number  = 0.06;  // In the range (0.0, 1.0]
let FADE_OUT_RATE: number = 0.03;  // In the range (0.0, 1.0]
let FRAME_INTERVAL: number = 20;  // In milliseconds


/*---- Major functions ----*/

// Performs one-time initialization of the SVG image, the graph, and miscellaneous matters.
// Also responsible for holding the "global" state in the closure of the function,
// which are the 3 variables {nodes, edges, svgElem}.
function initialize(): void {
	let svgElem = document.querySelector("article svg") as Element;
	let boundRect = svgElem.getBoundingClientRect();
	let relWidth : number = boundRect.width  / Math.max(boundRect.width, boundRect.height);
	let relHeight: number = boundRect.height / Math.max(boundRect.width, boundRect.height);
	svgElem.setAttribute("viewBox", "0 0 " + relWidth + " " + relHeight);
	let rectElem = svgElem.querySelector("rect") as Element;
	rectElem.setAttribute("x", ((relWidth  - 1) / 2).toString());
	rectElem.setAttribute("y", ((relHeight - 1) / 2).toString());
	
	let gradElem = svgElem.querySelector("radialGradient") as Element;
	let stopElem = document.createElementNS(svgElem.namespaceURI, "stop");
	stopElem.setAttribute("offset", "0.0");
	stopElem.setAttribute("stop-color", "#575E85");
	gradElem.appendChild(stopElem);
	stopElem = document.createElementNS(svgElem.namespaceURI, "stop");
	stopElem.setAttribute("offset", "1.0");
	stopElem.setAttribute("stop-color", "#2E3145");
	gradElem.appendChild(stopElem);
	
	initInputHandlers();
	
	if (!("hypot" in Math)) {  // Polyfill
		(Math as any).hypot = (x: number, y: number) =>
			(Math as any).sqrt(x * x + y * y);
	}
	
	let nodes: Array<GNode> = [];
	let edges: Array<Edge> = [];
	
	// This important top-level function updates the arrays of nodes and edges, then redraws the SVG image.
	// We define it within the closure to give it access to key variables that persist across iterations.
	function stepFrame(): void {
		nodes = updateNodes(relWidth, relHeight, nodes);
		edges = updateEdges(nodes, edges);
		redrawOutput(svgElem, nodes, edges);
	}
	
	// Populate initial nodes and edges, then improve on them
	stepFrame();  // Generate nodes
	for (let i = 0; i < 300; i++)  // Spread out nodes to avoid ugly clumping
		doForceField(nodes);
	edges = [];
	stepFrame();  // Redo spanning tree and extra edges because nodes have moved
	
	// Make everything render immediately instead of fading in
	for (let node of nodes)
		node.opacity = 1;
	for (let edge of edges)
		edge.opacity = 1;
	redrawOutput(svgElem, nodes, edges);
	
	// Periodically execute stepFrame() to create animation
	setInterval(stepFrame, FRAME_INTERVAL);
}


// Sets event handlers for form input elements, and sets global configuration variables.
function initInputHandlers() {
	function setAndCall(elemId: string, func: (val: number) => void) {
		let handler: () => void;
		let elem = document.getElementById(elemId);
		if (elem instanceof HTMLInputElement) {
			handler = () => func(parseFloat((elem as HTMLInputElement).value));
			elem.oninput = handler;
		} else if (elem instanceof HTMLSelectElement) {
			handler = () => func(parseFloat((elem as HTMLSelectElement).value));
			elem.onchange = handler;
		} else
			throw "Assertion error";
		handler();
	}
	
	setAndCall("extra-edges", val =>
		maxExtraEdges = Math.round(val / 100 * idealNumNodes));
	setAndCall("number-nodes", val => {
		idealNumNodes = Math.round(val);
		maxExtraEdges = Math.round(val / 100 * val);
	});
	setAndCall("network-style", val =>
		radiiWeightPower = val);
	setAndCall("drift-speed", val => {
		if (!isNaN(val))
			driftSpeed = val * 0.0001;
	});
	setAndCall("repulsion-force", val => {
		if (!isNaN(val))
			repulsionForce = val * 0.000001;
	});
}


// Returns a new array of nodes by updating/adding/removing nodes based on the given array. Although the
// argument array is not modified, the node objects themselves are modified. No other side effects.
// At least one of relWidth or relHeight is exactly 1. The aspect ratio relWidth:relHeight is equal to w:h.
function updateNodes(relWidth: number, relHeight: number, nodes: Array<GNode>): Array<GNode> {
	
	// Update position, velocity, opacity; prune faded nodes
	let newNodes: Array<GNode> = [];
	nodes.forEach((node, index) => {
		// Move based on velocity
		node.posX += node.velX * driftSpeed;
		node.posY += node.velY * driftSpeed;
		// Randomly perturb velocity, with damping
		node.velX = node.velX * 0.99 + (Math.random() - 0.5) * 0.3;
		node.velY = node.velY * 0.99 + (Math.random() - 0.5) * 0.3;
		// Fade out nodes near the borders of the space or exceeding the target number of nodes
		if (index >= idealNumNodes || node.posX < BORDER_FADE || relWidth - node.posX < BORDER_FADE
				|| node.posY < BORDER_FADE || relHeight - node.posY < BORDER_FADE)
			node.opacity = Math.max(node.opacity - FADE_OUT_RATE, 0);
		else  // Fade in ones otherwise
			node.opacity = Math.min(node.opacity + FADE_IN_RATE, 1);
		// Only keep visible nodes
		if (node.opacity > 0)
			newNodes.push(node);
	});
	
	// Add new nodes to fade in
	for (let i = newNodes.length; i < idealNumNodes; i++) {
		newNodes.push(new GNode(  // Random position and radius, other properties initially zero
			Math.random() * relWidth, Math.random() * relHeight,
			(Math.pow(Math.random(), 5) + 0.35) * 0.015,  // Skew toward smaller values
			0.0, 0.0, 0.0));
	}
	
	// Spread out nodes a bit
	doForceField(newNodes);
	return newNodes;
}


// Updates the position of each node in the given array (in place), based on
// their existing positions. Returns nothing. No other side effects.
function doForceField(nodes: Array<GNode>): void {
	let deltas: Array<number> = [];
	for (let i = 0; i < nodes.length * 2; i++)
		deltas.push(0.0);
	
	// For simplicitly, we perturb positions directly, instead of velocities
	for (let i = 0; i < nodes.length; i++) {
		let nodeA: GNode = nodes[i];
		for (let j = 0; j < i; j++) {
			let nodeB: GNode = nodes[j];
			let dx: number = nodeA.posX - nodeB.posX;
			let dy: number = nodeA.posY - nodeB.posY;
			let distSqr: number = dx * dx + dy * dy;
			// Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
			// 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
			let factor: number = repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
			dx *= factor;
			dy *= factor;
			deltas[i * 2 + 0] += dx;
			deltas[i * 2 + 1] += dy;
			deltas[j * 2 + 0] -= dx;
			deltas[j * 2 + 1] -= dy;
		}
	}
	nodes.forEach((node, i) => {
		node.posX += deltas[i * 2 + 0];
		node.posY += deltas[i * 2 + 1];
	});
}


// Returns a new array of edges by reading the given array of nodes and by updating/adding/removing edges
// based on the other given array. Although both argument arrays and nodes are unmodified,
// the edge objects themselves are modified. No other side effects.
function updateEdges(nodes: Array<GNode>, edges: Array<Edge>): Array<Edge> {
	// Calculate array of spanning tree edges, then add some extra low-weight edges
	let allEdges: Array<[number,number,number]> = calcAllEdgeWeights(nodes);
	let idealEdges: Array<Edge> = calcSpanningTree(allEdges, nodes);
	for (let edge of allEdges) {
		if (idealEdges.length >= nodes.length - 1 + maxExtraEdges)
			break;
		let newEdge = new Edge(nodes[edge[1]], nodes[edge[2]], 0.0);  // Convert data formats
		if (!containsEdge(idealEdges, newEdge))
			idealEdges.push(newEdge);
	}
	
	// Classify each current edge, checking whether it is in the ideal set; prune faded edges
	let newEdges: Array<Edge> = [];
	for (let edge of edges) {
		if (containsEdge(idealEdges, edge))
			edge.opacity = Math.min(edge.opacity + FADE_IN_RATE, 1);
		else
			edge.opacity = Math.max(edge.opacity - FADE_OUT_RATE, 0);
		if (edge.opacity > 0 && edge.nodeA.opacity > 0 && edge.nodeB.opacity > 0)
			newEdges.push(edge);
	}
	
	// If there is room for new edges, add some missing spanning tree edges (higher priority), then extra edges
	for (let edge of idealEdges) {
		if (newEdges.length >= nodes.length - 1 + maxExtraEdges)
			break;
		if (!containsEdge(newEdges, edge))
			newEdges.push(edge);
	}
	return newEdges;
}


// Redraws the SVG image based on the given values. No other side effects.
function redrawOutput(svgElem: Element, nodes: Array<GNode>, edges: Array<Edge>): void {
	// Clear movable objects
	let gElem = svgElem.querySelector("g") as Element;
	while (gElem.firstChild != null)
		gElem.removeChild(gElem.firstChild);
	
	// Draw every node
	for (let node of nodes) {
		let circElem = document.createElementNS(svgElem.namespaceURI, "circle");
		circElem.setAttribute("cx", node.posX.toString());
		circElem.setAttribute("cy", node.posY.toString());
		circElem.setAttribute("r", node.radius.toString());
		circElem.setAttribute("fill", "rgba(129,139,197," + node.opacity.toFixed(3) + ")");
		gElem.appendChild(circElem);
	}
	
	// Draw every edge
	for (let edge of edges) {
		let nodeA: GNode = edge.nodeA;
		let nodeB: GNode = edge.nodeB;
		let dx: number = nodeA.posX - nodeB.posX;
		let dy: number = nodeA.posY - nodeB.posY;
		let mag: number = Math.hypot(dx, dy);
		if (mag > nodeA.radius + nodeB.radius) {  // Draw edge only if circles don't intersect
			dx /= mag;  // Make (dx, dy) a unit vector, pointing from B to A
			dy /= mag;
			let opacity: number = Math.min(Math.min(nodeA.opacity, nodeB.opacity), edge.opacity);
			let lineElem: Element = document.createElementNS(svgElem.namespaceURI, "line");
			// Shorten the edge so that it only touches the circumference of each circle
			lineElem.setAttribute("x1", (nodeA.posX - dx * nodeA.radius).toString());
			lineElem.setAttribute("y1", (nodeA.posY - dy * nodeA.radius).toString());
			lineElem.setAttribute("x2", (nodeB.posX + dx * nodeB.radius).toString());
			lineElem.setAttribute("y2", (nodeB.posY + dy * nodeB.radius).toString());
			lineElem.setAttribute("stroke", "rgba(129,139,197," + opacity.toFixed(3) + ")");
			gElem.appendChild(lineElem);
		}
	}
}


/*---- Minor functions ----*/

// Returns a sorted array of edges with weights, for all unique edge pairs. Pure function, no side effects.
function calcAllEdgeWeights(nodes: Array<GNode>): Array<[number,number,number]> {
	// Each entry has the form [weight, nodeAIndex, nodeBIndex], where nodeAIndex < nodeBIndex
	let result: Array<[number,number,number]> = [];
	for (let i = 0; i < nodes.length; i++) {  // Calculate all n * (n - 1) / 2 edges
		let nodeA: GNode = nodes[i];
		for (let j = 0; j < i; j++) {
			let nodeB: GNode = nodes[j];
			let weight: number = Math.hypot(nodeA.posX - nodeB.posX, nodeA.posY - nodeB.posY);  // Euclidean distance
			weight /= Math.pow(nodeA.radius * nodeB.radius, radiiWeightPower);  // Give discount based on node radii
			result.push([weight, i, j]);
		}
	}
	
	// Sort array by ascending weight
	result.sort((a, b) => {
		let x = a[0], y = b[0];
		return x < y ? -1 : (x > y ? 1 : 0);
	});
	return result;
}


// Returns a new array of edge objects that is a minimal spanning tree on the given set
// of nodes, with edges in ascending order of weight. Note that the returned edge objects
// are missing the opacity property. Pure function, no side effects.
function calcSpanningTree(allEdges: Array<[number,number,number]>, nodes: Array<GNode>): Array<Edge> {
	// Kruskal's MST algorithm
	let result: Array<Edge> = [];
	let ds = new DisjointSet(nodes.length);
	for (let i = 0; i < allEdges.length && result.length < nodes.length - 1; i++) {
		let edge: [number,number,number] = allEdges[i];
		let j: number = edge[1];
		let k: number = edge[2];
		if (ds.mergeSets(j, k))
			result.push(new Edge(nodes[j], nodes[k], 0.0));
	}
	return result;
}


// Tests whether the given array of edge objects contains an edge with
// the given endpoints (undirected). Pure function, no side effects.
function containsEdge(array: Array<Edge>, edge: Edge): boolean {
	for (let elem of array) {
		if (elem.nodeA == edge.nodeA && elem.nodeB == edge.nodeB ||
		    elem.nodeA == edge.nodeB && elem.nodeB == edge.nodeA)
			return true;
	}
	return false;
}


class GNode {
	public constructor(
		public posX: number,  // Horizontal position in relative coordinates, typically in the range [0.0, relWidth], where relWidth <= 1.0
		public posY: number,  // Vertical position in relative coordinates, typically in the range [0.0, relHeight], where relHeight <= 1.0
		public radius: number,  // Radius of the node, a positive real number
		public velX: number,  // Horizontal velocity in relative units (not pixels)
		public velY: number,  // Vertical velocity in relative units (not pixels)
		public opacity: number) {}  // A number in the range [0.0, 1.0] representing the strength of the node
}


class Edge {
	public constructor(
		public nodeA: GNode,  // A reference to the node object representing one side of the undirected edge
		public nodeB: GNode,  // A reference to the node object representing another side of the undirected edge (must be distinct from NodeA)
		public opacity: number) {}  // A number in the range [0.0, 1.0] representing the strength of the edge
}


// The union-find data structure. A heavily stripped-down version
// derived from https://www.nayuki.io/page/disjoint-set-data-structure .
class DisjointSet {
	public parents: Array<number> = [];
	public ranks  : Array<number> = [];
	
	public constructor(size: number) {
		for (let i = 0; i < size; i++) {
			this.parents.push(i);
			this.ranks.push(0);
		}
	}
	
	public mergeSets(i: number, j: number): boolean {
		let repr0: number = this.getRepr(i);
		let repr1: number = this.getRepr(j);
		if (repr0 == repr1)
			return false;
		let cmp: number = this.ranks[repr0] - this.ranks[repr1];
		if (cmp >= 0) {
			if (cmp == 0)
				this.ranks[repr0]++;
			this.parents[repr1] = repr0;
		} else
			this.parents[repr0] = repr1;
		return true;
	}
	
	private getRepr(i: number): number {
		if (this.parents[i] != i)
			this.parents[i] = this.getRepr(this.parents[i]);
		return this.parents[i];
	}
}


initialize();
