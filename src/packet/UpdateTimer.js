const BinaryWriter = require("./BinaryWriter");

class UpdateTimer {
    constructor(message) {
        this.message = message;
    }

    build() {
        const writer = new BinaryWriter();
        writer.writeUInt8(192); // Message Id
        writer.writeStringZeroUtf8(this.message);
        return writer.toBuffer();
    }
}

module.exports = UpdateTimer;
