import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../components/Login";
import Chat from "../components/Chat";
import Register from "../components/Register";
import NewChat from "../components/NewChat"



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register /> } />
        <Route path="/chats" element={<Chat />} />
        {/* <Route path="/Newchats" element={<NewChat />} /> */}
      </Routes>
    </Router>
  );
}

export default App;

