# SecureChat-CNS: End-to-End Encrypted Chat

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.dot.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.dot.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)



**SecureChat-CNS** is a full-stack, real-time chat application developed to demonstrate a practical implementation of end-to-end encryption (E2EE) using the **Advanced Encryption Standard (AES)**. This project ensures that messages are kept private and secure, accessible only to the communicating users.

## Table of Contents

- [Key Features](#-key-features)
- [Security Model: How Encryption Works](#️-security-model-how-encryption-works)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)


## 🌟 Key Features

* **End-to-End Encryption**: All messages are encrypted on the client-side using AES-256 before transmission and decrypted only upon arrival, meaning the server cannot read message content.
* **Secure User Authentication**: Features a robust user registration and login system using JSON Web Tokens (JWT) for session management and `bcrypt` for password hashing.
* **Real-Time Communication**: Built with **Socket.IO** to provide an instant and seamless messaging experience.
* **Dynamic Key Exchange**: A symmetric AES key is generated client-side and securely shared with the peer upon connection acceptance, establishing a unique secure channel for each chat session.
* **User Presence System**: Displays the online/offline status of users in real-time.
* **Connection Handshake**: Users must initiate and accept connection requests before a chat can begin, ensuring mutual consent and a secure key exchange.
* **Modern & Responsive UI**: A clean user interface built with **React** and **Tailwind CSS**, featuring toast notifications for intuitive user feedback.

## 🛡️ Security Model: How Encryption Works

The application's security is centered around a client-side implementation of AES encryption. The server's role is limited to relaying encrypted data and managing user connections, without ever having access to the private keys or plaintext messages.

1.  **Connection Request**: User A wishes to chat with User B. User A clicks "Connect".
2.  **Key Generation**: User A's client generates a unique and cryptographically strong 256-bit symmetric AES key.
3.  **Key Sharing**: This AES key is sent to User B via the Socket.IO server as part of the connection request.
4.  **User Consent**: User B receives a connection request from User A and can either **Accept** or **Decline**.
5.  **Secure Channel Established**: If User B accepts, their client stores the received AES key. Both users now share the same secret key for their session.
6.  **Message Encryption**: When User A sends a message, it is encrypted on their device using the shared AES key before being transmitted.
7.  **Message Decryption**: User B's client receives the encrypted ciphertext and uses its stored AES key to decrypt the message back into plaintext. The server only ever sees the encrypted text.

## 🛠️ Tech Stack

### Frontend
* **Framework**: React 19
* **Bundler**: Vite
* **Routing**: React Router DOM
* **Styling**: Tailwind CSS
* **HTTP Client**: Axios
* **Real-Time**: Socket.io-client
* **Encryption**: Crypto-JS
* **Notifications**: React Hot Toast

### Backend
* **Framework**: Express.js
* **Real-Time**: Socket.IO
* **Database ORM**: Mongoose
* **Authentication**: JSON Web Token (JWT)
* **Password Hashing**: BcryptJS
* **Environment Variables**: Dotenv
* **Middleware**: CORS

### Database
* **Database**: MongoDB

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

* **Node.js**: v18.x or higher
* **npm**: Included with Node.js
* **MongoDB**: A running instance, either local or on a cloud service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Environment Configuration

Before starting, you need to set up your environment variables. In the `/backend` directory, create a `.env` file and add the following variables:

```ini
# Port for the backend server
PORT=5000

# Your MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/your-database-name

# A strong, secret key for signing JWT tokens
JWT_SECRET=your_super_secret_jwt_key
```
# Installation & Setup
1. Clone the Repository

```
git clone [https://github.com/your-username/WhatsappChat-CNS.git](https://github.com/your-username/WhatsappChat-CNS.git)
cd WhatsappChat-CNS 
```
2. Install Backend Dependencies

```
cd backend
npm install
```
3. Install Frontend Dependencies

```
cd ../frontend
npm install
```

# Running the Application
You will need two separate terminal windows to run both the frontend and backend servers.

Start the Backend Server
In the /backend directory:

```
npm start 
# Or if you don't have a start script:
# node index.js
```
The backend will start on the port defined in your .env file (e.g., http://localhost:5000).

Start the Frontend Development Server
In the /frontend directory:

```
npm run dev
```
The React application will start, typically on http://localhost:5173. Open this URL in your browser to use the app.
