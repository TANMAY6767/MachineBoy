const http = require("http");
const WebSocketServer = require("websocket").server;

// Create an HTTP server for WebSocket
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("WebSocket server running on port 9090"));

// Hashmap for clients and games
const clients = {};
const games = {};
let hitter = null;

// WebSocket Server
const wsServer = new WebSocketServer({ httpServer });

wsServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);

  connection.on("open", () => console.log("Connection opened!"));
  connection.on("close", () => handleDisconnect(connection));
  connection.on("message", (message) => handleMessage(message, connection));

  const clientId = guid();
  clients[clientId] = { connection };

  const payLoad = {
    method: "connect",
    clientId,
    username: clients[clientId]?.username || 'Unknown',
  };

  connection.send(JSON.stringify(payLoad));
});

// Handle incoming WebSocket messages
const handleMessage = (message, connection) => {
  try {
    const data = JSON.parse(message.utf8Data);

    switch (data.method) {
      case "create":
        handleCreateGame(data, connection);
        break;
      case "join":
        handleJoinGame(data, connection);
        break;
      case "rollDice":
        handleRollDice(data);
        break;
      case "setUsername":
        handleSetUsername(data, connection);  // New case to set username
        break;
      case "specialAction":
        handleSpecialAction(data);
        break;
      default:
        console.warn("Unknown method:", data.method);
        break;
    }
  } catch (error) {
    console.error("Error parsing message:", error.message, "Raw message:", message.utf8Data);
  }
};
const handleSetUsername = (data, connection) => {
  const { clientId, username } = data;
  if (clients[clientId]) {
    clients[clientId].username = username || "Unknown"; // Default to "Unknown"
  }
};
// Handle new game creation
const handleCreateGame = (data, connection) => {
  const clientId = data.clientId;
  const gameId = generateGameId();
  games[gameId] = {
    id: gameId,
    clients: [],
    turn: 0,
  };

  const payLoad = {
    method: "create",
    game: games[gameId],
    creatorId: clientId,
    
  };

  clients[clientId].connection.send(JSON.stringify(payLoad));
};

// Handle player joining a game
const handleJoinGame = (data) => {
  const { clientId, gameId } = data;
  const game = games[gameId];

  if (!game) {
    sendError(clientId, `Game with ID ${gameId} not found.`);
    return;
  }

  if (game.clients.length >= 3) {
    sendError(clientId, "Game is full.");
    return;
  }

  const color = ["Red", "Yellow", "White"][game.clients.length];
  const username = clients[clientId]?.username || "Unknown";
  game.clients.push({
    clientId,
    color,
    balls: {
      1: { counter: 0, hit: 0, eliminated: false },
      2: { counter: 0, hit: 0, eliminated: false },
      3: { counter: 0, hit: 0, eliminated: false },
    },
    lost: false,
    "username": username,
  });

  // Update game state for all clients
  notifyClients(game, "update", { game });
  notifyClients(game, "turn", { currentTurn: game.clients[game.turn].clientId });
};

// Handle dice roll logic
const handleRollDice = (data) => {
  const game = games[data.gameId];
  if (!game || !Array.isArray(game.clients)) {
    console.warn("Invalid game object or clients array in handleRollDice:", game);
    return;
  }

  const currentPlayer = game.clients[game.turn];
  if (currentPlayer.clientId !== data.clientId) return;

  const diceRoll = Math.floor(Math.random() * 3) + 1; // Rolls 1, 2, or 3
  const ball = currentPlayer.balls[diceRoll];

  if (ball.eliminated) {
    updateTurn(game);
    notifyClients(game, "update", { game });
    notifyClients(game, "turn", { currentTurn: game.clients[game.turn].clientId });
    notifyClient(currentPlayer.clientId, "rollDice", { diceRoll });
    return;
  }

  if (ball.counter < 1) {
    ball.counter++;
  } else {
    ball.counter++;
    hitter = currentPlayer;
    notifyClient(currentPlayer.clientId, "actionPrompt", { currentPlayer: currentPlayer.clientId });
  }

  // Check if current player is eliminated
  if (isPlayerEliminated(currentPlayer)) {
    currentPlayer.lost = true;
  }

  updateTurn(game);
  notifyClients(game, "update", { game });
  notifyClients(game, "turn", { currentTurn: game.clients[game.turn].clientId });
  notifyClient(currentPlayer.clientId, "rollDice", { diceRoll });
};

const isPlayerEliminated = (player) => {
  return (
    player.balls[1].eliminated &&
    player.balls[2].eliminated &&
    player.balls[3].eliminated
  );
};
// Handle special action logic
const handleSpecialAction = (data) => {
  const { gameId, targetPlayerId, targetBoxId } = data;
  const game = games[gameId];
  if (!game) return;

  const targetPlayer = game.clients.find((p) => p.clientId === targetPlayerId);
  if (!targetPlayer) return;

  const targetBox = targetPlayer.balls[targetBoxId];

  if (targetBox.counter > 0) {
    targetBox.counter = 0;
    targetBox.hit++;
  } else if (targetBox.counter === 0 && targetBox.hit > 0) {
    targetBox.eliminated = true;
  } else {
    notifyClient(hitter.clientId, "alert", {
      message: "The targeted box is fresh and cannot be eliminated!",
    });
    return;
  }

  // Check if the target player is now eliminated
  if (isPlayerEliminated(targetPlayer)) {
    targetPlayer.lost = true;
  }

  notifyClients(game, "update", { game });
  notifyClients(game, "turn", { currentTurn: game.clients[game.turn].clientId });
};


// Periodically check for game winners
setInterval(() => {
  Object.values(games).forEach((game) => {
    if (game && Array.isArray(game.clients) && game.clients.length >= 3) {
      handleWinner(game);
    }
  });
}, 500);

const handleWinner = (game) => {
  if (!game || !Array.isArray(game.clients)) return;

  const activePlayers = game.clients.filter((player) => !player.lost);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    notifyClients(game, "gameOver", { winner: winner.clientId, color: winner.color });
    delete games[game.id];
  }
};


// Update the turn to the next player
const updateTurn = (game) => {
  let nextTurn = (game.turn + 1) % game.clients.length;
  while (
    game.clients[nextTurn].balls[1].eliminated &&
    game.clients[nextTurn].balls[2].eliminated &&
    game.clients[nextTurn].balls[3].eliminated
  ) {
    nextTurn = (nextTurn + 1) % game.clients.length;
    if (nextTurn === game.turn) break;
  }
  game.turn = nextTurn;
};

// Handle client disconnect
const handleDisconnect = (connection) => {
  const clientId = Object.keys(clients).find((id) => clients[id].connection === connection);
  if (clientId) {
    delete clients[clientId];
    console.log(`Client ${clientId} disconnected.`);
  }
};

// Send error message to client
const sendError = (clientId, message) => {
  const client = clients[clientId];
  if (client) {
    client.connection.send(
      JSON.stringify({
        method: "alert",
        message,
      })
    );
  }
};

// Notify a single client of a game state change
const notifyClient = (clientId, method, payload) => {
  const client = clients[clientId];
  if (client) {
    client.connection.send(JSON.stringify({ method, ...payload }));
  }
};

// Notify all clients of a game state change
const notifyClients = (game, method, payload) => {
  if (!game || !Array.isArray(game.clients)) return;

  game.clients.forEach((player) => {
    const client = clients[player.clientId];
    if (client) {
      client.connection.send(JSON.stringify({ method, ...payload }));
    }
  });
};
const generateGameId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let gameId = '';
  for (let i = 0; i < 6; i++) {
    gameId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return gameId;
};
// Generate unique GUIDs
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
