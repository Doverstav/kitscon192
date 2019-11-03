console.log("hello world!");

interface Graph {
    nodes: Vertex[];

    addNode(node: Vertex);
}

interface Vertex {
    id: string;
    neighbours: Vertex[];

    addEdge(neighbour: Vertex);
}

class SimpleGraph implements Graph {
    nodes: Vertex[];

    constructor(initialNodes: Vertex[]) {
        this.nodes = initialNodes;
    }

    addNode(node: Vertex) { }

    toString(): string {
        let textGraph = "";

        this.nodes.forEach(node => {
            let textNeighbours = node.neighbours
                .map(neighbour => neighbour.id)
                .reduce((acc, id) => acc + `${id}, `, "");

            textGraph = textGraph.concat(`${node.id}: { ${textNeighbours} }\n`);
        });

        return textGraph;
    }
}

class SimpleNode implements Vertex {
    id: string;
    neighbours: Vertex[];

    constructor(id: string, initialNeighbours: Vertex[]) {
        this.id = id;
        this.neighbours = initialNeighbours;
    }

    addEdge(neighbour: Vertex) {
        this.neighbours.push(neighbour);
    }
}

/*
let node1 = new SimpleNode('1', []);
let node2 = new SimpleNode('2', []);
let node3 = new SimpleNode('3', []);
let node4 = new SimpleNode('4', []);
let node5 = new SimpleNode('5', []);
let node6 = new SimpleNode('6', []);

node1.addEdge(node2);
node1.addEdge(node3);
node3.addEdge(node4);
node4.addEdge(node5);

let graph = new SimpleGraph([node1, node2, node3, node4]);

console.log(graph.toString());
*/

interface WeightedVertex {
    id: string;
    edges: Edge[];

    addEdge(neighbour: WeightedVertex, cost: number);
    getEdges();
    equals(toCompare: WeightedVertex);
}

interface Edge {
    from: WeightedVertex;
    to: WeightedVertex;
    cost: number;
}

class WeightedGraph {
    nodes: WeightedNode[];

    constructor(initialNodes: WeightedNode[]) {
        this.nodes = initialNodes;
    }
    
    addNode(node: WeightedNode) {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        let textGraph = "";

        this.nodes.forEach(node => {
            let textNeighbours = node.edges
                .reduce((acc, edge: Edge) => acc + ` -${edge.cost}-> ${edge.to.id} `, "");

            textGraph = textGraph.concat(`${node.id}: { ${textNeighbours} }\n`);
        });

        return textGraph;
    }
}

class WeightedNode implements WeightedVertex {
    id: string;
    edges: Edge[];

    constructor(id: string, initialEdges: Edge[]) {
        this.id = id;
        this.edges = initialEdges;
    }

    addEdge(neighbour: WeightedVertex, cost: number) {
        this.edges.push(new SimpleEdge(this, neighbour, cost));
    }
    
    getEdges() {
        return this.edges;
    }

    equals(toCompare: WeightedVertex) {
        return this.id === toCompare.id;
    }
}

// Useless?!?!
class WorldGraph {
    nodes: WorldNode[];

    constructor(initialNodes: WorldNode[]) {
        this.nodes = initialNodes;
    }
    
    addNode(node: WorldNode) {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        let textGraph = "";

        this.nodes.forEach(node => {
            let textNeighbours = node.edges
                .reduce((acc, edge: Edge) => acc + ` -${edge.cost}-> ${edge.to.id} `, "");

            textGraph = textGraph.concat(`${node.id}: { ${textNeighbours} }\n`);
        });

        return textGraph;
    }
}

class WorldNode implements WeightedVertex {
    id: string;
    edges: Edge[];
    worldState: SimpleWorld;

    constructor(id: string, initialEdges: Edge[], initialState: SimpleWorld) {
        this.id = id;
        this.edges = initialEdges;
        this.worldState = initialState;
    }

    getEdges() {
        if(this.edges.length === 0) {
            this.generateEdges()
        }
        return this.edges;
    }

    generateEdges() {
        let validNextStates = this.worldState.generateValidNextStates();

        validNextStates.forEach( worldState => {
            let createdNeighbour = new WorldNode((Math.random() * 100000).toString(), [], worldState);
            this.edges.push(new SimpleEdge(this, createdNeighbour, 1));
        });
    }

