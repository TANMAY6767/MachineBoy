import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import StartingPage from "./components/StartingPage";
import WaitingPage from "./components/WaitingPage";
import GamePage from "./components/GamePage";
import "./App.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartingPage />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
};

export default App;
