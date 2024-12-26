import React from "react";
import WebSocketClient from "../utils/WebSocketClient";

const Box = ({ player, box, boxId, clientId }) => {
  const handleClick = () => {
    if (box.eliminated) {
      alert("This box is eliminated!");
    } else {
      const payload = {
        method: "rollDice",
        clientId,
        gameId: player.gameId,
      };
      WebSocketClient.sendMessage(payload);
    }
  };

  return (
    <button
      className={`box ${box.eliminated ? "eliminated" : ""}`}
      onClick={handleClick}
      style={{ backgroundColor: player.color }}
    >
      Box {boxId} (Counter: {box.counter})
    </button>
  );
};

export default Box;
