import React from "react";

const Players = ({ game }) => {
  return (
    <div id="divPlayers">
      {game.clients.map((player) => (
        <div key={player.clientId} className="player-card">
          {player.clientId} ({player.color})
        </div>
      ))}
    </div>
  );
};

export default Players;
