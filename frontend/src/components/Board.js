import React from "react";
import Box from "./Box";

const Board = ({ game, clientId }) => {
  return (
    <div id="divBoard">
      {game.clients.map((player, playerIndex) => (
        <div key={player.clientId}>
          {Object.entries(player.balls).map(([boxId, box]) => (
            <Box
              key={boxId}
              player={player}
              box={box}
              boxId={boxId}
              clientId={clientId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
