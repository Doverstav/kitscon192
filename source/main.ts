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

    copy() {
        return new Room(this.name, this.contents, this.connections);
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

        // TODO: NEW IMPLEMENTATION
        // Create new instances of all rooms
        // Otherwise (as rooms are passed by reference) updating rooms in one robot will update them for all robots
        let locationCopy = this.createNewRoomInstances(this.location);

        // For each connection
        locationCopy.connections.forEach((connection, connectionIndex) => {
            // If hallway, go to next room
            if(connection.connectionType === ConnectionType.HALLWAY) {
                console.log("HALLWAY")
                let nextState = new Robot(this.holding, this.createNewRoomInstances(connection.room));
                this.addEdge(nextState, 4);
            }

            // If door and no key, force door
            if(connection.connectionType === ConnectionType.DOOR && this.holding !== ObjectType.KEY) {
                console.log("FORCE");
                let nextState = new Robot(this.holding, this.createNewRoomInstances(connection.room));
                this.addEdge(nextState, 40);
            }

            // If door and holding key, open door
            if(connection.connectionType === ConnectionType.DOOR && this.holding === ObjectType.KEY) {
                console.log("OPEN");
                let nextState = new Robot(ObjectType.NOTHING, this.createNewRoomInstances(connection.room));
                this.addEdge(nextState, 4);
            }

        })

        // If holding object and there is space in room, drop it
        if(this.holding !== ObjectType.NOTHING && locationCopy.contents === ObjectType.NOTHING) {
            console.log("DROP")
            // Drop object
            locationCopy.contents = this.holding;
            let updatedLocation = new Room(locationCopy.name, this.holding, locationCopy.connections);
            let remadeEverything = this.createNewRoomInstances(updatedLocation);
            // Create next state
            let nextState = new Robot(ObjectType.NOTHING, remadeEverything);
            this.addEdge(nextState, 1);
        }

        // If object is in room, pick it up
        if(this.holding === ObjectType.NOTHING && locationCopy.contents !== ObjectType.NOTHING) {
            console.log("PICKUP")
            // Save object
            let objectToPickup = locationCopy.contents;
            let updatedLocation = new Room(locationCopy.name, ObjectType.NOTHING, locationCopy.connections);
            let remadeEverything = this.createNewRoomInstances(updatedLocation);
            // Create next state
            let nextState = new Robot(objectToPickup, remadeEverything);
            this.addEdge(nextState, 1);
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

    // When creating a new copy of a room, make sure that all connection rooms point to that new copy
    updateRoomConnections(updatedRoom: Room) {
        updatedRoom.connections.forEach(
            connection => {
                connection.room.connections.forEach(connectionBack => {
                    if(connectionBack.room.name === updatedRoom.name) {
                        connectionBack.room = updatedRoom;
                    }
                })
            }
        );
    }

    // Given a room, create new instances of all rooms in this group
    createNewRoomInstances(room: Room) {
        let initialCopy = room.copy()
        let roomsToUpdate = [initialCopy];
        let copiedRooms = [initialCopy];

        while(roomsToUpdate.length !== 0) {
            let roomToUpdate = roomsToUpdate.shift();
            // Make sure all rooms reference this new copy
            this.updateRoomConnections(roomToUpdate);
            // For all rooms connecting to this one
            roomToUpdate.connections.forEach(connection => {
                // If they are not already copied
                if(!this.isRoomCopied(copiedRooms, connection.room)) {
                    let copiedRoom = connection.room.copy()
                    // Add to list of rooms that should be copied
                    roomsToUpdate.push(copiedRoom)
                    // Set it as copied so that we don not do work twice
                    copiedRooms.push(copiedRoom);
                }
            })
        }
        
        return copiedRooms[0];
    }

    isRoomCopied(copiedRooms: Room [], room: Room) {
        for(let i = 0; i < copiedRooms.length; i++) {
            if(copiedRooms[i].name === room.name) {
                return true;
            }
        }
        return false;
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

function createRoomGrid(initialRoom: Robot) {
    // Keep track of max/min indexes so we can normalize them later
    let smallestX = 0;
    let largestX = 0;
    let smallestY = 0;
    let largestY = 0;

    // Set starting room as origo
    let processedRooms = [{x: 0, y: 0, room: initialRoom.location, robot: true}];
    let roomsToProcess = [{x: 0, y: 0, room: initialRoom.location, robot: true}];

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
                    let processedRoom = {x: roomToProcess.x, y: roomToProcess.y - 1, room: connection.room, robot: false};
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
                    let processedRoom = {x: roomToProcess.x + 1, y: roomToProcess.y, room: connection.room, robot: false};
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
                    let processedRoom = {x: roomToProcess.x, y: roomToProcess.y + 1, room: connection.room, robot: false};
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
                    let processedRoom = {x: roomToProcess.x - 1, y: roomToProcess.y, room: connection.room, robot: false};
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
    let roomGrid: {x: number, y: number, room: Room, robot: boolean} [][] = [];
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

function updateRoomGrid(roomGrid: {x: number, y: number, room: Room, robot: boolean} [][], room: Room) {
    console.log(`Updating grid with ${room.name}`);
    for(let y = 0; y < roomGrid.length; y++) {
        for(let x = 0; x < roomGrid[y].length; x++) {
            if(roomGrid[y][x] && roomGrid[y][x].room.name === room.name) {
                roomGrid[y][x] = {...roomGrid[y][x], room, robot: true};
            } else if(roomGrid[y][x]) {
                roomGrid[y][x] = {...roomGrid[y][x], robot: false};
            }
        }
    }
}

function isRoomProcessed(procesedRooms: {x: number, y:number, room: Room} [], room: Room) {
    for(let i = 0; i < procesedRooms.length; i++) {
        if(procesedRooms[i].room.name === room.name) {
            return true;
        }
    }
    return false;
}

function printRoomGrid(roomGrid: {x: number, y: number, room: Room, robot: boolean}[][]): string {
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

function printRoom(gridRoom: {x: number, y: number, room: Room, robot: boolean}) {
    if(gridRoom){
        let room = gridRoom.room;
        let roomName = room.name;
        let roomContent = " ";
        let northConnection = " ";
        let eastConnection = " ";
        let southConnection = " ";
        let westConnection = " ";

        if(gridRoom.robot) {
            roomContent = "R";
        }else if(room.contents === ObjectType.KEY) {
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

let currentRoom : Robot;
let roomGrid:  { x: number; y: number; room: Room; robot: boolean; }[][];

function init() {
    console.log("I am init!")
    // Create map
    currentRoom = createMap();
    // Create roomgrid
    roomGrid = createRoomGrid(currentRoom);
    // Paint map
    render(roomGrid, currentRoom);

    /* let goalRobot = new Robot(undefined, new Room('e', ObjectType.ORB, []));

    let pathToGoal = shortestPath(startRobot, goalRobot);
    let goalBack = new Robot(undefined, room3);
    let pathBack = shortestPath(pathToGoal[pathToGoal.length - 1].to, goalBack);
    let thirdGoal = new Robot(undefined, room1);
    let thirdPath = shortestPath(pathBack[pathBack.length - 1].to, thirdGoal);
    console.log(pathToGoal);
    console.log(pathBack);
    console.log(thirdPath);

    drawRobotPath(pathToGoal.slice(), testGrid);

    setTimeout(() => {
        drawRobotPath(pathBack.slice(), testGrid);
    }, 10000);

    setTimeout(() => {
        drawRobotPath(thirdPath.slice(), testGrid);
    }, 15000); */

    
}

function createMap() {
    return new Robot(ObjectType.NOTHING, room1);
}

function drawRobotPath(path: Edge [], roomGrid: { x: number; y: number; room: Room; robot: boolean; }[][]) {
    if(path.length !== 0) {
        setTimeout(() => {
            let pathFragment = path.shift();
            let nextMapState = pathFragment.to as Robot;
            updateRoomGrid(roomGrid, nextMapState.location);
            render(roomGrid, nextMapState);
            drawRobotPath(path, roomGrid);
        }, 1000);
    } else {
        return;
    }
}

function render(roomGrid: { x: number; y: number; room: Room; robot: boolean; }[][], currentRobot: Robot) {
    drawRobotState(currentRobot);
    drawMap(roomGrid);
}

function drawRobotState(robot: Robot) {
    document.querySelector("#locationText").innerHTML = robot.location.name;
    document.querySelector("#holdingText").innerHTML = robot.holding;
}

function drawMap(roomGrid: { x: number; y: number; room: Room; robot: boolean; }[][]) {
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
        if(targetRoomName) {
            targetRoom = new Room(targetRoomName, stringToObjectType(dropObject), []);
        }

        let goalRobot = new Robot(ObjectType.NOTHING, targetRoom);
        executeGoal(goalRobot);
    } else if(command === "goto") {
        // Goto some room, possibly holding and object
        let gotoRoom = tokens[0];
        let goalObject = tokens[1];
        let objectToHold = undefined
        if(goalObject) {
            objectToHold = stringToObjectType(goalObject);
        }

        let goalRobot = new Robot(objectToHold, new Room(gotoRoom, undefined, []));
        executeGoal(goalRobot);
    } else if(command === "get") {
        // Pick up some object, possibly in a specific room
        let fetchObject = tokens[0];
        let targetRoomName = tokens[1];
        let targetRoom = undefined;
        if(targetRoomName) {
            targetRoom = new Room(targetRoomName, undefined, []);
        }

        let goalRobot = new Robot(stringToObjectType(fetchObject), targetRoom);
        executeGoal(goalRobot);
    } else {
        document.querySelector("#goalFeedback").innerHTML = "Bad command"
    }
}

function executeGoal(goalRobot: Robot) {
    let pathToGoal = shortestPath(currentRoom, goalRobot);
    console.log(pathToGoal);
    currentRoom = pathToGoal[pathToGoal.length - 1].to as Robot;
    drawRobotPath(pathToGoal.slice(), roomGrid);
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