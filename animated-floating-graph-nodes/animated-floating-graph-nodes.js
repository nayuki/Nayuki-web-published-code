/*
 * Animated floating graph nodes (compiled from TypeScript)
 *
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */
"use strict";
/*---- Configurable constants ----*/
var idealNumNodes = NaN;
var maxExtraEdges = NaN;
var radiiWeightPower = NaN;
var driftSpeed = NaN;
var repulsionForce = NaN;
var BORDER_FADE = -0.02;
var FADE_IN_RATE = 0.06; // In the range (0.0, 1.0]
var FADE_OUT_RATE = 0.03; // In the range (0.0, 1.0]
var FRAME_INTERVAL = 20; // In milliseconds
/*---- Major functions ----*/
// Performs one-time initialization of the SVG image, the graph, and miscellaneous matters.
// Also responsible for holding the "global" state in the closure of the function,
// which are the 3 variables {nodes, edges, svgElem}.
function initialize() {
    var svgElem = document.querySelector("article svg");
    var boundRect = svgElem.getBoundingClientRect();
    var relWidth = boundRect.width / Math.max(boundRect.width, boundRect.height);
    var relHeight = boundRect.height / Math.max(boundRect.width, boundRect.height);
    svgElem.setAttribute("viewBox", "0 0 " + relWidth + " " + relHeight);
    var rectElem = svgElem.querySelector("rect");
    rectElem.setAttribute("x", ((relWidth - 1) / 2).toString());
    rectElem.setAttribute("y", ((relHeight - 1) / 2).toString());
    var gradElem = svgElem.querySelector("radialGradient");
    var stopElem = document.createElementNS(svgElem.namespaceURI, "stop");
    stopElem.setAttribute("offset", "0.0");
    stopElem.setAttribute("stop-color", "#575E85");
    gradElem.appendChild(stopElem);
    stopElem = document.createElementNS(svgElem.namespaceURI, "stop");
    stopElem.setAttribute("offset", "1.0");
    stopElem.setAttribute("stop-color", "#2E3145");
    gradElem.appendChild(stopElem);
    initInputHandlers();
    if (!("hypot" in Math)) { // Polyfill
        Math.hypot = function (x, y) {
            return Math.sqrt(x * x + y * y);
        };
    }
    var nodes = [];
    var edges = [];
    // This important top-level function updates the arrays of nodes and edges, then redraws the SVG image.
    // We define it within the closure to give it access to key variables that persist across iterations.
    function stepFrame() {
        nodes = updateNodes(relWidth, relHeight, nodes);
        edges = updateEdges(nodes, edges);
        redrawOutput(svgElem, nodes, edges);
    }
    // Populate initial nodes and edges, then improve on them
    stepFrame(); // Generate nodes
    for (var i = 0; i < 300; i++) // Spread out nodes to avoid ugly clumping
        doForceField(nodes);
    edges = [];
    stepFrame(); // Redo spanning tree and extra edges because nodes have moved
    // Make everything render immediately instead of fading in
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        node.opacity = 1;
    }
    for (var _a = 0, edges_1 = edges; _a < edges_1.length; _a++) {
        var edge = edges_1[_a];
        edge.opacity = 1;
    }
    redrawOutput(svgElem, nodes, edges);
    // Periodically execute stepFrame() to create animation
    setInterval(stepFrame, FRAME_INTERVAL);
}
// Sets event handlers for form input elements, and sets global configuration variables.
function initInputHandlers() {
    function setAndCall(elemId, func) {
        var handler;
        var elem = document.getElementById(elemId);
        if (elem instanceof HTMLInputElement) {
            handler = function () { return func(parseFloat(elem.value)); };
            elem.oninput = handler;
        }
        else if (elem instanceof HTMLSelectElement) {
            handler = function () { return func(parseFloat(elem.value)); };
            elem.onchange = handler;
        }
        else
            throw "Assertion error";
        handler();
    }
    setAndCall("extra-edges", function (val) {
        return maxExtraEdges = Math.round(val / 100 * idealNumNodes);
    });
    setAndCall("number-nodes", function (val) {
        idealNumNodes = Math.round(val);
        maxExtraEdges = Math.round(val / 100 * val);
    });
    setAndCall("network-style", function (val) {
        return radiiWeightPower = val;
    });
    setAndCall("drift-speed", function (val) {
        if (!isNaN(val))
            driftSpeed = val * 0.0001;
    });
    setAndCall("repulsion-force", function (val) {
        if (!isNaN(val))
            repulsionForce = val * 0.000001;
    });
}
// Returns a new array of nodes by updating/adding/removing nodes based on the given array. Although the
// argument array is not modified, the node objects themselves are modified. No other side effects.
// At least one of relWidth or relHeight is exactly 1. The aspect ratio relWidth:relHeight is equal to w:h.
function updateNodes(relWidth, relHeight, nodes) {
    // Update position, velocity, opacity; prune faded nodes
    var newNodes = [];
    nodes.forEach(function (node, index) {
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
        else // Fade in ones otherwise
            node.opacity = Math.min(node.opacity + FADE_IN_RATE, 1);
        // Only keep visible nodes
        if (node.opacity > 0)
            newNodes.push(node);
    });
    // Add new nodes to fade in
    for (var i = newNodes.length; i < idealNumNodes; i++) {
        newNodes.push(new GNode(// Random position and radius, other properties initially zero
        Math.random() * relWidth, Math.random() * relHeight, (Math.pow(Math.random(), 5) + 0.35) * 0.015, // Skew toward smaller values
        0.0, 0.0, 0.0));
    }
    // Spread out nodes a bit
    doForceField(newNodes);
    return newNodes;
}
// Updates the position of each node in the given array (in place), based on
// their existing positions. Returns nothing. No other side effects.
function doForceField(nodes) {
    var deltas = [];
    for (var i = 0; i < nodes.length * 2; i++)
        deltas.push(0.0);
    // For simplicitly, we perturb positions directly, instead of velocities
    for (var i = 0; i < nodes.length; i++) {
        var nodeA = nodes[i];
        for (var j = 0; j < i; j++) {
            var nodeB = nodes[j];
            var dx = nodeA.posX - nodeB.posX;
            var dy = nodeA.posY - nodeB.posY;
            var distSqr = dx * dx + dy * dy;
            // Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
            // 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
            var factor = repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
            dx *= factor;
            dy *= factor;
            deltas[i * 2 + 0] += dx;
            deltas[i * 2 + 1] += dy;
            deltas[j * 2 + 0] -= dx;
            deltas[j * 2 + 1] -= dy;
        }
    }
    nodes.forEach(function (node, i) {
        node.posX += deltas[i * 2 + 0];
        node.posY += deltas[i * 2 + 1];
    });
}
// Returns a new array of edges by reading the given array of nodes and by updating/adding/removing edges
// based on the other given array. Although both argument arrays and nodes are unmodified,
// the edge objects themselves are modified. No other side effects.
function updateEdges(nodes, edges) {
    // Calculate array of spanning tree edges, then add some extra low-weight edges
    var allEdges = calcAllEdgeWeights(nodes);
    var idealEdges = calcSpanningTree(allEdges, nodes);
    for (var _i = 0, allEdges_1 = allEdges; _i < allEdges_1.length; _i++) {
        var edge = allEdges_1[_i];
        if (idealEdges.length >= nodes.length - 1 + maxExtraEdges)
            break;
        var newEdge = new Edge(nodes[edge[1]], nodes[edge[2]], 0.0); // Convert data formats
        if (!containsEdge(idealEdges, newEdge))
            idealEdges.push(newEdge);
    }
    // Classify each current edge, checking whether it is in the ideal set; prune faded edges
    var newEdges = [];
    for (var _a = 0, edges_2 = edges; _a < edges_2.length; _a++) {
        var edge = edges_2[_a];
        if (containsEdge(idealEdges, edge))
            edge.opacity = Math.min(edge.opacity + FADE_IN_RATE, 1);
        else
            edge.opacity = Math.max(edge.opacity - FADE_OUT_RATE, 0);
        if (edge.opacity > 0 && edge.nodeA.opacity > 0 && edge.nodeB.opacity > 0)
            newEdges.push(edge);
    }
    // If there is room for new edges, add some missing spanning tree edges (higher priority), then extra edges
    for (var _b = 0, idealEdges_1 = idealEdges; _b < idealEdges_1.length; _b++) {
        var edge = idealEdges_1[_b];
        if (newEdges.length >= nodes.length - 1 + maxExtraEdges)
            break;
        if (!containsEdge(newEdges, edge))
            newEdges.push(edge);
    }
    return newEdges;
}
// Redraws the SVG image based on the given values. No other side effects.
function redrawOutput(svgElem, nodes, edges) {
    // Clear movable objects
    var gElem = svgElem.querySelector("g");
    while (gElem.firstChild != null)
        gElem.removeChild(gElem.firstChild);
    // Draw every node
    for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
        var node = nodes_2[_i];
        var circElem = document.createElementNS(svgElem.namespaceURI, "circle");
        circElem.setAttribute("cx", node.posX.toString());
        circElem.setAttribute("cy", node.posY.toString());
        circElem.setAttribute("r", node.radius.toString());
        circElem.setAttribute("fill", "rgba(129,139,197," + node.opacity.toFixed(3) + ")");
        gElem.appendChild(circElem);
    }
    // Draw every edge
    for (var _a = 0, edges_3 = edges; _a < edges_3.length; _a++) {
        var edge = edges_3[_a];
        var nodeA = edge.nodeA;
        var nodeB = edge.nodeB;
        var dx = nodeA.posX - nodeB.posX;
        var dy = nodeA.posY - nodeB.posY;
        var mag = Math.hypot(dx, dy);
        if (mag > nodeA.radius + nodeB.radius) { // Draw edge only if circles don't intersect
            dx /= mag; // Make (dx, dy) a unit vector, pointing from B to A
            dy /= mag;
            var opacity = Math.min(Math.min(nodeA.opacity, nodeB.opacity), edge.opacity);
            var lineElem = document.createElementNS(svgElem.namespaceURI, "line");
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
function calcAllEdgeWeights(nodes) {
    // Each entry has the form [weight, nodeAIndex, nodeBIndex], where nodeAIndex < nodeBIndex
    var result = [];
    for (var i = 0; i < nodes.length; i++) { // Calculate all n * (n - 1) / 2 edges
        var nodeA = nodes[i];
        for (var j = 0; j < i; j++) {
            var nodeB = nodes[j];
            var weight = Math.hypot(nodeA.posX - nodeB.posX, nodeA.posY - nodeB.posY); // Euclidean distance
            weight /= Math.pow(nodeA.radius * nodeB.radius, radiiWeightPower); // Give discount based on node radii
            result.push([weight, i, j]);
        }
    }
    // Sort array by ascending weight
    result.sort(function (a, b) {
        var x = a[0], y = b[0];
        return x < y ? -1 : (x > y ? 1 : 0);
    });
    return result;
}
// Returns a new array of edge objects that is a minimal spanning tree on the given set
// of nodes, with edges in ascending order of weight. Note that the returned edge objects
// are missing the opacity property. Pure function, no side effects.
function calcSpanningTree(allEdges, nodes) {
    // Kruskal's MST algorithm
    var result = [];
    var ds = new DisjointSet(nodes.length);
    for (var i = 0; i < allEdges.length && result.length < nodes.length - 1; i++) {
        var edge = allEdges[i];
        var j = edge[1];
        var k = edge[2];
        if (ds.mergeSets(j, k))
            result.push(new Edge(nodes[j], nodes[k], 0.0));
    }
    return result;
}
// Tests whether the given array of edge objects contains an edge with
// the given endpoints (undirected). Pure function, no side effects.
function containsEdge(array, edge) {
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var elem = array_1[_i];
        if (elem.nodeA == edge.nodeA && elem.nodeB == edge.nodeB ||
            elem.nodeA == edge.nodeB && elem.nodeB == edge.nodeA)
            return true;
    }
    return false;
}
var GNode = /** @class */ (function () {
    function GNode(posX, // Horizontal position in relative coordinates, typically in the range [0.0, relWidth], where relWidth <= 1.0
    posY, // Vertical position in relative coordinates, typically in the range [0.0, relHeight], where relHeight <= 1.0
    radius, // Radius of the node, a positive real number
    velX, // Horizontal velocity in relative units (not pixels)
    velY, // Vertical velocity in relative units (not pixels)
    opacity) {
        this.posX = posX;
        this.posY = posY;
        this.radius = radius;
        this.velX = velX;
        this.velY = velY;
        this.opacity = opacity;
    } // A number in the range [0.0, 1.0] representing the strength of the node
    return GNode;
}());
var Edge = /** @class */ (function () {
    function Edge(nodeA, // A reference to the node object representing one side of the undirected edge
    nodeB, // A reference to the node object representing another side of the undirected edge (must be distinct from NodeA)
    opacity) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.opacity = opacity;
    } // A number in the range [0.0, 1.0] representing the strength of the edge
    return Edge;
}());
// The union-find data structure. A heavily stripped-down version
// derived from https://www.nayuki.io/page/disjoint-set-data-structure .
var DisjointSet = /** @class */ (function () {
    function DisjointSet(size) {
        this.parents = [];
        this.ranks = [];
        for (var i = 0; i < size; i++) {
            this.parents.push(i);
            this.ranks.push(0);
        }
    }
    DisjointSet.prototype.mergeSets = function (i, j) {
        var repr0 = this.getRepr(i);
        var repr1 = this.getRepr(j);
        if (repr0 == repr1)
            return false;
        var cmp = this.ranks[repr0] - this.ranks[repr1];
        if (cmp >= 0) {
            if (cmp == 0)
                this.ranks[repr0]++;
            this.parents[repr1] = repr0;
        }
        else
            this.parents[repr0] = repr1;
        return true;
    };
    DisjointSet.prototype.getRepr = function (i) {
        if (this.parents[i] != i)
            this.parents[i] = this.getRepr(this.parents[i]);
        return this.parents[i];
    };
    return DisjointSet;
}());
initialize();
