import React, { useState, useEffect } from "react";
import WebSocketClient from "./utils/WebSocketClient";
import "./App.css";

const App = () => {
  const [diceResult, setDiceResult] = useState(null);

  const [clientId, setClientId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [actionPrompt, setActionPrompt] = useState(null);
  const [targetBoxId, setTargetBoxId] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState(null);

  let storeC = null;

  useEffect(() => {
    WebSocketClient.connect();

    WebSocketClient.onMessage((message) => handleWebSocketMessage(message));

    return () => {
      WebSocketClient.disconnect();
    };
  }, []);

  const handleWebSocketMessage = (message) => {
    const response = JSON.parse(message);

    if (response.method === "actionPrompt") {
      // Check if the current player is the one who should see the prompt
      // console.log("currentPlayer= ",response.currentPlayer)
      // console.log("clientId= ",storeC)
      if (response.currentPlayer === storeC) {
        setActionPrompt(true);
      }
    }

    if (response.method === "gameOver") {
      alert(`Game Over! The winner is ${response.color}!`);
      // Optionally reset state or redirect to a new screen
      setGameState(null);
      setCurrentTurn(null);
      setDiceResult(null);
      setGameId(null);
    }
    if (response.method === "connect") {
      setClientId(response.clientId);
      storeC = response.clientId
    }
    
    if (response.method === "rollDice") {
      // Update the dice result state
      setDiceResult(response.diceRoll); // Assuming the response contains diceRoll
    }
    if (response.method === "create") {
      setGameId(response.game.id);
      setCurrentTurn(response.creatorId); // Creator plays first
    }

    if (response.method === "join") {
      setGameState(response.game);

    }

    if (response.method === "update") {
      setGameState(response.game);
      setCurrentTurn(response.currentTurn);
    }

    if (response.method === "turn") {
      setCurrentTurn(response.currentTurn);
    }

    if (response.method === "alert") {
      alert(response.message);
    }
  };
  const handleSpecialAction = (targetPlayerId, targetBoxId) => {
    WebSocketClient.sendMessage({
      method: "specialAction",
      gameId,
      clientId,
      targetPlayerId,
      targetBoxId,
    });
    setActionPrompt(false); // Hide the prompt after selecting
  };

  const handleCreateGame = () => {
    WebSocketClient.sendMessage({
      method: "create",
      clientId,
    });
  };

  const handleJoinGame = () => {
    if (!gameId) return;
    WebSocketClient.sendMessage({
      method: "join",
      clientId,
      gameId,
    });
  };

  const handleRollDice = () => {
    WebSocketClient.sendMessage({
      method: "rollDice",
      clientId,
      gameId,
    });
  };

  const getTurnColor = (turnId) => {
    const player = gameState.clients.find((p) => p.clientId === turnId);
    return player ? player.color : null;
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", backgroundColor: "#f0f8ff" }}>
      <h1 style={{ color: "#4caf50", textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)" }}>Ball Game</h1>
      <div id="controlPanel" style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        <button onClick={handleCreateGame} style={buttonStyle}>New Game</button>
        <button onClick={handleJoinGame} style={buttonStyle}>Join Game</button>
        <input
          type="text"
          placeholder="Enter Game ID"
          value={gameId || ""}
          onChange={(e) => setGameId(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleRollDice} style={buttonStyle}>Roll Dice</button>
      </div>
      <div id="divPlayers" style={playerContainerStyle}>
        {gameState?.clients.map((player) => (
          <div key={player.clientId} style={playerCardStyle}>
            {player.clientId} ({player.color})
          </div>
        ))}
      </div>
      <div style={{ marginTop: "20px", fontSize: "18px" }}>
        {diceResult !== null && (
          <p style={{ color: "#4caf50" }}>
            Dice rolled: {diceResult}
          </p>
        )}
      </div>

      <div id="divBoard" style={boardContainerStyle}>
        {gameState?.clients.map((player) =>
          Array.from({ length: 3 }, (_, index) => {
            const boxId = index + 1;
            const box = player.balls[boxId];
            return (
              <div
                key={`${player.clientId}_box${boxId}`}
                style={{
                  ...boxStyle,
                  backgroundColor: box.eliminated ? "#ffcccc" : player.color,
                }}
              >
                Box {boxId} ({box.counter || 0})
                {box.eliminated && <div style={{ color: "#ff0000" }}>Eliminated</div>}
              </div>
            );
          })
        )}
      </div>

      {/* Display Current Turn */}
      {gameState && (
        <div style={{ marginTop: "20px", fontSize: "18px", color: getTurnColor(currentTurn) }}>
          It's {getTurnColor(currentTurn)}'s turn!
        </div>
      )}
      <div>
        {/* Game UI Components */}

        {/* Action Prompt */}
        {actionPrompt && (
          <div style={actionPromptStyle}>
            <p>You have the opportunity to target another player's box!</p>
            {gameState?.clients.map((player) => (
              <div key={player.clientId} style={targetPlayerStyle}>
                <p>{player.clientId}'s Boxes:</p>
                {Array.from({ length: 3 }).map((_, idx) => {
                  const box = player.balls[idx + 1];
                  return !box.eliminated ? (
                    <button
                      key={`${player.clientId}_box${idx + 1}`}
                      onClick={() => {
                        setTargetPlayerId(player.clientId);
                        setTargetBoxId(idx + 1);
                        handleSpecialAction(player.clientId, idx + 1);
                      }}
                      style={boxButtonStyle}
                    >
                      Box {idx + 1}
                    </button>
                  ) : null;
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

  );
};
const actionPromptStyle = {
  position: "absolute",
  top: "70%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  zIndex: 1000,
};

const targetPlayerStyle = {
  textAlign: "center",
};

const boxButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  fontSize: "14px",
  cursor: "pointer",
  margin: "5px",
};

const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  fontSize: "16px",
  cursor: "pointer",
};

const inputStyle = {
  padding: "10px",
  fontSize: "16px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  width: "200px",
};

const playerContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "20px",
};

const playerCardStyle = {
  padding: "10px",
  border: "2px solid #4caf50",
  borderRadius: "5px",
  textAlign: "center",
  backgroundColor: "#fff",
};

const boardContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "15px",
};

const boxStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100px",
  height: "100px",
  border: "2px solid #ccc",
  borderRadius: "5px",
  backgroundColor: "#fff",
  textAlign: "center",
  fontSize: "24px", // Increased font size for the counter
  fontWeight: "bold", // Optional: makes the number bold
  color: "#333", // Optional: change the color of the counter number
};


export default App;
