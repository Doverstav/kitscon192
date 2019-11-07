var SimpleEdge = /** @class */ (function () {
    function SimpleEdge(from, to, cost) {
        this.from = from;
        this.to = to;
        this.cost = cost;
    }
    return SimpleEdge;
}());
function copyRoom(room) {
    return { name: room.name, contents: room.contents, connections: room.connections.slice() };
}
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
    function Robot(toHold, rooms, location) {
        this.holding = toHold;
        this.rooms = rooms;
        this.location = location;
        this.edges = [];
    }
    Robot.prototype.moveRobot = function () {
        var _this = this;
        var currentLocation = this.rooms[this.location];
        // For each connection
        currentLocation.connections.forEach(function (connection) {
            var tokenizedConnection = connection.split(" ");
            var direction = tokenizedConnection[0].toLocaleUpperCase();
            var connectionType = tokenizedConnection[1].toLocaleUpperCase();
            var roomName = tokenizedConnection[2].toLocaleUpperCase();
            // Go through hallway
            if (connectionType === "H") {
                var nextState = new Robot(_this.holding, _this.copyAllRooms(), _this.getRoomIndex(roomName));
                _this.addEdge(nextState, 1);
            }
            // If not holding key, force open door
            if (connectionType === "D" && _this.holding !== ObjectType.KEY) {
                var nextState = new Robot(_this.holding, _this.copyAllRooms(), _this.getRoomIndex(roomName));
                _this.addEdge(nextState, 10);
            }
            // If holding key, use key to open door
            if (connectionType === "D" && _this.holding === ObjectType.KEY) {
                var nextState = new Robot(ObjectType.NOTHING, _this.copyAllRooms(), _this.getRoomIndex(roomName));
                _this.addEdge(nextState, 1);
            }
        });
        // If not holding object, pick up object
        if (this.holding === ObjectType.NOTHING && currentLocation.contents !== ObjectType.NOTHING) {
            // Save room contents
            var roomContents = currentLocation.contents;
            // Copy all rooms
            var copiedRooms = this.copyAllRooms();
            // Remove contents from room
            copiedRooms[this.location].contents = ObjectType.NOTHING;
            // Create next state
            var nextState = new Robot(roomContents, copiedRooms, this.location);
            this.addEdge(nextState, 0.25);
        }
        // If holding object, drop object
        if (this.holding !== ObjectType.NOTHING && currentLocation.contents === ObjectType.NOTHING) {
            // Copy all rooms
            var copiedRooms = this.copyAllRooms();
            // Set contents in location
            copiedRooms[this.location].contents = this.holding;
            // Create next state
            var nextState = new Robot(ObjectType.NOTHING, copiedRooms, this.location);
            this.addEdge(nextState, 0.25);
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
    Robot.prototype.getRoom = function (roomName) {
        for (var i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].name.toLocaleLowerCase() === roomName.toLocaleLowerCase()) {
                return this.rooms[i];
            }
        }
        return undefined;
    };
    Robot.prototype.getRoomIndex = function (roomName) {
        for (var i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].name.toLocaleLowerCase() === roomName.toLocaleLowerCase()) {
                return i;
            }
        }
        return -1;
    };
    Robot.prototype.copyAllRooms = function () {
        var newList = [];
        this.rooms.forEach(function (room) { return newList.push(copyRoom(room)); });
        return newList;
    };
    Robot.prototype.equals = function (toCompare) {
        // Robots are equal of they are in the same room
        // If holding is specified, it must also be equal
        var locationIsSignificant = true;
        var holdingIsSignificant = true;
        var roomContentsIsSignificant = true;
        if (toCompare.location !== undefined) {
            locationIsSignificant = this.rooms[this.location].name === toCompare.rooms[toCompare.location].name;
        }
        if (toCompare.location !== undefined && toCompare.rooms[toCompare.location].contents) {
            roomContentsIsSignificant = this.rooms[this.location].contents === toCompare.rooms[toCompare.location].contents;
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
var room1 = {
    name: 'a',
    contents: ObjectType.NOTHING,
    connections: ["E D B"]
};
var room2 = {
    name: 'b',
    contents: ObjectType.KEY,
    connections: ["W D A", "N D C", "E H E", "S H D"]
};
var room3 = {
    name: 'c',
    contents: ObjectType.NOTHING,
    connections: ["S D B"]
};
var room4 = {
    name: 'd',
    contents: ObjectType.ORB,
    connections: ["N H B"]
};
var room5 = {
    name: 'e',
    contents: ObjectType.NOTHING,
    connections: ["W H B", "E H F"]
};
var room6 = {
    name: 'f',
    contents: ObjectType.ORB,
    connections: ["W H E"]
};
function createRoomGrid(initialRoom) {
    // Keep track of max/min indexes so we can normalize them later
    var smallestX = 0;
    var largestX = 0;
    var smallestY = 0;
    var largestY = 0;
    // Set starting room as origo
    var processedRooms = [{ x: 0, y: 0, room: initialRoom.rooms[initialRoom.location], robot: true }];
    var roomsToProcess = [{ x: 0, y: 0, room: initialRoom.rooms[initialRoom.location], robot: true }];
    var _loop_2 = function () {
        // Get next room to process
        var roomToProcess = roomsToProcess.shift();
        // Get connections
        var connections = roomToProcess.room.connections;
        // For each connection
        connections.forEach(function (connection) {
            // Check that we have not already processed this room
            var tokenizedConnection = connection.split(" ");
            var direction = tokenizedConnection[0];
            var connectionType = tokenizedConnection[1];
            var roomName = tokenizedConnection[2];
            var connectingRoom = initialRoom.getRoom(roomName);
            if (!isRoomProcessed(processedRooms, connectingRoom)) {
                // Add to processed rooms
                // Update smallest/largest depending on direction
                if (direction === "N") {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x, y: roomToProcess.y - 1, room: connectingRoom, robot: false };
                    // Update smallest y
                    if (smallestY > roomToProcess.y - 1) {
                        smallestY = roomToProcess.y - 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                if (direction === "E") {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x + 1, y: roomToProcess.y, room: connectingRoom, robot: false };
                    // Update smallest y
                    if (largestX < roomToProcess.x + 1) {
                        largestX = roomToProcess.x + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                if (direction === "S") {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x, y: roomToProcess.y + 1, room: connectingRoom, robot: false };
                    // Update smallest y
                    if (largestY < roomToProcess.y + 1) {
                        largestY = roomToProcess.y + 1;
                    }
                    // Add to list
                    processedRooms.push(processedRoom);
                    roomsToProcess.push(processedRoom);
                }
                if (direction === "W") {
                    // Create processed room
                    var processedRoom = { x: roomToProcess.x - 1, y: roomToProcess.y, room: connectingRoom, robot: false };
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
            var tokenizedConnection = connection.split(" ");
            var direction = tokenizedConnection[0];
            var connectionType = tokenizedConnection[1];
            if (direction === "N") {
                if (connectionType == "D") {
                    northConnection_1 = "D";
                }
            }
            if (direction === "E") {
                if (connectionType == "D") {
                    eastConnection_1 = "D";
                }
            }
            if (direction === "S") {
                if (connectionType == "D") {
                    southConnection_1 = "D";
                }
            }
            if (direction === "W") {
                if (connectionType == "D") {
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
    // Create map
    currentRoom = createMap();
    // Create roomgrid
    roomGrid = createRoomGrid(currentRoom);
    // Paint map
    render(roomGrid, currentRoom);
}
function createMap() {
    return new Robot(ObjectType.NOTHING, [room1, room2, room3, room4, room5, room6], 0);
}
function drawRobotPath(path, roomGrid) {
    document.querySelector("#goalFeedback").innerHTML = "Executing";
    if (path.length !== 0) {
        setTimeout(function () {
            var pathFragment = path.shift();
            var nextMapState = pathFragment.to;
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
    document.querySelector("#locationText").innerHTML = robot.rooms[robot.location].name;
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
        var targetRoomIndex = undefined;
        if (targetRoomName) {
            targetRoom = [{ name: targetRoomName, contents: stringToObjectType(dropObject), connections: [] }];
            targetRoomIndex = 0;
        }
        var goalRobot = new Robot(ObjectType.NOTHING, targetRoom, targetRoomIndex);
        executeGoal(goalRobot);
    }
    else if (command === "goto") {
        // Goto some room, possibly holding an object
        var gotoRoom = tokens[0];
        var goalObject = tokens[1];
        var objectToHold = undefined;
        if (goalObject) {
            objectToHold = stringToObjectType(goalObject);
        }
        var goalRobot = new Robot(objectToHold, [{ name: gotoRoom, contents: undefined, connections: undefined }], 0);
        executeGoal(goalRobot);
    }
    else if (command === "get") {
        // Pick up some object, possibly in a specific room
        var fetchObject = tokens[0];
        var targetRoomName = tokens[1];
        var targetRoom = undefined;
        var targetRoomIndex = undefined;
        if (targetRoomName) {
            targetRoom = [{ name: targetRoomName, contents: undefined, connections: [] }];
            targetRoomIndex = 0;
        }
        var goalRobot = new Robot(stringToObjectType(fetchObject), targetRoom, targetRoomIndex);
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
