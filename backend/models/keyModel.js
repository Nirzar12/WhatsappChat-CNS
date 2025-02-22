import mongoose from 'mongoose';

const chatKeySchema = new mongoose.Schema({
    user1: { type: String, required: true },
    user2: { type: String, required: true },
    aesKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const ChatKey = mongoose.model('ChatKey', chatKeySchema);
export default ChatKey;
