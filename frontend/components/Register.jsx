import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/users/register", {
        username,
        password
      });

      // alert(response.data.message || "Registered successfully!");
      toast.success(response.data.message || "Registered successfully!");
      navigate("/");  // Redirect back to login
    } catch (err) {
      // alert(err.response?.data?.message || "Registration failed");
      toast.error(err.response?.data?.message || "Registration failed");

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-black/50">
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-300 bg-clip-text text-transparent">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-gray-600 text-gray-100 placeholder-gray-400 transition-all duration-200"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-gray-600 text-gray-100 placeholder-gray-400 transition-all duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/20"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-green-400 font-medium transition-colors duration-200"
          >
            Already have an account? 
            <span className="ml-1 underline hover:no-underline">Login here</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;