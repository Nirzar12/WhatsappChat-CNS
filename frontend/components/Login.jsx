import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/api/users/login", {
        username,
        password
      });

      console.log("Response:", response.data);  // Debugging line

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        alert("Login successful!");
        navigate("/chats");  // Redirect to chat page
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Did not register?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
