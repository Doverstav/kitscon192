interface Graph {
    nodes: Vertex[];

    addNode(node: Vertex);
}

interface Vertex {
    id: string;
    neighbours: Vertex[];

    addEdge(neighbour: Vertex);
}

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

class Room {
    name: string;
    contents: ObjectType;
    connections: Connection [];

    constructor(name: string, contents: ObjectType, connections: Connection []) {
        this.name = name;
        this.contents = contents;
        this.connections = [];
        connections.forEach(
            connection => this.connections.push(new Connection(connection.room, connection.connectionType, connection.direction))
        );
    }

    equals(otherRoom: Room) {
        return this.name === otherRoom.name;
    }
}

class Connection {
    room: Room;
    connectionType: ConnectionType;
    direction: Direction;

    constructor(room: Room, connectionType: ConnectionType, direction: Direction) {
        this.room = room;
        this.connectionType = connectionType;
        this.direction = direction;
    }
}

enum ObjectType {
    KEY = "Key", 
    ORB = "Orb",
    NOTHING = "Nothing"
};

enum Direction {
    NORTH = "North",
    WEST = "West",
    SOUTH = "South",
    EAST = "East"
}

enum ConnectionType {
    DOOR = "Door",
    HALLWAY = "Hallway"
}

class MapObject {
    type: ObjectType;

    constructor(type: ObjectType) {
        this.type = type;
    }
}

class Robot implements WeightedVertex {
    id: string;
    edges: Edge[];

    // Robot can hold one object at a time
    holding: ObjectType;
    location: Room

    constructor(toHold: ObjectType, location: Room) {
        this.holding = toHold;
        this.location = location;
        this.edges = [];
    }

    moveRobot() {
        // Go to adjacent rooms
        this.location.connections.forEach(
            (connection, index) => {
                // If hallway, just go to adjacent room
                if(connection.connectionType === ConnectionType.HALLWAY) {
                    let newRobot = new Robot(this.holding, connection.room);
                    this.addEdge(newRobot, 1);
                }

                // If there is a door and we have a key we can open it
                if(connection.connectionType === ConnectionType.DOOR
                    && this.holding === ObjectType.KEY) {
                        
                        // Create new copy of room we are leaving with connection as Hallway
                        let updatedRoom = new Room(
                            this.location.name,
                            this.location.contents,
                            this.location.connections
                        )
                        // Copy connection and update connections in new room copy
                        let connectionCopy = new Connection(connection.room, ConnectionType.HALLWAY, connection.direction);
                        updatedRoom.connections[index] = connectionCopy;

                        // Update connection in destination room
                        connectionCopy.room.connections.forEach(
                            (otherConnection, index) => {
                                // We have found the connection from the other side 
                                // leading back here
                                if(otherConnection.room.name === this.location.name) {
                                    // Copy connection and set new
                                    let updatedConnection = new Connection(otherConnection.room, ConnectionType.HALLWAY, otherConnection.direction);
                                    connection.room.connections[index] = updatedConnection;
                                }
                            }
                        )

                        // Move robot
                        let newRobot = new Robot(ObjectType.NOTHING, connectionCopy.room);
                        this.addEdge(newRobot, 1);

                }

                // If there is a door but no key, we can force it
                if(connection.connectionType === ConnectionType.DOOR
                    && this.holding === ObjectType.NOTHING) {

                    // Create new copy of room we are leaving with connection as Hallway
                    let updatedRoom = new Room(
                        this.location.name,
                        this.location.contents,
                        this.location.connections
                    )
                    // Copy connection and update connections in new room copy
                    let connectionCopy = new Connection(connection.room, ConnectionType.HALLWAY, connection.direction);
                    updatedRoom.connections[index] = connectionCopy;

                    // Update connection in destination room
                    connectionCopy.room.connections.forEach(
                        (otherConnection, index) => {
                            // We have found the connection from the other side 
                            // leading back here
                            if(otherConnection.room.name === this.location.name) {
                                // Copy connection and set new
                                let updatedConnection = new Connection(otherConnection.room, ConnectionType.HALLWAY, otherConnection.direction);
                                connection.room.connections[index] = updatedConnection;
                            }
                        }
                    )
                    
                    // Move robot
                    let newRobot = new Robot(this.holding, connection.room);
                    this.addEdge(newRobot, 10);
                }
            }
        )

        // Pick up object
        if(this.holding === ObjectType.NOTHING && this.location.contents !== ObjectType.NOTHING) {
            // remove object from room
            let updatedRoom = new Room(
                this.location.name, 
                ObjectType.NOTHING, 
                this.location.connections
            );
            // Create new robot
            let newRobot = new Robot(this.location.contents, updatedRoom);
            // Create edge
            this.addEdge(newRobot, 1);
        }

        // Drop object
        // Can only drop if room is currently empty
        if(this.holding !== ObjectType.NOTHING && this.location.contents === ObjectType.NOTHING) {
            // Put object in room
            let updatedRoom = new Room(
                this.location.name,
                this.holding,
                this.location.connections
            )
            // Create new robot
            let newRobot = new Robot(ObjectType.NOTHING, updatedRoom);
            // Create edge
            this.addEdge(newRobot, 1);
        }
    }

