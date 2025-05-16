const BinaryWriter = require("./BinaryWriter");

class SendToken {
    constructor(message, type = 1) {
        this.message = message;
        this.type = type;
    }

    build(protocol) {
        const writer = new BinaryWriter();
        writer.writeUInt8(78); // Message Id
        writer.writeStringZeroUtf8(this.message);

        // Assuming type is a number (UInt8), write it as UInt8
        writer.writeUInt8(this.type);

        return writer.toBuffer();
    }
}

module.exports = SendToken;
