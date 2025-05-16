const BinaryWriter = require("./BinaryWriter");

class SendMsg {
    constructor(message, color) {
        this.message = message;
        this.color = color;
    }
    build(protocol) {
        let obj = {
            'Message': this.message,
            'Color': this.color,
        };
        var json = JSON.stringify(obj);
        var writer = new BinaryWriter();
        writer.writeUInt8(134); // Message Id
        writer.writeStringZeroUtf8(json); // JSON
        return writer.toBuffer();
    }
}

module.exports = SendMsg;