    addEdge(neighbour: Robot, cost: number): void {
        this.edges.push(new SimpleEdge(this, neighbour, cost));
    }

    getEdges(): Edge[] {
        if(this.edges.length === 0) {
            this.moveRobot();
        }

        return this.edges;
    }

    toString() {
        let stringRepresentation = "";
        stringRepresentation = stringRepresentation.concat(`Name: ${this.location.name}\nHolding: ${this.holding}\n`)
        this.location.connections.forEach(
            connection => {
                stringRepresentation = stringRepresentation.concat(`{\n\t${connection.room.name}\n\t${connection.connectionType}\n\t${connection.direction}\n}\n`)
            }
        );
        this.edges.forEach(
            edge => {
                stringRepresentation = stringRepresentation.concat(`${(edge.from as Robot).location.name} -${edge.cost}-> ${(edge.to as Robot).location.name}\n`)
            }
        )

        return stringRepresentation;
    }

    equals(toCompare: Robot): boolean {
        // Robots are equal of they are in the same room
        // If holding is specified, it must also be equal
        let locationIsSignificant = true;
        let holdingIsSignificant = true;
        let roomContentsIsSignificant = true;

        if(toCompare.location) {
            locationIsSignificant = this.location.name === toCompare.location.name;
        }

        if(toCompare.location && toCompare.location.contents) {
            roomContentsIsSignificant = this.location.contents === toCompare.location.contents;
        }

        if(toCompare.holding) {
            holdingIsSignificant = this.holding === toCompare.holding;
        }

        return locationIsSignificant 
                && holdingIsSignificant
                && roomContentsIsSignificant;
    }
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

let room1: Room = new Room(
    'a',
    ObjectType.NOTHING,
    []
)

let room2: Room = new Room(
    'b',
    ObjectType.KEY,
    []
)

let room3: Room = new Room(
    'c',
    ObjectType.NOTHING,
    []
)

let room4: Room = new Room(
    'd',
    ObjectType.ORB,
    []
)

let room5: Room = new Room(
    'e',
    ObjectType.NOTHING,
    []
)

let room6: Room = new Room(
    'f',
    ObjectType.ORB,
    []
)

room1.connections = [
    {
        room: room2,
        connectionType: ConnectionType.DOOR,
        direction: Direction.EAST
    } 
];

room2.connections = [
    {
        room: room1,
        connectionType: ConnectionType.DOOR,
        direction: Direction.WEST
    },
    {
        room: room3,
        connectionType: ConnectionType.DOOR,
        direction: Direction.NORTH
    },
    {
        room: room4,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.SOUTH
    },
    {
        room: room5,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.EAST
    }
];

room3.connections = [
    {
        room: room2,
        connectionType: ConnectionType.DOOR,
        direction: Direction.SOUTH
    }
]

room4.connections = [
    {
        room: room2,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.NORTH
    }
]

room5.connections = [
    {
        room: room2,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.WEST
    },
    {
        room: room6,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.EAST
    }
]

room6.connections = [
    {
        room: room5,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.WEST
    }
]

function createRoomGrid(initialRoom: Room) {
    // Keep track of max/min indexes so we can normalize them later
    let smallestX = 0;
    let largestX = 0;
    let smallestY = 0;
    let largestY = 0;

    // Set starting room as origo
    let processedRooms = [{x: 0, y: 0, room: initialRoom}];
    let roomsToProcess = [{x: 0, y: 0, room: initialRoom}];

    // While there are rooms to process
    while(roomsToProcess.length !== 0) {
        // Get next room to process
        let roomToProcess = roomsToProcess.shift();
        // Get connections
        let connections = roomToProcess.room.connections;

        // For each connection
        connections.forEach(connection => {
            // Check that we have not already processed this room
            if(!isRoomProcessed(processedRooms, connection.room)){
                // Add to processed rooms
                // Update smallest/largest depending on direction
                if(connection.direction === Direction.NORTH) {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x, y: roomToProcess.y - 1, room: connection.room};
                    // Update smallest y
                    if(smallestY > roomToProcess.y - 1) {
                        smallestY = roomToProcess.y - 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }

                if(connection.direction === Direction.EAST) {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x + 1, y: roomToProcess.y, room: connection.room};
                    // Update smallest y
                    if(largestX < roomToProcess.x + 1) {
                        largestX = roomToProcess.x + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                
                if(connection.direction === Direction.SOUTH) {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x, y: roomToProcess.y + 1, room: connection.room};
                    // Update smallest y
                    if(largestY < roomToProcess.y + 1) {
                        largestY = roomToProcess.y + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }

                if(connection.direction === Direction.WEST) {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x - 1, y: roomToProcess.y, room: connection.room};
                    // Update smallest y
                    if(smallestX > roomToProcess.x - 1) {
                        smallestX = roomToProcess.x - 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
            }
        })
    }

    // Normalise coordinates (i.e minimum is 0)
    processedRooms.forEach(procRoom => {
        // As smallestX/smallestY are 0 or negative, 
        // subtracting their value will normalise the coordinates
        procRoom.x = procRoom.x - smallestX;
        procRoom.y = procRoom.y - smallestY;
    })

    // Set largestx/largestY to correct values
    largestX = largestX - smallestX;
    largestY = largestY - smallestY;

    // Create grid to store rooms in
    let roomGrid = [];
    // Add enough empty array so grid can be set
    for(let i = 0; i <= largestY; i++) {
        // Create line with all undefineds
        let gridLine = []
        for(let j = 0; j <= largestX; j++) {
            gridLine[j] = undefined;
        }
        roomGrid[i] = gridLine;
    }

    processedRooms.forEach(procRoom => roomGrid[procRoom.y][procRoom.x] = procRoom.room);

    return roomGrid;
}

function isRoomProcessed(procesedRooms: {x: number, y:number, room: Room} [], room: Room) {
    for(let i = 0; i < procesedRooms.length; i++) {
        if(procesedRooms[i].room.name === room.name) {
            return true;
        }
    }
    return false;
}

function updateRoomGrid() {

}

function printRoomGrid(roomGrid: Room[][]): string {
    let gridAsString = "";
    for(let y = 0; y < roomGrid.length; y++){
        let line1 = "";
        let line2 = "";
        let line3 = "";
        for(let x = 0; x < roomGrid[y].length; x++) {
            // Get string represenation of room
            let stringRoom = printRoom(roomGrid[y][x]);
            // Extract all lines
            let lines = stringRoom.split("\n");
            // Save lines in correct variable
            line1 = line1.concat(lines[0]);
            line2 = line2.concat(lines[1]);
            line3 = line3.concat(lines[2]);
        }
        // Combine all lines into one string
        let rowAsString = line1.concat("\n", line2, "\n", line3, "\n");
        // Save row in grid representation
        gridAsString = gridAsString.concat(rowAsString);
    }
    return gridAsString;
}

function printRoom(room: Room) {
    if(room){
        let roomName = room.name;
        let roomContent = " ";
        let northConnection = " ";
        let eastConnection = " ";
        let southConnection = " ";
        let westConnection = " ";

        if(room.contents === ObjectType.KEY) {
            roomContent = "K";
        } else if(room.contents === ObjectType.ORB) {
            roomContent = "O";
        }

        room.connections.forEach(connection => {
            if(connection.direction === Direction.NORTH) {
                if(connection.connectionType == ConnectionType.DOOR) {
                    northConnection = "D";
                }
            }
            if(connection.direction === Direction.EAST) {
                if(connection.connectionType == ConnectionType.DOOR) {
                    eastConnection = "D";
                }
            }
            if(connection.direction === Direction.SOUTH) {
                if(connection.connectionType == ConnectionType.DOOR) {
                    southConnection = "D";
                }
            }
            if(connection.direction === Direction.WEST) {
                if(connection.connectionType == ConnectionType.DOOR) {
                    westConnection = "D";
                }
            }
        });

        return `${roomName}${northConnection}┐\n${westConnection}${roomContent}${eastConnection}\n└${southConnection}┘`;
    } else {
        return `   \n   \n   `;
    }
}

function init() {
    console.log("I am init!")
    
    // Create map
    createMap();
    // Paint map
}

function createMap() {

}

function firstDraw() {
    
}