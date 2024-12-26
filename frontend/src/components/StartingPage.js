// StartingPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const StartingPage = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate("/game", { state: { username } });
    } else {
      alert("Please enter a username.");
    }
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Welcome to Ball Game</h1>
      <form onSubmit={handleSubmit} style={{ margin: "20px" }}>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            width: "200px",
            marginRight: "10px",
          }}
        />
        <button type="submit" style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}>
          Start Game
        </button>
      </form>
    </div>
  );
};

export default StartingPage;
