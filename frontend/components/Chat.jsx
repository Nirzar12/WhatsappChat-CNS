import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";
import toast from "react-hot-toast";
const socket = io("http://localhost:5000", { autoConnect: false });

const Chat = () => {
  // ... (All existing state variables and logic remain the same)
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
      console.log(
        `🔑 [Key Receiving] Received AES Key from ${sender}:`,
        aesKey
      );
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
      console.log(
        `🔓 [Decryption] Received Encrypted Message from ${sender}:`,
        `\n- Encrypted Message: "${text}"`
      );
      const decryptedMessage = decryptMessage(text);
      console.log(
        `🔓 [Decryption] Decrypted Message:`,
        `\n- Decrypted Message: "${decryptedMessage}"`
      );
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
      console.log("🔑 [Key Generation] New AES Key Generated:", key);
    } else {
      console.log("🔑 [Key Generation] Using Existing AES Key:", key);
    }
    return key;
  };

  let aesKey = localStorage.getItem("aesKey");

  const encryptMessage = (message, key) => {
    return CryptoJS.AES.encrypt(message, key).toString();
  };

  const decryptMessage = (encryptedMessage) => {
    const key = localStorage.getItem("aesKey");
    if (!key) {
      console.error("🔓 [Decryption Failed] AES Key Missing!");
      return "[Decryption Failed: Key Missing]";
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedText) {
        console.error("🔓 [Decryption Failed] Invalid Key or Message!");
        return "[Decryption Failed]";
      }
      return decryptedText;
    } catch (error) {
      console.error("🔓 [Decryption Failed] Error:", error);
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
    console.log(
      `🔑 [Key Sharing] Sending AES Key to ${receiverUsername}:`,
      aesKey
    );
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
      console.log(
        `🔒 [Encryption] Encrypting Message:`,
        `\n- Original Message: "${newMessage}"`,
        `\n- Encrypted Message: "${encryptedMessage}"`
      );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex">
      {incomingRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Connection Request
              </h2>
              <p className="text-gray-400">
                {incomingRequest} wants to connect
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={acceptRequest}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Accept
              </button>
              <button
                onClick={rejectRequest}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-800/80 border-r border-gray-700 p-6 flex flex-col h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-300 bg-clip-text text-transparent">
            SecureChat
          </h1>
          <div className="mt-4 p-4 bg-gray-700/50 rounded-xl">
            <p className="text-sm font-medium   text-gray-300">
              👤 {loggedInUser}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Active Users
          </h3>
          {users.length > 0 ? (
            users.map((user) => (
              <div
                key={user._id}
                className={`group flex items-center justify-between p-3 mb-2 rounded-xl transition-all duration-200 ${
                  selectedUser === user.username
                    ? "bg-gradient-to-r from-blue-600/30 to-green-600/30"
                    : "hover:bg-gray-700/30"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full absolute -right-0.5 -top-0.5 border-2 border-gray-800">
                      <div
                        className={`w-full h-full rounded-full ${
                          onlineUsers[user.username]
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      />
                    </div>
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-300">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-200 font-medium">
                    {user.username}
                  </span>
                </div>

                {selectedUser === user.username ? (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                    Connected
                  </span>
                ) : (
                  onlineUsers[user.username] && (
                    <button
                      onClick={() => handleConnect(user.username)}
                      className="opacity-0 group-hover:opacity-100  px-3 py-1.5 text-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-full transition-all duration-200"
                    >
                      Connect
                    </button>
                  )
                )}
              </div>
            ))
          ) : (
            <div className="p-4 bg-gray-700/20 rounded-xl">
              <p className="text-center text-gray-400 text-sm">
                No other users found
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full py-3 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          Logout
        </button>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {selectedUser ? (
          <>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gray-800/30">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xl text-gray-300">
                    {selectedUser[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">
                    {selectedUser}
                  </h2>
                  <p className="text-sm text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  localStorage.removeItem("aesKey");
                }}
                className="px-5 py-2.5 bg-red-600/30 hover:bg-red-600/60  border-1 border-gray-700 text-white rounded-xl transition-all duration-200"
              >
                Disconnect
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-900/20 to-gray-900/50">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === loggedInUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl ${
                        msg.sender === loggedInUser
                          ? "bg-gradient-to-br from-blue-600 to-blue-700"
                          : "bg-gradient-to-br from-gray-700 to-gray-800"
                      }`}
                    >
                      <p className="text-md  font-mono text-gray-300 mb-1 ">
                        {msg.sender}
                      </p>
                      <p className="text-gray-100 ">{msg.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-12 h-12 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">
                      Start the Conversation
                    </h3>
                    <p className="text-gray-400">
                      Send your first secure message to {selectedUser}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-800/30">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your encrypted message..."
                  className="flex-1 p-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-500"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900/50 to-gray-900/20">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg
                  className="w-16 h-16 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-100 mb-4">
                Secure Chat Platform
              </h1>
              <p className="text-gray-400 mb-8">
                Select a user from the sidebar to start an encrypted
                conversation. All messages are end-to-end encrypted using
                AES-256.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
