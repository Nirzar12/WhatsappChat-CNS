import express from "express";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ username, password });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // ✅ Set user as online in the database
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login successful", token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Logout User
router.post("/logout", async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Set user as offline in the database
    await User.findByIdAndUpdate(user._id, { isOnline: false });

    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err.message });
  }
});

// Get all registered users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "username"); // Only fetch usernames
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
});

// Get users with their online status
router.get("/online", async (req, res) => {
  try {
    const users = await User.find({}, "username isOnline");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
});

router.post("/disconnect", async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    const senderUser = await User.findOne({ username: sender });
    const receiverUser = await User.findOne({ username: receiver });

    if (senderUser) senderUser.activeChatKeys.delete(receiver);
    if (receiverUser) receiverUser.activeChatKeys.delete(sender);

    await senderUser?.save();
    await receiverUser?.save();

    res.json({ message: "Chat disconnected and AES key removed." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to disconnect chat.", error: error.message });
  }
});

export default router;
