const WebSocket = require("ws");
const Packet = require('./packet');
const BinaryReader = require('./packet/BinaryReader');
const BinaryWriter = require('./packet/BinaryWriter');
const CryptoJS = require('crypto-js');
const authConfig = require('./AuthConfig');

class AuthHandler {
    constructor(server, client) {
        this.server = server;
        this.client = client;
        this.authPackets = {
            37: this.auth_1.bind(this),
            128: this.token_1.bind(this),
            199: this.auth_2.bind(this),
        };
        this.client.player.allowPackets = false;
    }

    message(e) {
        if (!this.authPackets.hasOwnProperty(e[0])) return;
        this.authPackets[e[0]](e);
        this.client.lastAliveTime = this.server.stepDateTime;
    }

    verifyKey(encToken) {

    }

    auth_1() {
        var token = new CustomEncryptor(authConfig.tokenLength);
        this.encryptedToken = token.token;
        this.sendPacket(new Packet.SendToken(this.encryptedToken));
        this.getEncryptKey();
    }

    auth_2() {
        this.key = (Math.random() * 0xFFFFFFF) | 0;
        this.answer = ((this.key ^ 107650635) >> 2) | 257113543;
    }

    getEncryptKey() {
        this.sendPacket(new Packet.SendToken(authConfig.encrytionKey, 2));
    }

    token_1() {

    }


    sendPacket(packet) {
        var socket3 = this.client;
        var socket = this.client.client;
        if (!packet || socket3.player.isMi ||
            socket3.player.isBot) {
            return;
        }
        if (socket3.readyState == WebSocket.OPEN) {
            var buffer = packet.build(socket.protocol);
            if (buffer) socket3.send(buffer, { binary: true });
        }
    }
}


class CustomEncryptor {
    constructor(length) {
        this.key = authConfig.encrytionKey;;  // The secret key used for encryption

        this.token = this.createToken(length);
    }

    createToken(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%$£"!()*&^%+_=-@;:/?><,.|';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        // console.log(result);
        return this.encrypt(result);
    }

    // Shift a character by the specified shift value
    _shiftChar(char, shiftValue) {
        const charCode = char.charCodeAt(0);
        const newCode = (charCode + shiftValue) % 256;
        return String.fromCharCode(newCode);
    }

    // XOR a value with the key
    _xorWithKey(value, key) {
        return value ^ key;
    }

    // Convert a value to a binary string
    _toBinary(value) {
        return value.toString(2).padStart(8, '0');
    }

    // Convert a binary string back to an integer
    _fromBinary(binaryValue) {
        return parseInt(binaryValue, 2);
    }

    // Encrypt the given value
    encrypt(value) {
        let encrypted = [];
        const shiftValue = this.key.length; // Using the length of the key as the shift value

        // First step: Shift each character by a value based on the key's length
        for (let i = 0; i < value.length; i++) {
            encrypted.push(this._shiftChar(value[i], shiftValue));
        }

        // Second step: XOR each shifted character's charCode with the ASCII value of key's characters
        let encryptedBinary = [];
        for (let i = 0; i < encrypted.length; i++) {
            const charCode = encrypted[i].charCodeAt(0);
            const keyCharCode = this.key.charCodeAt(i % this.key.length);
            encryptedBinary.push(this._xorWithKey(charCode, keyCharCode));
        }

        // Convert the XORed values to binary and join them into a string
        let encryptedStr = encryptedBinary.map(val => this._toBinary(val)).join('');
        return encryptedStr;
    }

    // Decrypt the given encrypted value
    decrypt(encryptedValue) {
        let decrypted = [];
        const shiftValue = this.key.length;

        // Split the encrypted binary string into 8-bit chunks
        const binaryChunks = encryptedValue.match(/.{1,8}/g);

        // Reverse the encryption steps
        let decryptedChars = [];
        for (let i = 0; i < binaryChunks.length; i++) {
            const binary = binaryChunks[i];
            const charCode = this._fromBinary(binary);
            const keyCharCode = this.key.charCodeAt(i % this.key.length);
            decryptedChars.push(String.fromCharCode(this._xorWithKey(charCode, keyCharCode)));
        }

        // Reverse the shifting
        for (let i = 0; i < decryptedChars.length; i++) {
            decrypted.push(this._shiftChar(decryptedChars[i], -shiftValue));  // Negate the shift for decryption
        }

        return decrypted.join('');
    }
}

class authToken {
    constructor(length) {
        this.key = authConfig.encrytionKey;

        if (!this.key || this.key.length === 0) {
            throw new Error('Key is not properly initialized');
        }

        this.token = this.createToken(length);
    }

    createToken(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%$£"!()*&^%+_=-@;:/?><,.|';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        ///  console.log(result);
        return this.encrypt(result);
    }

    encrypt(text) {
        const hashedText = this._hashText(text);
        const substitutedText = this._multiLayerSubstitution(hashedText);
        const scrambledText = this._scrambleText(substitutedText);
        const aesEncrypted = this._aesEncrypt(scrambledText);
        const base64Encoded = this._base64Encode(aesEncrypted);
        return base64Encoded;
    }

