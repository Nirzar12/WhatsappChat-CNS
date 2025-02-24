import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../components/Login";
import Chat from "../components/Chat";
import Register from "../components/Register";




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register /> } />
        <Route path="/chats" element={<Chat />} />
   
      </Routes>
    </Router>
  );
}

export default App;

