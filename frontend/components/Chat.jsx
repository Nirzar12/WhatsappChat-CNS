import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  // Check if the user is logged in (token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      navigate("/");
      return;
    }

    fetchUsers();
    fetchOnlineUsers();
  }, []);

  // Fetch all registered users from the backend
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // ✅ Fetch online users from the backend
  const fetchOnlineUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users/online");

      // Convert user list into an object with online status
      const onlineStatus = response.data.reduce((acc, user) => {
        acc[user.username] = user.isOnline;
        return acc;
      }, {});

      setOnlineUsers(onlineStatus);
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    }
  };

  const handleConnect = async (receiverUsername) => {
    const senderUsername = localStorage.getItem('username');  // Logged-in user

    try {
        const response = await axios.post('http://localhost:5000/connect', {
            sender: senderUsername,
            receiver: receiverUsername,
        });

        const { aesKey } = response.data;
        localStorage.setItem(`aesKey-${receiverUsername}`, aesKey);  // Store AES key for session

        alert(`Secure chat initiated with ${receiverUsername}`);
    } catch (error) {
        console.error("Failed to connect securely:", error);
        alert("Failed to establish a secure connection.");
    }
};

  // ✅ Send a message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { sender: "You", text: newMessage }]);
      setNewMessage("");
    }
  };

  // ✅ Logout function
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You're already logged out.");
        navigate("/");
        return;
      }

      // Decode token to get the username
      const { username } = JSON.parse(atob(token.split(".")[1]));

      // Send logout request to the backend
      await axios.post("http://localhost:5000/api/users/logout", { username });

      // Clear token from local storage
      localStorage.removeItem("token");

      alert("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ✅ User List Sidebar */}
      <div className="w-1/4 bg-white p-4 shadow-xl overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Registered Users</h2>
        {users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-2 border-b"
            >
              <div>
                <p className="font-semibold">{user.username}</p>
              </div>
              <div className="flex gap-2 items-center">
                {/* ✅ Online/Offline Status */}
                <span
                  className={`px-2 py-1 text-sm rounded-xl ${
                    onlineUsers[user.username] ? "bg-green-500" : "bg-gray-400"
                  } text-white`}
                >
                  {onlineUsers[user.username] ? "Online" : "Offline"}
                </span>

                {/* ✅ Only show Connect if user is online */}
                {onlineUsers[user.username] && (
                  <button
                    onClick={() => handleConnect(user.username)}
                    className="px-2 py-1 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No registered users found.</p>
        )}
      </div>

      {/* ✅ Chat Section */}
      <div className="flex-1 flex flex-col p-8 bg-white rounded-xl shadow-lg">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Chat with {selectedUser} 💬
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-100 rounded-xl h-96">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded-xl ${
                      msg.sender === "You"
                        ? "bg-blue-100 text-right"
                        : "bg-green-100"
                    }`}
                  >
                    <strong>{msg.sender}:</strong> {msg.text}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  No messages yet. Start chatting!
                </p>
              )}
            </div>

            {/* ✅ Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-bold">Welcome to the Chat Page! 🔒</h1>
            <p className="mt-2 text-gray-600">Select a user to start chatting.</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

