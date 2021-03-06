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

interface StringRoom {
    name: string;
    contents: ObjectType;
    connections: string[];
}

function copyRoom(room: StringRoom): StringRoom {
    return {name: room.name, contents: room.contents, connections: room.connections.slice()};
}

interface gridRoom {
    x: number;
    y: number;
    room: StringRoom;
    robot: boolean;
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
    location: number;
    rooms: StringRoom [];

    constructor(toHold: ObjectType, rooms: StringRoom[], location: number) {
        this.holding = toHold;
        this.rooms = rooms;
        this.location = location;
        this.edges = [];
    }

    moveRobot() {
        let currentLocation = this.rooms[this.location];
        // For each connection
        currentLocation.connections.forEach(connection => {
            let tokenizedConnection = connection.split(" ");
            let direction = tokenizedConnection[0].toLocaleUpperCase();
            let connectionType = tokenizedConnection[1].toLocaleUpperCase();
            let roomName = tokenizedConnection[2].toLocaleUpperCase();

            // Go through hallway
            if(connectionType === "H") {
                let nextState = new Robot(this.holding, this.copyAllRooms(), this.getRoomIndex(roomName))
                this.addEdge(nextState, 1);
            }

            // If not holding key, force open door
            if(connectionType === "D" && this.holding !== ObjectType.KEY) {
                let copiedRooms = this.copyAllRooms();
                this.updateRoomConnection(this.rooms[this.location].name, roomName, "H", copiedRooms);
                //let nextState = new Robot(this.holding, copiedRooms, this.getRoomIndex(roomName));
                let nextState = new Robot(this.holding, copiedRooms, this.location);
                this.addEdge(nextState, 10);
            }

            // If holding key, use key to open door
            if(connectionType === "D" && this.holding === ObjectType.KEY) {
                let copiedRooms = this.copyAllRooms();
                this.updateRoomConnection(this.rooms[this.location].name, roomName, "H", copiedRooms);
                //let nextState = new Robot(ObjectType.NOTHING, copiedRooms, this.getRoomIndex(roomName));
                let nextState = new Robot(ObjectType.NOTHING, copiedRooms, this.location);
                this.addEdge(nextState, 1);
            }
        })

        // If not holding object, pick up object
        if(this.holding === ObjectType.NOTHING && currentLocation.contents !== ObjectType.NOTHING) {
            // Save room contents
            let roomContents = currentLocation.contents;
            // Copy all rooms
            let copiedRooms = this.copyAllRooms();
            // Remove contents from room
            copiedRooms[this.location].contents = ObjectType.NOTHING;

            // Create next state
            let nextState = new Robot(roomContents, copiedRooms, this.location);
            this.addEdge(nextState, 0.25);
        }

        // If holding object, drop object
        if(this.holding !== ObjectType.NOTHING && currentLocation.contents === ObjectType.NOTHING) {
            // Copy all rooms
            let copiedRooms = this.copyAllRooms();
            // Set contents in location
            copiedRooms[this.location].contents = this.holding;

            // Create next state
            let nextState = new Robot(ObjectType.NOTHING, copiedRooms, this.location);
            this.addEdge(nextState, 0.25);
        }
    }

