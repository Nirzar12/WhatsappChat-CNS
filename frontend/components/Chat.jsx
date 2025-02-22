import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { autoConnect: false });

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");
  const [incomingRequest, setIncomingRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      alert("Please log in first.");
      navigate("/");
      return;
    }

    setLoggedInUser(username);
    fetchUsers(username);
    fetchOnlineUsers();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", username);

    socket.on("receive-connection-request", ({ sender }) => {
      setIncomingRequest(sender);
    });

    socket.on("connection-accepted", ({ receiver }) => {
      setSelectedUser(receiver);
      alert(`Connected with ${receiver}`);
    });

    socket.on("connection-rejected", ({ receiver }) => {
      alert(`${receiver} rejected your connection request.`);
    });

    socket.on("receiveMessage", ({ sender, text }) => {
      setMessages((prev) => [...prev, { sender, text }]);
    });

    return () => {
      socket.off("receive-connection-request");
      socket.off("connection-accepted");
      socket.off("connection-rejected");
      socket.off("receiveMessage");

      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchUsers = async (currentUser) => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data.filter((user) => user.username !== currentUser));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users/online");
      const onlineStatus = response.data.reduce((acc, user) => {
        acc[user.username] = user.isOnline;
        return acc;
      }, {});
      setOnlineUsers(onlineStatus);
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    }
  };

  const handleConnect = (receiverUsername) => {
    socket.emit("send-connection-request", {
      sender: loggedInUser,
      receiver: receiverUsername,
    });
    alert(`Connection request sent to ${receiverUsername}`);
  };

  const acceptRequest = () => {
    if (incomingRequest) {
      socket.emit("connection-response", {
        sender: incomingRequest,
        receiver: loggedInUser,
        accepted: true,
      });
      setSelectedUser(incomingRequest);
      setIncomingRequest(null);
      alert(`Connected with ${incomingRequest}`);
    }
  };

  const rejectRequest = () => {
    if (incomingRequest) {
      socket.emit("connection-response", {
        sender: incomingRequest,
        receiver: loggedInUser,
        accepted: false,
      });
      setIncomingRequest(null);
      alert(`Rejected connection request from ${incomingRequest}`);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      const message = { sender: loggedInUser, text: newMessage };
      setMessages((prev) => [...prev, message]);
      socket.emit("sendMessage", {
        sender: loggedInUser,
        receiver: selectedUser,
        text: newMessage,
      });
      setNewMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You're already logged out.");
        navigate("/");
        return;
      }
      const { username } = JSON.parse(atob(token.split(".")[1]));
      await axios.post("http://localhost:5000/api/users/logout", { username });
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      alert("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {incomingRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4">
              {incomingRequest} wants to connect with you.
            </h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={acceptRequest}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={rejectRequest}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-1/4 bg-white p-4 shadow-xl overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Chat App</h2>
        <div className="mb-4 p-2 bg-blue-100 rounded-xl">
          <p className="font-semibold">Logged in as: {loggedInUser}</p>
        </div>

        <h3 className="text-lg font-semibold mb-2">Registered Users</h3>
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
                <span
                  className={`px-2 py-1 text-sm rounded-xl ${
                    onlineUsers[user.username] ? "bg-green-500" : "bg-gray-400"
                  } text-white`}
                >
                  {onlineUsers[user.username] ? "Online" : "Offline"}
                </span>
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

      <div className="flex-1 flex flex-col p-8 bg-white rounded-xl shadow-lg">
        {selectedUser ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Chat with {selectedUser} 💬</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-100 rounded-xl h-96">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded-xl ${
                      msg.sender === loggedInUser
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