    addEdge(neighbour: WorldNode, cost: number) {
        this.edges.push(new SimpleEdge(this, neighbour, cost));
    }

    equals(toCompare: WorldNode) {
        return this.worldState.equals(toCompare.worldState);
    }
}

class SimpleEdge implements Edge {
    from: WeightedVertex;
    to: WeightedVertex;
    cost: number;

    constructor(from: WeightedVertex, to: WeightedVertex, cost: number) {
        this.from = from;
        this.to = to;
        this.cost = cost;
    }
}

class SimpleWorld {
    position: {x: number, y: number};
    map: (string []) [];

    constructor(map: string [] [], startingPosition: {x:number, y:number}) {
        this.map = map;
        this.position = startingPosition;
    }

    generateValidNextStates(): SimpleWorld [] {
        let allValidNextStates: SimpleWorld [] = [];
        let currentX = this.position.x;
        let currentY = this.position.y;
        
        // Check position to right
        if(currentX + 1 < this.map[currentY].length) {
            // We are in bounds
            if(this.isRoom(currentX + 1, currentY)) {
                // Next position is room and thus valid
                allValidNextStates.push(new SimpleWorld(this.map, {x: currentX + 1, y: currentY}));
            }
        }

        // Check position to left
        if(currentX - 1 >= 0) {
            // We are in bounds
            if(this.isRoom(currentX - 1, currentY)) {
                // Next position is room and thus valid
                allValidNextStates.push(new SimpleWorld(this.map, {x: currentX - 1, y: currentY}));
            }
        }

        // Check position below
        if(currentY + 1 < this.map.length) {
            // We are in bounds
            if(this.isRoom(currentX, currentY + 1)) {
                // Next position is room and thus valid
                allValidNextStates.push(new SimpleWorld(this.map, {x: currentX, y: currentY + 1}));
            }
        }

        // Check position above
        if(currentY - 1 >= 0) {
            // We are in bounds
            if(this.isRoom(currentX, currentY - 1)) {
                // Next position is room and thus valid
                allValidNextStates.push(new SimpleWorld(this.map, {x: currentX, y: currentY - 1}));
            }
        }

        return allValidNextStates;
    }

    private isRoom(x: number, y: number) {
        let room = this.getRoom(x,y);
        return room === 'r';
    }

    private getRoom(x: number, y: number) {
        return this.map[y][x];
    }

    equals(toCompare: SimpleWorld) {
        return this.position.x === toCompare.position.x
                && this.position.y === toCompare.position.y;
    }
}

class Room {
    contents: any;
    connections: {
        room: Room,
        connectionType: any,
        direction: any
    } []
}

function shortestPath(start: WeightedVertex, end: WeightedVertex) {
    let allPaths: (Edge []) [] = [];
    // Init allPaths
    start.getEdges().forEach(
        edge => pushPath(allPaths, [edge])
    );
    
    // start is already "checked"
    let checkedNodes: WeightedVertex [] = [start];

    while(allPaths.length != 0) {
        // Get current shortest path
        let current = allPaths.shift();
        let lastNode = lastNodeInPath(current);

        // Have we arrived at our goal?
        if(lastNode.equals(end)) {
            return current;
        }
        // If not, mark node as checked
        checkedNodes.push(lastNode);
        // Create paths to all neightbours
        lastNode.getEdges().forEach(
            // For every edge to a neighbour
            edge => {
                // Get destination for edge
                let neighbour = edge.to;
                // Make sure we are not in a cycle
                if(!isNodeChecked(checkedNodes, neighbour)) {
                    // If not, create new path by extending it with one edge
                    let newPath = current.concat(edge);
                    // Add to all paths
                    pushPath(allPaths, newPath);
                }
            }
        )
    }
}

function isNodeChecked(checkedNodes: WeightedVertex [], node: WeightedVertex) {
    for(let i = 0; i < checkedNodes.length; i++) {
        if(checkedNodes[i].equals(node)) {
            return true;
        }
    }
    return false;
}

function pushPath(allPaths: (Edge []) [], newPath: Edge []) {
    allPaths.push(newPath);
    allPaths.sort((a, b) => pathLength(a) - pathLength(b));
}

function pathLength(path: Edge []): number {
    return path.map(edge => edge.cost).reduce((acc, cost) => acc + cost);
}