    decrypt(encryptedText) {
        const base64Decoded = this._base64Decode(encryptedText);
        const decryptedAES = this._aesDecrypt(base64Decoded);
        const unscrambledText = this._unscrambleText(decryptedAES);
        const unsubstitutedText = this._reverseMultiLayerSubstitution(unscrambledText);
        return this._recoverOriginalText(unsubstitutedText);
    }

    _aesEncrypt(text) {
        return this._aesEncryptCustom(text, this.key);
    }

    _aesDecrypt(text) {
        return this._aesDecryptCustom(text, this.key);
    }

    // SHA256 Hash (Custom Implementation)
    _hashText(text) {
        return this._sha256(text);
    }

    // Base64 Encoding and Decoding (Custom Implementation)
    _base64Encode(text) {
        return this._base64EncodeCustom(text);
    }

    _base64Decode(text) {
        return this._base64DecodeCustom(text);
    }

    // Custom SHA256 Hash function (basic implementation)
    _sha256(text) {
        const utf8Text = unescape(encodeURIComponent(text)); // Convert text to UTF-8
        const hash = new Array(64);
        const prime = 0x6a09e667f3bcc908;

        // Perform SHA256 hashing here (not a complete implementation of SHA256 here, for brevity)
        // This is a placeholder for the actual hashing function
        return utf8Text;  // Return the UTF-8 version as a placeholder, implement your full SHA256 here
    }

    // Custom Base64 Encode Function
    _base64EncodeCustom(text) {
        let result = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let charCode;
        let i = 0;
        while (i < text.length) {
            charCode = text.charCodeAt(i++);
            result += chars.charAt(charCode >> 2);
            charCode = (charCode & 3) << 4 | text.charCodeAt(i++) >> 4;
            result += chars.charAt(charCode);
            if (i < text.length) {
                charCode = (text.charCodeAt(i++) & 15) << 2;
                result += chars.charAt(charCode);
            }
        }
        return result;
    }

    // Custom Base64 Decode Function
    _base64DecodeCustom(text) {
        let result = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let i = 0;
        while (i < text.length) {
            let charCode = chars.indexOf(text.charAt(i++)) << 2 | chars.indexOf(text.charAt(i++)) >> 4;
            result += String.fromCharCode(charCode);
            if (i < text.length) {
                charCode = (chars.indexOf(text.charAt(i++)) & 15) << 4 | chars.indexOf(text.charAt(i++)) >> 2;
                result += String.fromCharCode(charCode);
            }
        }
        return result;
    }

    // AES Encrypt function (simplified custom implementation)
    _aesEncryptCustom(text, key) {
        let keyBytes = this._stringToBytes(key);
        let textBytes = this._stringToBytes(text);
        // Simplified encryption (you should use a proper AES library here for secure encryption)
        return textBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]).map(byte => String.fromCharCode(byte)).join('');
    }

    // AES Decrypt function (simplified custom implementation)
    _aesDecryptCustom(text, key) {
        let keyBytes = this._stringToBytes(key);
        let textBytes = Array.from(text).map(char => char.charCodeAt(0));
        return textBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]).map(byte => String.fromCharCode(byte)).join('');
    }

    // Convert string to byte array
    _stringToBytes(str) {
        return Array.from(str).map(char => char.charCodeAt(0));
    }

    _multiLayerSubstitution(text) {
        let result = text;
        let shifts = [3, 5, -2, 4, -7];

        shifts.forEach((shift) => {
            result = this._substitutionCipher(result, shift);
        });
        return result;
    }

    _substitutionCipher(text, shift) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            result += String.fromCharCode(charCode + shift);
        }
        return result;
    }

    _reverseMultiLayerSubstitution(text) {
        let result = text;
        let shifts = [3, 5, -2, 4, -7];

        for (let i = shifts.length - 1; i >= 0; i--) {
            result = this._substitutionCipher(result, -shifts[i]);
        }
        return result;
    }

    _scrambleText(text) {
        if (!this.key || this.key.length === 0) {
            throw new Error('Key is not defined or is empty');
        }

        let result = '';
        let keyLength = this.key.length;

        for (let i = 0; i < text.length; i++) {
            let charCode = text.charCodeAt(i) + this.key.charCodeAt(i % keyLength);
            result += String.fromCharCode(charCode);
        }

        return result;
    }

    _unscrambleText(text) {
        if (!this.key || this.key.length === 0) {
            throw new Error('Key is not defined or is empty');
        }

        let result = '';
        let keyLength = this.key.length;

        for (let i = 0; i < text.length; i++) {
            let charCode = text.charCodeAt(i) - this.key.charCodeAt(i % keyLength);
            result += String.fromCharCode(charCode);
        }

        return result;
    }

    _recoverOriginalText(hashedText) {
        return "Original text cannot be recovered from the hash (SHA-256 is one-way)!";
    }
}


module.exports = AuthHandler;
