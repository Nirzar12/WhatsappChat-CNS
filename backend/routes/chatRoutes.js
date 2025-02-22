import express from 'express';
const router = express.Router();

router.post('/request', (req, res) => {
    const { sender, receiver } = req.body;
    if (!sender || !receiver) {
        return res.status(400).json({ message: "Sender and receiver are required." });
    }
    console.log(`Connection request received from ${sender} to ${receiver}`);
    res.status(200).json({ message: "Connection request sent successfully." });
});

export default router;
