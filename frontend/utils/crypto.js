import crypto from 'crypto-browserify';

const encryptMessage = (message, aesKey) => {
    // Convert AES key to a Buffer (Hex format)
    const keyBuffer = Buffer.from(aesKey, 'hex');

    // Create AES cipher with CBC mode and zeroed IV
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, Buffer.alloc(16, 0));

    // Encrypt the message
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
};

// Example Usage
const aesKey = localStorage.getItem(`aesKey-${selectedUser}`);
const encryptedMessage = encryptMessage("Hello, how are you?", aesKey);

console.log("🔒 Encrypted Message:", encryptedMessage);