function lastNodeInPath(path: Edge []) {
    return path[path.length - 1].to;
}

function printPath(path: Edge []) {
    let stringPath = "";
    for(let i = 0; i < path.length; i++) {
        stringPath = stringPath.concat(`${path[i].from.id} -${path[i].cost}-> `);
        if(i === path.length - 1) {
            stringPath = stringPath.concat(`${path[i].to.id}`);
        }
    }
    return stringPath;
}

function printWorldPath(path: Edge[]) {
    let stringPath = "";
    for(let i = 0; i < path.length; i++) {
        let from = (path[i].from as WorldNode);

        stringPath = stringPath.concat(`{ x: ${from.worldState.position.x}, y: ${from.worldState.position.y} } -${path[i].cost}-> `);
        if(i === path.length - 1) {
            let to = (path[i].to as WorldNode);
            stringPath = stringPath.concat(`{ x: ${to.worldState.position.x}, y: ${to.worldState.position.y} }`);
        }
    }
    return stringPath;
}

let node1 = new WeightedNode('1', []);
let node2 = new WeightedNode('2', []);
let node3 = new WeightedNode('3', []);
let node4 = new WeightedNode('4', []);
let node5 = new WeightedNode('5', []);
let node6 = new WeightedNode('6', []);

node1.addEdge(node2, 4);
node1.addEdge(node3, 2);
node3.addEdge(node2, 1)
node3.addEdge(node4, 10);
node4.addEdge(node5, 1);

let graph = new WeightedGraph([node1, node2, node3, node4, node5]);

console.log(graph.toString());
console.log(printPath(shortestPath(node1, node5)));

let node1a = new WeightedNode('1', []);
let node2a = new WeightedNode('2', []);
let node3a = new WeightedNode('3', []);
let node4a = new WeightedNode('4', []);
let node5a = new WeightedNode('5', []);
let node6a = new WeightedNode('6', []);

node1a.addEdge(node2a, 1);
node1a.addEdge(node6a, 4);
node2a.addEdge(node3a, 1);
node3a.addEdge(node4a, 1);
node4a.addEdge(node5a, 1);
node5a.addEdge(node6a, 1);

let grapha = new WeightedGraph([node1a, node2a, node3a, node4a, node5a, node6a]);

console.log(grapha.toString());
console.log(printPath(shortestPath(node1a, node6a)));

let node1b = new WeightedNode('1', []);
let node2b = new WeightedNode('2', []);
let node3b = new WeightedNode('3', []);
let node4b = new WeightedNode('4', []);
let node5b = new WeightedNode('5', []);
let node6b = new WeightedNode('6', []);

node1b.addEdge(node2b, 1);
node1b.addEdge(node6b, 10);
node2b.addEdge(node3b, 1);
node3b.addEdge(node4b, 1);
node4b.addEdge(node5b, 1);
node5b.addEdge(node1b, 1);

let graphb = new WeightedGraph([node1b, node2b, node3b, node4b, node5b, node6b]);

console.log(graphb.toString());
console.log(printPath(shortestPath(node1b, node6b)));

let basicWorld = new SimpleWorld([['r', 'x', 'x'],['r', 'r', 'r'],['r', 'x', 'r'], ['r', 'x', 'r'], ['x', 'x', 'r']], {x: 0, y: 0});
let startNode = new WorldNode('a', [], basicWorld);
let goalNode = new WorldNode('b', [], new SimpleWorld([], {x: 2, y: 4}));
console.log(printWorldPath(shortestPath(startNode, goalNode)));

let world = [
    ['r','r','r','r','r'],
    ['r','x','x','x','r'],
    ['r','r','r','x','r'],
    ['x','x','r','x','r'],
    ['x','x','r','r','r']
]

let lessBasicWorld = new SimpleWorld(world, {x:2, y:2});
let lessBasicStartNode = new WorldNode('a', [], lessBasicWorld);
let goalOne = new WorldNode('b', [], new SimpleWorld([], {x:0, y:0}));
let goalTwo = new WorldNode('b', [], new SimpleWorld([], {x:4, y:1}));

console.log(printWorldPath(shortestPath(lessBasicStartNode, goalOne)));
console.log(printWorldPath(shortestPath(lessBasicStartNode, goalTwo)));