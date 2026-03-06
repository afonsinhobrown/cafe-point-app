import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY = crypto.createHash('sha256').update('cafe-point-ultra-secure-key-2026').digest();
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
        let decrypted = decipher.update(encryptedText as any, 'base64', 'utf8'); // Supporting hex/base64
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        // Fallback for simple hex
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
        let decrypted = decipher.update(encryptedText as any, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};
