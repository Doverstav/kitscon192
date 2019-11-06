var SimpleEdge = /** @class */ (function () {
    function SimpleEdge(from, to, cost) {
        this.from = from;
        this.to = to;
        this.cost = cost;
    }
    return SimpleEdge;
}());
var Room = /** @class */ (function () {
    function Room(name, contents, connections) {
        var _this = this;
        this.name = name;
        this.contents = contents;
        this.connections = [];
        connections.forEach(function (connection) { return _this.connections.push(new Connection(connection.room, connection.connectionType, connection.direction)); });
    }
    Room.prototype.copy = function () {
        return new Room(this.name, this.contents, this.connections);
    };
    Room.prototype.equals = function (otherRoom) {
        return this.name === otherRoom.name;
    };
    return Room;
}());
var Connection = /** @class */ (function () {
    function Connection(room, connectionType, direction) {
        this.room = room;
        this.connectionType = connectionType;
        this.direction = direction;
    }
    return Connection;
}());
var ObjectType;
(function (ObjectType) {
    ObjectType["KEY"] = "Key";
    ObjectType["ORB"] = "Orb";
    ObjectType["NOTHING"] = "Nothing";
})(ObjectType || (ObjectType = {}));
;
var Direction;
(function (Direction) {
    Direction["NORTH"] = "North";
    Direction["WEST"] = "West";
    Direction["SOUTH"] = "South";
    Direction["EAST"] = "East";
})(Direction || (Direction = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["DOOR"] = "Door";
    ConnectionType["HALLWAY"] = "Hallway";
})(ConnectionType || (ConnectionType = {}));
var MapObject = /** @class */ (function () {
    function MapObject(type) {
        this.type = type;
    }
    return MapObject;
}());
var Robot = /** @class */ (function () {
    function Robot(toHold, location) {
        this.holding = toHold;
        this.location = location;
        this.edges = [];
    }
    Robot.prototype.moveRobot = function () {
        // Go to adjacent rooms
        var _this = this;
        // TODO: NEW IMPLEMENTATION
        // Create new instances of all rooms
        // Otherwise (as rooms are passed by reference) updating rooms in one robot will update them for all robots
        var locationCopy = this.createNewRoomInstances(this.location);
        // For each connection
        locationCopy.connections.forEach(function (connection) {
            // If hallway, go to next room
            if (connection.connectionType === ConnectionType.HALLWAY) {
                var nextState = new Robot(_this.holding, _this.createNewRoomInstances(connection.room));
                _this.addEdge(nextState, 4);
            }
            // If door and no key, force door
            if (connection.connectionType === ConnectionType.DOOR && _this.holding !== ObjectType.KEY) {
                var nextState = new Robot(_this.holding, _this.createNewRoomInstances(connection.room));
                _this.addEdge(nextState, 40);
            }
            // If door and holding key, open door
            if (connection.connectionType === ConnectionType.DOOR && _this.holding === ObjectType.KEY) {
                var nextState = new Robot(ObjectType.NOTHING, _this.createNewRoomInstances(connection.room));
                _this.addEdge(nextState, 4);
            }
        });
        // If holding object and there is space in room, drop it
        // TODO: Fix bug where robot drops object in every rom and pollutes the map
        /*if(this.holding !== ObjectType.NOTHING && locationCopy.contents === ObjectType.NOTHING) {
            // Drop object
            let updatedLocation = new Room(locationCopy.name, this.holding, locationCopy.connections);
            let remadeEverything = this.createNewRoomInstances(updatedLocation);
            // Create next state
            let nextState = new Robot(ObjectType.NOTHING, remadeEverything);
            this.addEdge(nextState, 1);
        }*/
        // If object is in room, pick it up
        // TODO: This is also bugged, like drop
        if (this.holding === ObjectType.NOTHING && locationCopy.contents !== ObjectType.NOTHING) {
            // Save object
            var objectToPickup = locationCopy.contents;
            var updatedLocation = new Room(locationCopy.name, ObjectType.NOTHING, locationCopy.connections);
            var remadeEverything = this.createNewRoomInstances(updatedLocation);
            // Create next state
            var nextState = new Robot(objectToPickup, remadeEverything);
            this.addEdge(nextState, 1);
        }
    };
    Robot.prototype.addEdge = function (neighbour, cost) {
        this.edges.push(new SimpleEdge(this, neighbour, cost));
    };
    Robot.prototype.getEdges = function () {
        if (this.edges.length === 0) {
            this.moveRobot();
        }
        return this.edges;
    };
    // When creating a new copy of a room, make sure that all connection rooms point to that new copy
    Robot.prototype.updateRoomConnections = function (updatedRoom) {
        updatedRoom.connections.forEach(function (connection) {
            connection.room.connections.forEach(function (connectionBack) {
                if (connectionBack.room.name === updatedRoom.name) {
                    connectionBack.room = updatedRoom;
                }
            });
        });
    };
    // Given a room, create new instances of all rooms in this group
    Robot.prototype.createNewRoomInstances = function (room) {
        var _this = this;
        var initialCopy = room.copy();
        var roomsToUpdate = [initialCopy];
        var copiedRooms = [initialCopy];
        while (roomsToUpdate.length !== 0) {
            var roomToUpdate = roomsToUpdate.shift();
            // Make sure all rooms reference this new copy
            this.updateRoomConnections(roomToUpdate);
            // For all rooms connecting to this one
            roomToUpdate.connections.forEach(function (connection) {
                // If they are not already copied
                if (!_this.isRoomCopied(copiedRooms, connection.room)) {
                    var copiedRoom = connection.room.copy();
                    // Add to list of rooms that should be copied
                    roomsToUpdate.push(copiedRoom);
                    // Set it as copied so that we don not do work twice
                    copiedRooms.push(copiedRoom);
                }
            });
        }
        return copiedRooms[0];
    };
    Robot.prototype.isRoomCopied = function (copiedRooms, room) {
        for (var i = 0; i < copiedRooms.length; i++) {
            if (copiedRooms[i].name === room.name) {
                return true;
            }
        }
        return false;
    };
    Robot.prototype.toString = function () {
        var stringRepresentation = "";
        stringRepresentation = stringRepresentation.concat("Name: " + this.location.name + "\nHolding: " + this.holding + "\n");
        this.location.connections.forEach(function (connection) {
            stringRepresentation = stringRepresentation.concat("{\n\t" + connection.room.name + "\n\t" + connection.connectionType + "\n\t" + connection.direction + "\n}\n");
        });
        this.edges.forEach(function (edge) {
            stringRepresentation = stringRepresentation.concat(edge.from.location.name + " -" + edge.cost + "-> " + edge.to.location.name + "\n");
        });
        return stringRepresentation;
    };
    Robot.prototype.equals = function (toCompare) {
        // Robots are equal of they are in the same room
        // If holding is specified, it must also be equal
        var locationIsSignificant = true;
        var holdingIsSignificant = true;
        var roomContentsIsSignificant = true;
        if (toCompare.location) {
            locationIsSignificant = this.location.name === toCompare.location.name;
        }
        if (toCompare.location && toCompare.location.contents) {
            roomContentsIsSignificant = this.location.contents === toCompare.location.contents;
        }
        if (toCompare.holding) {
            holdingIsSignificant = this.holding === toCompare.holding;
        }
        return locationIsSignificant
            && holdingIsSignificant
            && roomContentsIsSignificant;
    };
    return Robot;
}());
function shortestPath(start, end) {
    var allPaths = [];
    // Init allPaths
    start.getEdges().forEach(function (edge) { return pushPath(allPaths, [edge]); });
    // start is already "checked"
    var checkedNodes = [start];
    var _loop_1 = function () {
        // Get current shortest path
        var current = allPaths.shift();
        var lastNode = lastNodeInPath(current);
        // Have we arrived at our goal?
        if (lastNode.equals(end)) {
            return { value: current };
        }
        // If not, mark node as checked
        checkedNodes.push(lastNode);
        // Create paths to all neightbours
        lastNode.getEdges().forEach(
        // For every edge to a neighbour
        function (edge) {
            // Get destination for edge
            var neighbour = edge.to;
            // Make sure we are not in a cycle
            if (!isNodeChecked(checkedNodes, neighbour)) {
                // If not, create new path by extending it with one edge
                var newPath = current.concat(edge);
                // Add to all paths
                pushPath(allPaths, newPath);
            }
        });
    };
    while (allPaths.length != 0) {
        var state_1 = _loop_1();
        if (typeof state_1 === "object")
            return state_1.value;
    }
}
function isNodeChecked(checkedNodes, node) {
    for (var i = 0; i < checkedNodes.length; i++) {
        if (checkedNodes[i].equals(node)) {
            return true;
        }
    }
    return false;
}
function pushPath(allPaths, newPath) {
    allPaths.push(newPath);
    allPaths.sort(function (a, b) { return pathLength(a) - pathLength(b); });
}
function pathLength(path) {
    return path.map(function (edge) { return edge.cost; }).reduce(function (acc, cost) { return acc + cost; });
}
function lastNodeInPath(path) {
    return path[path.length - 1].to;
}
function printPath(path) {
    var stringPath = "";
    for (var i = 0; i < path.length; i++) {
        stringPath = stringPath.concat(path[i].from.id + " -" + path[i].cost + "-> ");
        if (i === path.length - 1) {
            stringPath = stringPath.concat("" + path[i].to.id);
        }
    }
    return stringPath;
}
var room1 = new Room('a', ObjectType.NOTHING, []);
var room2 = new Room('b', ObjectType.KEY, []);
var room3 = new Room('c', ObjectType.NOTHING, []);
var room4 = new Room('d', ObjectType.ORB, []);
var room5 = new Room('e', ObjectType.NOTHING, []);
var room6 = new Room('f', ObjectType.ORB, []);
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
];
room4.connections = [
    {
        room: room2,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.NORTH
    }
];
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
];
room6.connections = [
    {
        room: room5,
        connectionType: ConnectionType.HALLWAY,
        direction: Direction.WEST
    }
];
function createRoomGrid(initialRoom) {
    // Keep track of max/min indexes so we can normalize them later
    var smallestX = 0;
    var largestX = 0;
    var smallestY = 0;
    var largestY = 0;
    // Set starting room as origo
    var processedRooms = [{ x: 0, y: 0, room: initialRoom.location, robot: true }];
    var roomsToProcess = [{ x: 0, y: 0, room: initialRoom.location, robot: true }];
    var _loop_2 = function () {
        // Get next room to process
        var roomToProcess = roomsToProcess.shift();
        // Get connections
        var connections = roomToProcess.room.connections;
        // For each connection
        connections.forEach(function (connection) {
            // Check that we have not already processed this room
            if (!isRoomProcessed(processedRooms, connection.room)) {
                // Add to processed rooms
                // Update smallest/largest depending on direction
                if (connection.direction === Direction.NORTH) {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x, y: roomToProcess.y - 1, room: connection.room, robot: false };
                    // Update smallest y
                    if (smallestY > roomToProcess.y - 1) {
                        smallestY = roomToProcess.y - 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                if (connection.direction === Direction.EAST) {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x + 1, y: roomToProcess.y, room: connection.room, robot: false };
                    // Update smallest y
                    if (largestX < roomToProcess.x + 1) {
                        largestX = roomToProcess.x + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                if (connection.direction === Direction.SOUTH) {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x, y: roomToProcess.y + 1, room: connection.room, robot: false };
                    // Update smallest y
                    if (largestY < roomToProcess.y + 1) {
                        largestY = roomToProcess.y + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                if (connection.direction === Direction.WEST) {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x - 1, y: roomToProcess.y, room: connection.room, robot: false };
                    // Update smallest y
                    if (smallestX > roomToProcess.x - 1) {
                        smallestX = roomToProcess.x - 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
            }
        });
    };
    // While there are rooms to process
    while (roomsToProcess.length !== 0) {
        _loop_2();
    }
    // Normalise coordinates (i.e minimum is 0)
    processedRooms.forEach(function (procRoom) {
        // As smallestX/smallestY are 0 or negative, 
        // subtracting their value will normalise the coordinates
        procRoom.x = procRoom.x - smallestX;
        procRoom.y = procRoom.y - smallestY;
    });
    // Set largestx/largestY to correct values
    largestX = largestX - smallestX;
    largestY = largestY - smallestY;
    // Create grid to store rooms in
    var roomGrid = [];
    // Add enough empty array so grid can be set
    for (var i = 0; i <= largestY; i++) {
        // Create line with all undefineds
        var gridLine = [];
        for (var j = 0; j <= largestX; j++) {
            gridLine[j] = undefined;
        }
        roomGrid[i] = gridLine;
    }
    processedRooms.forEach(function (procRoom) { return roomGrid[procRoom.y][procRoom.x] = procRoom; });
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
function isRoomProcessed(procesedRooms, room) {
    for (var i = 0; i < procesedRooms.length; i++) {
        if (procesedRooms[i].room.name === room.name) {
            return true;
        }
    }
    return false;
}
function printRoomGrid(roomGrid) {
    var gridAsString = "";
    for (var y = 0; y < roomGrid.length; y++) {
        var line1 = "";
        var line2 = "";
        var line3 = "";
        for (var x = 0; x < roomGrid[y].length; x++) {
            // Get string represenation of room
            var stringRoom = printRoom(roomGrid[y][x]);
            // Extract all lines
            var lines = stringRoom.split("\n");
            // Save lines in correct variable
            line1 = line1.concat(lines[0]);
            line2 = line2.concat(lines[1]);
            line3 = line3.concat(lines[2]);
        }
        // Combine all lines into one string
        var rowAsString = line1.concat("\n", line2, "\n", line3, "\n");
        // Save row in grid representation
        gridAsString = gridAsString.concat(rowAsString);
    }
    return gridAsString;
}
function printRoom(gridRoom) {
    if (gridRoom) {
        var room = gridRoom.room;
        var roomName = room.name;
        var roomContent = " ";
        var northConnection_1 = " ";
        var eastConnection_1 = " ";
        var southConnection_1 = " ";
        var westConnection_1 = " ";
        if (gridRoom.robot) {
            roomContent = "R";
        }
        else if (room.contents === ObjectType.KEY) {
            roomContent = "K";
        }
        else if (room.contents === ObjectType.ORB) {
            roomContent = "O";
        }
        room.connections.forEach(function (connection) {
            if (connection.direction === Direction.NORTH) {
                if (connection.connectionType == ConnectionType.DOOR) {
                    northConnection_1 = "D";
                }
            }
            if (connection.direction === Direction.EAST) {
                if (connection.connectionType == ConnectionType.DOOR) {
                    eastConnection_1 = "D";
                }
            }
            if (connection.direction === Direction.SOUTH) {
                if (connection.connectionType == ConnectionType.DOOR) {
                    southConnection_1 = "D";
                }
            }
            if (connection.direction === Direction.WEST) {
                if (connection.connectionType == ConnectionType.DOOR) {
                    westConnection_1 = "D";
                }
            }
        });
        return "" + roomName + northConnection_1 + "\u2510\n" + westConnection_1 + roomContent + eastConnection_1 + "\n\u2514" + southConnection_1 + "\u2518";
    }
    else {
        return "   \n   \n   ";
    }
}
var currentRoom;
var roomGrid;
function init() {
    console.log("I am init!");
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
function drawRobotPath(path, roomGrid) {
    document.querySelector("#goalFeedback").innerHTML = "Executing";
    if (path.length !== 0) {
        setTimeout(function () {
            var pathFragment = path.shift();
            var nextMapState = pathFragment.to;
            //updateRoomGrid(roomGrid, nextMapState.location);
            render(createRoomGrid(nextMapState), nextMapState);
            drawRobotPath(path, roomGrid);
        }, 1000);
    }
    else {
        document.querySelector("#goalFeedback").innerHTML = "";
        return;
    }
}
function render(roomGrid, currentRobot) {
    drawRobotState(currentRobot);
    drawMap(roomGrid);
}
function drawRobotState(robot) {
    document.querySelector("#locationText").innerHTML = robot.location.name;
    document.querySelector("#holdingText").innerHTML = robot.holding;
}
function drawMap(roomGrid) {
    // Get map as string
    var mapAsString = printRoomGrid(roomGrid);
    // Paint it in frontend
    document.querySelector("#mapDiv").innerHTML = mapAsString;
}
function parseGoal() {
    document.querySelector("#goalFeedback").innerHTML = "";
    var goalInput = document.querySelector("#goalInput");
    var goal = goalInput.value;
    var tokens = goal.split(" ");
    var command = tokens.shift().toLocaleLowerCase();
    if (command === "put") {
        // Put down object, possibly in a room
        var dropObject = tokens[0];
        var targetRoomName = tokens[1];
        var targetRoom = undefined;
        if (targetRoomName) {
            targetRoom = new Room(targetRoomName, stringToObjectType(dropObject), []);
        }
        var goalRobot = new Robot(ObjectType.NOTHING, targetRoom);
        executeGoal(goalRobot);
    }
    else if (command === "goto") {
        // Goto some room, possibly holding and object
        var gotoRoom = tokens[0];
        var goalObject = tokens[1];
        var objectToHold = undefined;
        if (goalObject) {
            objectToHold = stringToObjectType(goalObject);
        }
        var goalRobot = new Robot(objectToHold, new Room(gotoRoom, undefined, []));
        executeGoal(goalRobot);
    }
    else if (command === "get") {
        // Pick up some object, possibly in a specific room
        var fetchObject = tokens[0];
        var targetRoomName = tokens[1];
        var targetRoom = undefined;
        if (targetRoomName) {
            targetRoom = new Room(targetRoomName, undefined, []);
        }
        var goalRobot = new Robot(stringToObjectType(fetchObject), targetRoom);
        executeGoal(goalRobot);
    }
    else {
        document.querySelector("#goalFeedback").innerHTML = "Bad command";
    }
}
function executeGoal(goalRobot) {
    document.querySelector("#goalFeedback").innerHTML = "Searching";
    var pathToGoal = shortestPath(currentRoom, goalRobot);
    console.log(pathToGoal);
    if (pathToGoal) {
        currentRoom = pathToGoal[pathToGoal.length - 1].to;
        drawRobotPath(pathToGoal.slice(), roomGrid);
    }
    else {
        document.querySelector("#goalFeedback").innerHTML = "No path to goal";
    }
}
function stringToObjectType(stringObject) {
    var lowercase = stringObject.toLocaleLowerCase();
    if (lowercase === "key") {
        return ObjectType.KEY;
    }
    else if (lowercase === "orb") {
        return ObjectType.ORB;
    }
    else if (lowercase === "nothing") {
        return ObjectType.NOTHING;
    }
    else {
        return undefined;
    }
}
