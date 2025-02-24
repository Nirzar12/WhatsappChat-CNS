import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";
import toast from "react-hot-toast";

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
      // alert("Please log in first.");
      toast.error("Please log in first.");
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

    socket.on("receive-connection-request", ({ sender, aesKey }) => {
      setIncomingRequest(sender);
      localStorage.setItem("aesKey", aesKey);
      console.log(`🔑 Received AES key from ${sender}: ${aesKey}`);
    });

    socket.on("connection-accepted", ({ receiver }) => {
      setSelectedUser(receiver);
      // alert(`Connected with ${receiver}`);
      toast.success(`Connected with ${receiver}`);
    });

    socket.on("connection-rejected", ({ receiver }) => {
      // alert(`${receiver} rejected your connection request.`);
      toast.error(`${receiver} rejected your connection request.`);
    });

    socket.on("receiveMessage", ({ sender, text }) => {
      const decryptedMessage = decryptMessage(text);
      setMessages((prev) => [...prev, { sender, text: decryptedMessage }]);
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

  const generateAESKey = () => {
    let key = localStorage.getItem("aesKey");
    if (!key) {
      key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
      localStorage.setItem("aesKey", key);
    }
    return key;
  };

  let aesKey = localStorage.getItem("aesKey");

  const encryptMessage = (message, key) => {
    return CryptoJS.AES.encrypt(message, key).toString();
  };

  const decryptMessage = (encryptedMessage) => {
    const key = localStorage.getItem("aesKey");
    if (!key) return "[Decryption Failed: Key Missing]";
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedText || "[Decryption Failed]";
    } catch (error) {
      return "[Decryption Failed]";
    }
  };

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
      const response = await axios.get(
        "http://localhost:5000/api/users/online"
      );
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
    aesKey = generateAESKey();
    socket.emit("send-connection-request", {
      sender: loggedInUser,
      receiver: receiverUsername,
      aesKey,
    });
    // alert(`Connection request sent to ${receiverUsername}`);
    toast.success(`Connection request sent to ${receiverUsername}`);
  };

  const acceptRequest = () => {
    if (incomingRequest) {
      const aesKey = localStorage.getItem("aesKey");
      socket.emit("connection-response", {
        sender: incomingRequest,
        receiver: loggedInUser,
        accepted: true,
        aesKey,
      });
      setSelectedUser(incomingRequest);
      setIncomingRequest(null);
      // alert(`Connected with ${incomingRequest}`);
      toast.success(`Connected with ${incomingRequest}`);
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
      // alert(`Rejected connection request from ${incomingRequest}`);
      toast.error(`Rejected connection request from ${incomingRequest}`);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      const encryptedMessage = encryptMessage(newMessage, aesKey);
      socket.emit("sendMessage", {
        sender: loggedInUser,
        receiver: selectedUser,
        text: encryptedMessage,
      });
      setMessages((prev) => [
        ...prev,
        { sender: loggedInUser, text: newMessage },
      ]);
      setNewMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // alert("You're already logged out.");
        toast.error("You're already logged out.");
        navigate("/");
        return;
      }
      const { username } = JSON.parse(atob(token.split(".")[1]));
      await axios.post("http://localhost:5000/api/users/logout", { username });
      localStorage.clear();
      // alert("Logout successful!");
      toast.success("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
      // alert("Logout failed. Please try again.");
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-gray-900 to-black text-white">
      {incomingRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 p-8 rounded-xl shadow-xl text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">
              {incomingRequest} wants to connect with you.
            </h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={acceptRequest}
                className="px-4 py-2 bg-green-600 rounded-xl flex items-center gap-2 hover:bg-green-700"
              >
                <FaCheck /> Accept
              </button>
              <button
                onClick={rejectRequest}
                className="px-4 py-2 bg-red-600 rounded-xl flex items-center gap-2 hover:bg-red-700"
              >
                <FaTimes /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-1/4 bg-gray-800 p-4 shadow-xl overflow-y-auto">
        <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2">
          <FaUserCircle /> Chat App
        </h2>
        <div className="mb-6 p-3 bg-blue-700 rounded-xl shadow-md">
          <p className="font-semibold">Logged in as: {loggedInUser}</p>
        </div>

        <h3 className="text-xl font-semibold mb-3">Registered Users</h3>
        {users.map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between p-3 mb-2 rounded-xl bg-gray-700 shadow-md hover:shadow-lg transition-all"
          >
            <p className="font-semibold">{user.username}</p>
            <div className="flex items-center gap-2">
              {selectedUser === user.username ? (
                <span className="px-2 py-1 text-sm rounded-xl bg-green-600">
                  ✅ Connected
                </span>
              ) : (
                <>
                  <span
                    className={`px-2 py-1 text-sm rounded-xl ${
                      onlineUsers[user.username]
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {onlineUsers[user.username] ? "Online" : "Offline"}
                  </span>
                  {onlineUsers[user.username] && (
                    <button
                      onClick={() => handleConnect(user.username)}
                      className="px-2 py-1 bg-blue-600 rounded-xl flex items-center gap-1 hover:bg-blue-700"
                    >
                      <FaUserPlus /> Connect
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-8 bg-gray-900">
        {selectedUser ? (
          <>
            <div className="flex justify-between items-center mb-4 bg-gray-800 p-4 rounded-xl shadow-lg animate-slide-in">
              <h2 className="text-2xl font-bold">
                Chat with {selectedUser} 💬
              </h2>
              <button
                onClick={() => {
                  // ToastIcon.success(`disconnected with ${selectedUser}`)
                  setSelectedUser(null);
                  localStorage.removeItem("aesKey");
                }}
                className="px-4 py-2 bg-red-600 rounded-xl flex items-center gap-2 hover:bg-red-700"
              >
                <FaSignOutAlt /> Disconnect
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-800 rounded-xl h-96">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 p-3 rounded-xl shadow-md ${
                    msg.sender === loggedInUser
                      ? "bg-blue-600 ml-auto text-right"
                      : "bg-green-600 mr-auto"
                  }`}
                >
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-gray-400">
                  🚀 No messages yet. Start chatting!
                </p>
              )}
            </div>

            <div className="flex gap-3 bg-gray-800 p-4 rounded-xl">
              <input
                type="text"
                className="flex-1 p-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 rounded-xl flex items-center gap-2 hover:bg-blue-700"
              >
                <FaPaperPlane /> Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h1 className="text-5xl font-extrabold">
              🚀 Welcome to the Chat Page!
            </h1>
            <p className="mt-3 text-lg text-gray-400">
              Select a user to start chatting securely.
            </p>
            <button
              onClick={handleLogout}
              className="mt-6 px-6 py-3 bg-red-600 rounded-xl flex items-center gap-2 hover:bg-red-700"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
