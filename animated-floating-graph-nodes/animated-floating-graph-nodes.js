/*
 * Animated floating graph nodes (compiled from TypeScript)
 *
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var config;
(function (config) {
    config.idealNumNodes = NaN;
    config.maxExtraEdges = NaN;
    config.radiiWeightPower = NaN;
    config.driftSpeed = NaN;
    config.repulsionForce = NaN;
    config.borderFade = -0.02;
    config.fadeInPerFrame = 0.06; // In the range (0.0, 1.0]
    config.fadeOutPerFrame = 0.03; // In the range (0.0, 1.0]
    config.frameIntervalMs = 20;
})(config || (config = {}));
/*---- Major functions ----*/
// Performs one-time initialization of the SVG image, the graph, and miscellaneous matters.
// Also responsible for holding the "global" state in the closure of the function,
// which are the 3 variables {nodes, edges, svgElem}.
function initialize() {
    var svgElem = document.querySelector("article svg");
    var relWidth;
    var relHeight;
    {
        var boundRect = svgElem.getBoundingClientRect();
        relWidth = boundRect.width / Math.max(boundRect.width, boundRect.height);
        relHeight = boundRect.height / Math.max(boundRect.width, boundRect.height);
    }
    svgElem.setAttribute("viewBox", "0 0 " + relWidth + " " + relHeight);
    {
        var rectElem = svgElem.querySelector("rect");
        rectElem.setAttribute("width", relWidth.toString());
        rectElem.setAttribute("height", relHeight.toString());
    }
    svgElem.querySelectorAll("stop")[0].setAttribute("stop-color", "#575E85");
    svgElem.querySelectorAll("stop")[1].setAttribute("stop-color", "#2E3145");
    initInputHandlers();
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
    setInterval(stepFrame, config.frameIntervalMs);
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
    setAndCall("number-nodes", function (val) {
        return config.idealNumNodes = Math.round(val);
    });
    setAndCall("extra-edges", function (val) {
        return config.maxExtraEdges = Math.round(val / 100 * config.idealNumNodes);
    });
    setAndCall("network-style", function (val) {
        return config.radiiWeightPower = val;
    });
    setAndCall("drift-speed", function (val) {
        if (!isNaN(val))
            config.driftSpeed = val * 0.0001;
    });
    setAndCall("repulsion-force", function (val) {
        if (!isNaN(val))
            config.repulsionForce = val * 0.000001;
    });
}
// Returns a new array of nodes by updating/adding/removing nodes based on the given array. Although the
// argument array is not modified, the node objects themselves are modified. No other side effects.
// The aspect ratio relWidth:relHeight is equal to w:h.
function updateNodes(relWidth, relHeight, nodes) {
    if (relWidth < 0 || relWidth > 1 || relHeight < 0 || relHeight > 1 || relWidth != 1 && relHeight != 1)
        throw "Assertion error";
    // Update position, velocity, opacity; prune faded nodes
    var newNodes = [];
    for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
        var node = nodes_2[_i];
        // Move based on velocity
        node.posX += node.velX * config.driftSpeed;
        node.posY += node.velY * config.driftSpeed;
        // Randomly perturb velocity, with damping
        node.velX = node.velX * 0.99 + (Math.random() - 0.5) * 0.3;
        node.velY = node.velY * 0.99 + (Math.random() - 0.5) * 0.3;
        // Fade out nodes near the borders of the space or exceeding the target number of nodes
        var border = config.borderFade;
        var interior = border < node.posX && node.posX < relWidth - border &&
            border < node.posY && node.posY < relHeight - border;
        node.fade(newNodes.length < config.idealNumNodes && interior);
        // Only keep visible nodes
        if (node.opacity > 0)
            newNodes.push(node);
    }
    // Add new nodes to fade in
    while (newNodes.length < config.idealNumNodes) {
        newNodes.push(new GNode(Math.random() * relWidth, Math.random() * relHeight, // Position X and Y
        (Math.pow(Math.random(), 5) + 0.35) * 0.015, // Radius skewing toward smaller values
        0.0, 0.0)); // Velocity
    }
    // Spread out nodes a bit
    doForceField(newNodes);
    return newNodes;
}
// Updates the position of each node in the given array (in place), based on
// their existing positions. Returns nothing. No other side effects.
function doForceField(nodes) {
    // For simplicitly, we perturb positions directly, instead of velocities
    for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.dPosX = 0;
        a.dPosY = 0;
        for (var j = 0; j < i; j++) {
            var b = nodes[j];
            var dx = a.posX - b.posX;
            var dy = a.posY - b.posY;
            var distSqr = dx * dx + dy * dy;
            // Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
            // 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
            var factor = config.repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
            dx *= factor;
            dy *= factor;
            a.dPosX += dx;
            a.dPosY += dy;
            b.dPosX -= dx;
            b.dPosY -= dy;
        }
    }
    for (var _i = 0, nodes_3 = nodes; _i < nodes_3.length; _i++) {
        var node = nodes_3[_i];
        node.posX += node.dPosX;
        node.posY += node.dPosY;
    }
}
// Returns a new array of edges by reading the given array of nodes and by updating/adding/removing edges
// based on the other given array. Although both argument arrays and nodes are unmodified,
// the edge objects themselves are modified. No other side effects.
function updateEdges(nodes, edges) {
    // Calculate array of spanning tree edges, then add some extra low-weight edges
    var allEdges = calcAllEdgeWeights(nodes);
    var idealEdges = calcSpanningTree(allEdges, nodes);
    for (var _i = 0, allEdges_1 = allEdges; _i < allEdges_1.length; _i++) {
        var _a = allEdges_1[_i], _ = _a[0], i = _a[1], j = _a[2];
        if (idealEdges.length >= nodes.length - 1 + config.maxExtraEdges)
            break;
        var edge = new GEdge(nodes[i], nodes[j]); // Convert data formats
        if (!containsEdge(idealEdges, edge))
            idealEdges.push(edge);
    }
    // Classify each current edge, checking whether it is in the ideal set; prune faded edges
    var newEdges = [];
    for (var _b = 0, edges_2 = edges; _b < edges_2.length; _b++) {
        var edge = edges_2[_b];
        edge.fade(containsEdge(idealEdges, edge));
        if (edge.opacity > 0 && edge.nodeA.opacity > 0 && edge.nodeB.opacity > 0)
            newEdges.push(edge);
    }
    // If there is room for new edges, add some missing spanning tree edges (higher priority), then extra edges
    for (var _c = 0, idealEdges_1 = idealEdges; _c < idealEdges_1.length; _c++) {
        var edge = idealEdges_1[_c];
        if (newEdges.length >= nodes.length - 1 + config.maxExtraEdges)
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
    function createSvgElem(tag, attribs) {
        var result = document.createElementNS(svgElem.namespaceURI, tag);
        for (var key in attribs)
            result.setAttribute(key, attribs[key].toString());
        return result;
    }
    // Draw every node
    for (var _i = 0, nodes_4 = nodes; _i < nodes_4.length; _i++) {
        var node = nodes_4[_i];
        gElem.appendChild(createSvgElem("circle", {
            "cx": node.posX,
            "cy": node.posY,
            "r": node.radius,
            "fill": "rgba(129,139,197," + node.opacity.toFixed(3) + ")",
        }));
    }
    // Draw every edge
    for (var _a = 0, edges_3 = edges; _a < edges_3.length; _a++) {
        var edge = edges_3[_a];
        var a = edge.nodeA;
        var b = edge.nodeB;
        var dx = a.posX - b.posX;
        var dy = a.posY - b.posY;
        var mag = Math.hypot(dx, dy);
        if (mag > a.radius + b.radius) { // Draw edge only if circles don't intersect
            dx /= mag; // Make (dx, dy) a unit vector, pointing from B to A
            dy /= mag;
            var opacity = Math.min(Math.min(a.opacity, b.opacity), edge.opacity);
            gElem.appendChild(createSvgElem("line", {
                // Shorten the edge so that it only touches the circumference of each circle
                "x1": a.posX - dx * a.radius,
                "y1": a.posY - dy * a.radius,
                "x2": b.posX + dx * b.radius,
                "y2": b.posY + dy * b.radius,
                "stroke": "rgba(129,139,197," + opacity.toFixed(3) + ")",
            }));
        }
    }
}
/*---- Minor functions ----*/
// Returns a sorted array of edges with weights, for all unique edge pairs. Pure function, no side effects.
function calcAllEdgeWeights(nodes) {
    // Each entry has the form [weight, nodeAIndex, nodeBIndex], where nodeAIndex < nodeBIndex
    var result = [];
    for (var i = 0; i < nodes.length; i++) { // Calculate all n * (n - 1) / 2 edges
        var a = nodes[i];
        for (var j = 0; j < i; j++) {
            var b = nodes[j];
            var weight = Math.hypot(a.posX - b.posX, a.posY - b.posY); // Euclidean distance
            weight /= Math.pow(a.radius * b.radius, config.radiiWeightPower); // Give discount based on node radii
            result.push([weight, i, j]);
        }
    }
    // Sort array by ascending weight
    result.sort(function (a, b) { return a[0] - b[0]; });
    return result;
}
// Returns a new array of edge objects that is a minimal spanning tree on the given set
// of nodes, with edges in ascending order of weight. Pure function, no side effects.
function calcSpanningTree(allEdges, nodes) {
    // Kruskal's MST algorithm
    var result = [];
    var ds = new DisjointSet(nodes.length);
    for (var _i = 0, allEdges_2 = allEdges; _i < allEdges_2.length; _i++) {
        var _a = allEdges_2[_i], _ = _a[0], i = _a[1], j = _a[2];
        if (result.length >= nodes.length - 1)
            break;
        if (ds.mergeSets(i, j))
            result.push(new GEdge(nodes[i], nodes[j])); // Convert data formats
    }
    return result;
}
// Tests whether the given array of edge objects contains an edge with
// the given endpoints (undirected). Pure function, no side effects.
function containsEdge(array, edge) {
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var e = array_1[_i];
        if (e.nodeA == edge.nodeA && e.nodeB == edge.nodeB ||
            e.nodeA == edge.nodeB && e.nodeB == edge.nodeA)
            return true;
    }
    return false;
}
/*---- Graph object classes ----*/
var GObject = /** @class */ (function () {
    function GObject() {
        this.opacity = 0.0;
    }
    GObject.prototype.fade = function (fadeIn) {
        this.opacity = fadeIn ?
            Math.min(this.opacity + config.fadeInPerFrame, 1.0) :
            Math.max(this.opacity - config.fadeOutPerFrame, 0.0);
    };
    return GObject;
}());
var GNode = /** @class */ (function (_super) {
    __extends(GNode, _super);
    function GNode(posX, // Horizontal position in relative coordinates, typically in the range [0.0, relWidth], where relWidth <= 1.0
    posY, // Vertical position in relative coordinates, typically in the range [0.0, relHeight], where relHeight <= 1.0
    radius, // Radius of the node, a positive real number
    velX, // Horizontal velocity in relative units (not pixels)
    velY) {
        var _this = _super.call(this) || this;
        _this.posX = posX;
        _this.posY = posY;
        _this.radius = radius;
        _this.velX = velX;
        _this.velY = velY;
        _this.dPosX = 0;
        _this.dPosY = 0;
        return _this;
    }
    return GNode;
}(GObject));
var GEdge = /** @class */ (function (_super) {
    __extends(GEdge, _super);
    function GEdge(nodeA, // A reference to the node object representing one side of the undirected edge
    nodeB) {
        var _this = _super.call(this) || this;
        _this.nodeA = nodeA;
        _this.nodeB = nodeB;
        return _this;
    }
    return GEdge;
}(GObject));
/*---- Union-find data structure ----*/
// A heavily stripped down version of the code originally from
// https://www.nayuki.io/page/disjoint-set-data-structure .
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
/*---- Initialization ----*/
if (!("hypot" in Math)) { // Polyfill
    Math.hypot = function (x, y) {
        return Math.sqrt(x * x + y * y);
    };
}
initialize();
