import React, { useState } from "react";
import WebSocketClient from "../utils/WebSocketClient";

const ControlPanel = ({ clientId, gameId, setGameId, setPlayerColor }) => {
  const [gameInput, setGameInput] = useState("");

  const createGame = () => {
    const payload = {
      method: "create",
      clientId,
    };
    WebSocketClient.sendMessage(payload);
  };

  const joinGame = () => {
    const payload = {
      method: "join",
      clientId,
      gameId,
    };
    WebSocketClient.sendMessage(payload);
  };

  return (
    <div id="controlPanel">
      <button onClick={createGame}>New Game</button>
      <button onClick={joinGame}>Join Game</button>
      <input
        type="text"
        value={gameInput}
        onChange={(e) => setGameInput(e.target.value)}
        placeholder="Enter Game ID"
      />
      <button
        onClick={() => setGameId(gameInput)}
        disabled={!gameInput}
      >
        Set Game ID
      </button>
    </div>
  );
};

export default ControlPanel;