    updateRoomConnection(roomNameFrom: string, roomNameTo: string, connectionType: string, roomList: StringRoom []) {
        roomNameFrom = roomNameFrom.toLocaleUpperCase();
        roomNameTo = roomNameTo.toLocaleUpperCase();
        for(let i = 0; i < roomList.length; i++) {
            if(roomList[i].name.toLocaleUpperCase() === roomNameFrom) {
                roomList[i].connections.forEach((connection, index) => {
                    let tokenizedConnection = connection.split(" ");
                    let direction = tokenizedConnection[0].toLocaleUpperCase();
                    //let connectionType = tokenizedConnection[1].toLocaleUpperCase();
                    let roomName = tokenizedConnection[2].toLocaleUpperCase();
                    
                    if(roomName === roomNameTo) {
                        roomList[i].connections[index] = `${direction} ${connectionType} ${roomNameTo}`;
                    }
                })
            }

            if(roomList[i].name.toLocaleUpperCase() === roomNameTo) {
                roomList[i].connections.forEach((connection, index) => {
                    let tokenizedConnection = connection.split(" ");
                    let direction = tokenizedConnection[0].toLocaleUpperCase();
                    //let connectionType = tokenizedConnection[1].toLocaleUpperCase();
                    let roomName = tokenizedConnection[2].toLocaleUpperCase();

                    if(roomName === roomNameFrom) {
                        roomList[i].connections[index] = `${direction} ${connectionType} ${roomNameFrom}`;
                    }
                })
            }
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

    getRoom(roomName: string): StringRoom {
        for(let i = 0; i < this.rooms.length; i++) {
            if(this.rooms[i].name.toLocaleLowerCase() === roomName.toLocaleLowerCase()) {
                return this.rooms[i];
            }
        }
        return undefined;
    }

    getRoomIndex(roomName: string): number {
        for(let i = 0; i < this.rooms.length; i++) {
            if(this.rooms[i].name.toLocaleLowerCase() === roomName.toLocaleLowerCase()) {
                return i;
            }
        }
        return -1;
    }

    copyAllRooms(): StringRoom [] {
        let newList = [];
        this.rooms.forEach(room => newList.push(copyRoom(room)));
        return newList;
    }

    equals(toCompare: Robot): boolean {
        // Robots are equal of they are in the same room
        // If holding is specified, it must also be equal
        let locationIsSignificant = true;
        let holdingIsSignificant = true;
        let roomContentsIsSignificant = true;

        if(toCompare.location !== undefined) {
            locationIsSignificant = this.rooms[this.location].name === toCompare.rooms[toCompare.location].name;
        }

        if(toCompare.location !== undefined && toCompare.rooms[toCompare.location].contents) {
            roomContentsIsSignificant = this.rooms[this.location].contents === toCompare.rooms[toCompare.location].contents;
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
    // Check if we are already at goal
    if(start.equals(end)) {
        return [];
    }

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
        if(compareWorldState(checkedNodes[i] as Robot, node as Robot)) {
            return true;
        }
    }
    return false;
}

function compareWorldState(worldA: Robot, worldB: Robot) {
    // Compare location
    if(worldA.location !== worldB.location) {
        return false;
    }
    // Compare holding
    if(worldA.holding !== worldB.holding) {
        return false;
    }
    // Compare every room
    for(let i = 0; i < worldA.rooms.length; i++) {
        if(worldA.rooms[i].name !== worldB.rooms[i].name) {
            return false;
        }
        if(worldA.rooms[i].contents !== worldB.rooms[i].contents) {
            return false;
        }
        
        for(let j = 0; j < worldA.rooms[i].connections.length; j++) {
            if(worldA.rooms[i].connections[j] !== worldB.rooms[i].connections[j]) {
                return false;
            }
        }
    }
    return true;
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

function createRoomGrid(initialRoom: Robot) {
    // Keep track of max/min indexes so we can normalize them later
    let smallestX = 0;
    let largestX = 0;
    let smallestY = 0;
    let largestY = 0;

    // Set starting room as origo
    let processedRooms: gridRoom [] = [{x: 0, y: 0, room: initialRoom.rooms[initialRoom.location], robot: true}];
    let roomsToProcess: gridRoom [] = [{x: 0, y: 0, room: initialRoom.rooms[initialRoom.location], robot: true}];

    // While there are rooms to process
    while(roomsToProcess.length !== 0) {
        // Get next room to process
        let roomToProcess = roomsToProcess.shift();
        // Get connections
        let connections = roomToProcess.room.connections;

        // For each connection
        connections.forEach(connection => {
            // Check that we have not already processed this room
            let tokenizedConnection = connection.split(" ");
            let direction = tokenizedConnection[0];
            let connectionType = tokenizedConnection[1];
            let roomName = tokenizedConnection[2];
            let connectingRoom = initialRoom.getRoom(roomName);

            if(!isRoomProcessed(processedRooms, connectingRoom)){
                // Add to processed rooms
                // Update smallest/largest depending on direction
                if(direction === "N") {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x, y: roomToProcess.y - 1, room: connectingRoom, robot: false};
                    // Update smallest y
                    if(smallestY > roomToProcess.y - 1) {
                        smallestY = roomToProcess.y - 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }

                if(direction === "E") {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x + 1, y: roomToProcess.y, room: connectingRoom, robot: false};
                    // Update smallest y
                    if(largestX < roomToProcess.x + 1) {
                        largestX = roomToProcess.x + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                
                if(direction === "S") {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x, y: roomToProcess.y + 1, room: connectingRoom, robot: false};
                    // Update smallest y
                    if(largestY < roomToProcess.y + 1) {
                        largestY = roomToProcess.y + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }

                if(direction === "W") {
                    // Create processed room
                    let processedRoom = {x: roomToProcess.x - 1, y: roomToProcess.y, room: connectingRoom, robot: false};
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
    let roomGrid: gridRoom [][] = [];
    // Add enough empty array so grid can be set
    for(let i = 0; i <= largestY; i++) {
        // Create line with all undefineds
        let gridLine = []
        for(let j = 0; j <= largestX; j++) {
            gridLine[j] = undefined;
        }
        roomGrid[i] = gridLine;
    }

    processedRooms.forEach(procRoom => roomGrid[procRoom.y][procRoom.x] = procRoom);

    return roomGrid;
}

/* function updateRoomGrid(roomGrid: {x: number, y: number, room: Room, robot: boolean} [][], room: Room) {
    for(let y = 0; y < roomGrid.length; y++) {
        for(let x = 0; x < roomGrid[y].length; x++) {
            if(roomGrid[y][x] && roomGrid[y][x].room.name === room.name) {
                roomGrid[y][x] = {...roomGrid[y][x], room, robot: true};
            } else if(roomGrid[y][x]) {
                roomGrid[y][x] = {...roomGrid[y][x], robot: false};
            }
        }
    }
} */

function isRoomProcessed(procesedRooms: gridRoom [], room: StringRoom) {
    for(let i = 0; i < procesedRooms.length; i++) {
        if(procesedRooms[i].room.name === room.name) {
            return true;
        }
    }
    return false;
}

function printRoomGrid(roomGrid: gridRoom [][]): string {
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

function printRoom(gridRoom: gridRoom) {
    if(gridRoom){
        let room = gridRoom.room;
        let roomName = room.name;
        let robotContent = "  ";
        let roomContent = " ";
        let northConnection = `─`;
        let eastConnection = `│`;
        let southConnection = `─`;
        let westConnection = `│`;

        if(gridRoom.robot) {
            robotContent = "<span class=\"robot\">:)</span>";
        }
        
        if(room.contents === ObjectType.KEY) {
            roomContent = "<span class=\"key\">K</span>";
        } else if(room.contents === ObjectType.ORB) {
            roomContent = "<span class=\"orb\">O</span>";
        }

        room.connections.forEach(connection => {
            let tokenizedConnection = connection.split(" ");
            let direction = tokenizedConnection[0];
            let connectionType = tokenizedConnection[1];
            if(direction === "N") {
                if(connectionType == "D") {
                    northConnection = "<span class=\"door\">D</span>";
                } else {
                    northConnection = " ";
                }
            }
            if(direction === "E") {
                if(connectionType == "D") {
                    eastConnection = "<span class=\"door\">D</span>";
                } else {
                    eastConnection = " ";
                }
            }
            if(direction === "S") {
                if(connectionType == "D") {
                    southConnection = "<span class=\"door\">D</span>";
                } else {
                    southConnection = " ";
                }
            }
            if(direction === "W") {
                if(connectionType == "D") {
                    westConnection = "<span class=\"door\">D</span>";
                } else {
                    westConnection = " ";
                }
            }
        });

        return `${roomName}─${northConnection}─┐\n${westConnection}${roomContent}${robotContent}${eastConnection}\n└─${southConnection}─┘`;
    } else {
        return `     \n     \n     `;
    }
}

let currentRoom : Robot;
let roomGrid:  gridRoom [][];

function init() {
    // Parse goal when enter is pressed
    document.addEventListener('keydown', (event) => {
        let keyName = event.key;

        if(keyName === 'Enter') {
            parseGoal();
        }
    });

    // Create map
    currentRoom = createMap();
    // Create roomgrid
    roomGrid = createRoomGrid(currentRoom);
    // Paint map
    render(roomGrid, currentRoom);
}

function createMap() {
    // Default map
    let room1: StringRoom = {
        name: 'a',
        contents: ObjectType.NOTHING,
        connections: ["S H B"]
    }

    let room2: StringRoom = {
        name: 'b',
        contents: ObjectType.NOTHING,
        connections: ["N H A", "S H C", "E H D"]
    }

    let room3: StringRoom = {
        name: 'c',
        contents: ObjectType.NOTHING,
        connections: ["N H B"]
    }

    let room4: StringRoom = {
        name: 'd',
        contents: ObjectType.KEY,
        connections: ["W H B", "E D E"]
    }

    let room5: StringRoom = {
        name: 'e',
        contents: ObjectType.NOTHING,
        connections: ["W D D", "N H F", "E H I", "S D H"]
    }

    let room6: StringRoom = {
        name: 'f',
        contents: ObjectType.NOTHING,
        connections: ["S H E", "N H G"]
    }

    let room7: StringRoom = {
        name: 'g',
        contents: ObjectType.ORB,
        connections: ["S H F"]
    }

    let room8: StringRoom = {
        name: 'h',
        contents: ObjectType.ORB,
        connections: ["N D E"]
    }

    let room9: StringRoom = {
        name: 'i',
        contents: ObjectType.NOTHING,
        connections: ["W H E", "E H J"]
    }

    let room10: StringRoom = {
        name: 'j',
        contents: ObjectType.NOTHING,
        connections: ["W H I", "N H K", "E D L"]
    }

    let room11: StringRoom = {
        name: 'k',
        contents: ObjectType.KEY,
        connections: ["S H J"]
    }

    let room12: StringRoom = {
        name: 'l',
        contents: ObjectType.ORB,
        connections: ["W D J"]
    }

    return new Robot(ObjectType.NOTHING, [room1, room2, room3, room4, room5, room6, room7, room8, room9, room10, room11, room12], 0);
}

/* function createMap() {
    // This map shows that the robot will take the long way around to 
    //get a key and open a door for easier passage back
    let room1: StringRoom = {
        name: 'a',
        contents: ObjectType.NOTHING,
        connections: ["E D J", "S H B"]
    }

    let room2: StringRoom = {
        name: 'b',
        contents: ObjectType.NOTHING,
        connections: ["N H A", "S H C"]
    }

    let room3: StringRoom = {
        name: 'c',
        contents: ObjectType.NOTHING,
        connections: ["N H B", "E H D"]
    }

    let room4: StringRoom = {
        name: 'd',
        contents: ObjectType.NOTHING,
        connections: ["W H C", "E H E"]
    }

    let room5: StringRoom = {
        name: 'e',
        contents: ObjectType.NOTHING,
        connections: ["W H D", "E H F"]
    }

    let room6: StringRoom = {
        name: 'f',
        contents: ObjectType.NOTHING,
        connections: ["W H E", "N H G"]
    }

    let room7: StringRoom = {
        name: 'g',
        contents: ObjectType.NOTHING,
        connections: ["S H F", "N H H"]
    }

    let room8: StringRoom = {
        name: 'h',
        contents: ObjectType.NOTHING,
        connections: ["S H G", "W H I"]
    }

    let room9: StringRoom = {
        name: 'i',
        contents: ObjectType.ORB,
        connections: ["E H H", "W H J"]
    }

    let room10: StringRoom = {
        name: 'j',
        contents: ObjectType.KEY,
        connections: ["W D A", "E H I"]
    }

    return new Robot(ObjectType.NOTHING, [room1, room2, room3, room4, room5, room6, room7, room8, room9, room10], 0);
} */

/* function createMap() {
    // This is the original testmap
    let room1: StringRoom = {
        name: 'a',
        contents: ObjectType.NOTHING,
        connections: ["E D B"]
    }
    
    let room2: StringRoom = {
        name: 'b',
        contents: ObjectType.KEY,
        connections: ["W D A", "N D C", "E H E", "S H D"]
    }
    
    let room3: StringRoom = {
        name: 'c',
        contents: ObjectType.NOTHING,
        connections: ["S D B"]
    }
    
    let room4: StringRoom = {
        name: 'd',
        contents: ObjectType.ORB,
        connections: ["N H B"]
    }
    
    let room5: StringRoom = {
        name: 'e',
        contents: ObjectType.NOTHING,
        connections: ["W H B", "E H F"]
    }
    
    let room6: StringRoom = {
        name: 'f',
        contents: ObjectType.ORB,
        connections: ["W H E"]
    }

    return new Robot(ObjectType.NOTHING, [room1, room2, room3, room4, room5, room6], 0);
} */

/* function createMap() {
    // This map shows that the robot will fetch a key to open a door
    let room1: StringRoom = {
        name: 'a',
        contents: ObjectType.NOTHING,
        connections: ["E D B"]
    }

    let room2: StringRoom = {
        name: 'b',
        contents: ObjectType.NOTHING,
        connections: ["W D A", "N D C", "E H E", "S H D"]
    }

    let room3: StringRoom = {
        name: 'c',
        contents: ObjectType.ORB,
        connections: ["S D B"]
    }

    let room4: StringRoom = {
        name: 'd',
        contents: ObjectType.NOTHING,
        connections: ["N H B"]
    }

    let room5: StringRoom = {
        name: 'e',
        contents: ObjectType.NOTHING,
        connections: ["W H B", "E H F"]
    }

    let room6: StringRoom = {
        name: 'f',
        contents: ObjectType.KEY,
        connections: ["W H E"]
    }

    return new Robot(ObjectType.NOTHING, [room1, room2, room3, room4, room5, room6], 0);
} */

/* function createMap() {
    // This map shows that the robot will NOT fetch a key to open a
    // door if the key is too far away
    let room1: StringRoom = {
        name: 'a',
        contents: ObjectType.NOTHING,
        connections: ["E D B"]
    }
    
    let room2: StringRoom = {
        name: 'b',
        contents: ObjectType.NOTHING,
        connections: ["W D A", "N D C", "E H E", "S H D"]
    }
    
    let room3: StringRoom = {
        name: 'c',
        contents: ObjectType.ORB,
        connections: ["S D B"]
    }
    
    let room4: StringRoom = {
        name: 'd',
        contents: ObjectType.NOTHING,
        connections: ["N H B"]
    }
    
    let room5: StringRoom = {
        name: 'e',
        contents: ObjectType.NOTHING,
        connections: ["W H B", "E H F"]
    }
    
    let room6: StringRoom = {
        name: 'f',
        contents: ObjectType.NOTHING,
        connections: ["W H E", "E H G"]
    }
    
    let room7: StringRoom = {
        name: 'g',
        contents: ObjectType.NOTHING,
        connections: ["W H F", "E H H"]
    }
    
    let room8: StringRoom = {
        name: 'h',
        contents: ObjectType.NOTHING,
        connections: ["W H G", "E H I"]
    }
    
    let room9: StringRoom = {
        name: 'i',
        contents: ObjectType.KEY,
        connections: ["W H H"]
    }

    return new Robot(ObjectType.NOTHING, [room1, room2, room3, room4, room5, room6, room7, room8, room9], 0);
} */

/* function createMap() {
    // This map is too large and busy to be useful
    let room1: StringRoom = {
        name: 'a',
        contents: ObjectType.NOTHING,
        connections: ["N H B", "S H C", "E H D"]
    }
    
    let room2: StringRoom = {
        name: 'b',
        contents: ObjectType.NOTHING,
        connections: ["S H A"]
    }
    
    let room3: StringRoom = {
        name: 'c',
        contents: ObjectType.NOTHING,
        connections: ["N H A"]
    }
    
    let room4: StringRoom = {
        name: 'd',
        contents: ObjectType.NOTHING,
        connections: ["W H A", "N H E", "E H M", "S H S"]
    }
    
    let room5: StringRoom = {
        name: 'e',
        contents: ObjectType.NOTHING,
        connections: ["S H D", "N D L", "E H F"]
    }
    
    let room6: StringRoom = {
        name: 'f',
        contents: ObjectType.NOTHING,
        connections: ["W H E", "N H G"]
    }
    
    let room7: StringRoom = {
        name: 'g',
        contents: ObjectType.NOTHING,
        connections: ["S H F", "N H H"]
    }
    
    let room8: StringRoom = {
        name: 'h',
        contents: ObjectType.NOTHING,
        connections: ["S H G", "E H Z"]
    }
    
    let room8a: StringRoom = {
        name: 'z',
        contents: ObjectType.NOTHING,
        connections: ["W H H", "N H !"]
    }
    
    let room8b: StringRoom = {
        name: '!',
        contents: ObjectType.NOTHING,
        connections: ["S H Z", "W H I"]
    }
    
    let room9: StringRoom = {
        name: 'i',
        contents: ObjectType.NOTHING,
        connections: ["E H !", "W H J"]
    }
    
    let room10: StringRoom = {
        name: 'j',
        contents: ObjectType.NOTHING,
        connections: ["E H I", "S H K"]
    }
    
    let room11: StringRoom = {
        name: 'k',
        contents: ObjectType.ORB,
        connections: ["N H J", "S H L"]
    }
    
    let room12: StringRoom = {
        name: 'l',
        contents: ObjectType.KEY,
        connections: ["N H K", "S D E"]
    }
    
    let room13: StringRoom = {
        name: 'm',
        contents: ObjectType.NOTHING,
        connections: ["W H D", "E H N"]
    }
    
    let room14: StringRoom = {
        name: 'n',
        contents: ObjectType.NOTHING,
        connections: ["W H M", "N D R", "E H O"]
    }
    
    let room15: StringRoom = {
        name: 'o',
        contents: ObjectType.NOTHING,
        connections: ["W H N", "E H P"]
    }
    
    let room16: StringRoom = {
        name: 'p',
        contents: ObjectType.NOTHING,
        connections: ["W H O", "N H Q"]
    }
    
    let room17: StringRoom = {
        name: 'q',
        contents: ObjectType.KEY,
        connections: ["S H P"]
    }
    
    let room18: StringRoom = {
        name: 'r',
        contents: ObjectType.ORB,
        connections: ["S D N"]
    }
    
    let room19: StringRoom = {
        name: 's',
        contents: ObjectType.NOTHING,
        connections: ["N H D", "S D Y", "E H T"]
    }
    
    let room20: StringRoom = {
        name: 't',
        contents: ObjectType.NOTHING,
        connections: ["W H S", "E H U"]
    }
    
    let room21: StringRoom = {
        name: 'u',
        contents: ObjectType.NOTHING,
        connections: ["W H T", "E H V"]
    }
    
    let room22: StringRoom = {
        name: 'v',
        contents: ObjectType.NOTHING,
        connections: ["W H U", "S H W"]
    }
    
    let room23: StringRoom = {
        name: 'w',
        contents: ObjectType.NOTHING,
        connections: ["N H V", "W H X"]
    }
    
    let room24: StringRoom = {
        name: 'x',
        contents: ObjectType.KEY,
        connections: ["E H W"]
    }
    
    let room25: StringRoom = {
        name: 'y',
        contents: ObjectType.ORB,
        connections: ["N D S"]
    }
    
    return new Robot(
        ObjectType.NOTHING, 
        [
            room1, room2, room3, room4, room5, room6, 
            room7, room8, room8a, room8b, room9, room10, 
            room11, room12, room13, room14, room15, room16, 
            room17, room18, room19, room20, room21, room22, 
            room23, room24, room25
        ],
        0
    );
} */

function drawRobotPath(path: Edge [], roomGrid: gridRoom [][]) {
    document.querySelector("#goalFeedback").innerHTML = "Executing";
    if(path.length !== 0) {
        setTimeout(() => {
            let pathFragment = path.shift();
            let nextMapState = pathFragment.to as Robot;
            render(createRoomGrid(nextMapState), nextMapState);
            drawRobotPath(path, roomGrid);
        }, 1000);
    } else {
        document.querySelector("#goalFeedback").innerHTML = "";
        return;
    }
}

function render(roomGrid: gridRoom [][], currentRobot: Robot) {
    drawRobotState(currentRobot);
    drawMap(roomGrid);
}

function drawRobotState(robot: Robot) {
    document.querySelector("#locationText").innerHTML = robot.rooms[robot.location].name;
    let contentsPresentation = " ";
    if(robot.holding === ObjectType.KEY) {
        contentsPresentation = `<span class="key">${robot.holding.toLocaleUpperCase()}</span>`;
    } else if(robot.holding === ObjectType.ORB) {
        contentsPresentation = `<span class="orb">${robot.holding.toLocaleUpperCase()}</span>`;
    } else {
        contentsPresentation = robot.holding;
    }
    document.querySelector("#holdingText").innerHTML = contentsPresentation;
}

function drawMap(roomGrid: gridRoom [][]) {
    // Get map as string
    let mapAsString = printRoomGrid(roomGrid);
    // Paint it in frontend
    document.querySelector("#mapDiv").innerHTML = mapAsString;
}

function parseGoal() {
    document.querySelector("#goalFeedback").innerHTML = "";
    let goalInput = document.querySelector("#goalInput") as HTMLInputElement;
    let goal = goalInput.value;
    let tokens = goal.split(" ");
    let command = tokens.shift().toLocaleLowerCase();
    
    if(command === "put") {
        // Put down object, possibly in a room
        let dropObject = tokens[0];
        let targetRoomName = tokens[1];
        let targetRoom = undefined;
        let targetRoomIndex = undefined;
        if(targetRoomName) {
            targetRoom = [{name: targetRoomName, contents: stringToObjectType(dropObject), connections: []}];
            targetRoomIndex = 0;
        }

        let goalRobot = new Robot(ObjectType.NOTHING, targetRoom, targetRoomIndex);
        executeGoal(goalRobot);
    } else if(command === "goto") {
        // Goto some room, possibly holding an object
        let gotoRoom = tokens[0];
        let goalObject = tokens[1];
        let objectToHold = undefined
        if(goalObject) {
            objectToHold = stringToObjectType(goalObject);
        }

        let goalRobot = new Robot(objectToHold, [{name: gotoRoom, contents: undefined, connections: undefined}], 0);
        executeGoal(goalRobot);
    } else if(command === "get") {
        // Pick up some object, possibly in a specific room
        let fetchObject = tokens[0];
        let targetRoomName = tokens[1];
        let targetRoom = undefined;
        let targetRoomIndex = undefined;
        if(targetRoomName) {
            targetRoom = [{name: targetRoomName, contents: ObjectType.NOTHING, connections: []}];
            targetRoomIndex = 0;
        }

        let goalRobot = new Robot(stringToObjectType(fetchObject), targetRoom, targetRoomIndex);
        executeGoal(goalRobot);
    } else {
        document.querySelector("#goalFeedback").innerHTML = "Bad command";
    }
}

function executeGoal(goalRobot: Robot) {
    document.querySelector("#goalFeedback").innerHTML = "Searching";
    let pathToGoal = shortestPath(currentRoom, goalRobot);

    if(pathToGoal && pathToGoal.length !== 0) {
        currentRoom = pathToGoal[pathToGoal.length - 1].to as Robot;
        drawRobotPath(pathToGoal.slice(), roomGrid);
    } else if(pathToGoal && pathToGoal.length === 0) {
        document.querySelector("#goalFeedback").innerHTML = "Already at goal";
    } else {
        document.querySelector("#goalFeedback").innerHTML = "No path to goal";
    }
}

function stringToObjectType(stringObject: string) {
    let lowercase = stringObject.toLocaleLowerCase();
    if(lowercase === "key") {
        return ObjectType.KEY;
    } else if(lowercase === "orb") {
        return ObjectType.ORB;
    } else if(lowercase === "nothing") {
        return ObjectType.NOTHING;
    } else {
        return undefined;
    }
}