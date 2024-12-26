import React, { useState, useEffect } from "react";
import WebSocketClient from "../utils/WebSocketClient";

const WaitingPage = () => {
  const [gameState, setGameState] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);

  useEffect(() => {
    WebSocketClient.onMessage((message) => {
      const response = JSON.parse(message);
      if (response.method === "update") {
        setGameState(response.game);
        setCurrentTurn(response.currentTurn);
      }
    });

    return () => {
      WebSocketClient.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    WebSocketClient.sendMessage({
      method: "startGame",
    });
  };

  return (
    <div>
      <h1>Waiting for Players to Join...</h1>
      <div>
        {gameState?.clients.map((player) => (
          <div key={player.clientId}>{player.clientId} ({player.color})</div>
        ))}
      </div>
      {gameState && gameState.clients.length >= 3 && (
        <button onClick={handleStartGame}>Start Game</button>
      )}
    </div>
  );
};

export default WaitingPage;
