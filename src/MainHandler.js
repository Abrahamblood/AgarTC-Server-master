const WebSocket = require("ws");
const Packet = require('./packet');
const BinaryReader = require('./packet/BinaryReader');
const fs = require("fs");

class Client {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.protocol = 0;
        this.handshakeProtocol = null;
        this.handshakeKey = null;
        this.lastJoinTick = 0;
        this.lastChatTick = 0;
        this.lastStatTick = 0;
        this.toggleSpectate = false;
        this.ejectRequested = false;
        this.splitRequested = false;
        this.mouseData = null;
        this.handler = {
            3: this.onprotocol.bind(this),
        };
    }
    message(e) {
        if (!this.handler.hasOwnProperty(e[0])) return;
        this.handler[e[0]](e);
        this.socket.lastAliveTime = this.server.stepDateTime;
    }

    onprotocol(message) {
        if (message.length !== 10) return;
        var buffer = Buffer.from(message);
        this.val_1 = buffer.readUInt16LE(7);
        this.val_2 = buffer.readUInt16LE(2);

        if (this.val_1 !== 64 && this.val_2 !== 75) {
            this.socket.close(1000, "Invalid Keys");
            console.log("invalid 1");
        }

        this.handler = {
            37: this.onKey.bind(this),
        };
    }

    onKey(message) {
        if (message.length !== 5) return;
        var buffer = Buffer.from(message);
        this.val_1 = buffer.readUInt16LE(1);
        this.val_2 = buffer.readUInt16LE(3);

        if (this.val_1 !== 11 && this.val_2 !== 90) {
            this.socket.close(1000, "Invalid Keys");
            console.log("invalid 2");
        }

        this.process(6);
    }


    process(protocol) {
        this.handler = {
            16: this.onMouseMove.bind(this),
            43: this.onPlay.bind(this),
            97: this.chatMessage.bind(this),
            98: this.handleAction.bind(this),
        };
        this.protocol = protocol;
        this.sendPacket(new Packet.ClearAll());
        this.sendPacket(new Packet.SetBorder(this.socket.player, this.server.border, this.server.config.serverGamemode, "MultiOgarII " + this.server.version));
    }

    onPlay(message) {
        const arrayBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
        const reader = new DataView(arrayBuffer);
        let offset = 0;
        const action = reader.getUint8(offset);
        offset += 1;
        let name = '';
        while (offset < message.byteLength) {
            name += String.fromCharCode(reader.getUint16(offset, true));
            offset += 2;
        }
        this.setNickname(name);
    }


    handleAction(message) {
        const arrayBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
        const reader = new DataView(arrayBuffer);
        if (reader.byteLength < 30) {
            this.socket.close(1000, "Invalid Packet Size");
            return;
        }
        const action = reader.getUint8(1);
        let receivedToken = "";
        for (let i = 0; i < 25; i++) {
            receivedToken += String.fromCharCode(reader.getUint8(5 + i));
        }
        if (receivedToken.length !== 25 || !/^[A-Za-z0-9]{25}$/.test(receivedToken)) {
            this.socket.close(1000, "Invalid Token");
            return;
        }
        switch (action) {
            case 1:
                if (this.socket.player.cells.length !== 0) return;
                this.socket.player.spectate = true;
                this.socket.player.freeRoam = false;
                break;
            case 2:
                this.socket.player.split();
                break;
            case 3:
                this.socket.player.spectateToggle();
                break;
            case 4:
                this.socket.player.eject();
                break;
            case 5:
                this.socket.player.minionSplit = true;
                this.socket.player.minionSplit = false;
                break;
            case 6:
                this.socket.player.minionEject = true;
                this.socket.player.minionEject = false;
                break;
            case 7:
                this.socket.player.minionFrozen = !this.socket.player.minionFrozen;
                break;
            case 8:
                const dt = this.server.ticks - this.lastStatTick;
                this.lastStatTick = this.server.ticks;
                if (dt < 25) return;
                this.sendPacket(new Packet.ServerStat(this.socket.player));
                break;
            default:
                this.socket.close(1001, "Invalid packet");
        }
    }


    onMouseMove(message) {
        if (message.length !== 13 && message.length !== 9
            && message.length !== 21) return;
        this.mouseData = Buffer.concat([message]);
        this.processMouse();
    }

    chatMessage(message) {
        const tick = this.server.ticks
        const dt = tick - this.lastChatTick;
        this.lastChatTick = tick;
        if (dt < 25 * 2) return;
        if (this.socket.player.spectate) {
            this.server.sendChatMessage(null, this.socket.player, "You must play to chat!");
            return;
        }
        const arrayBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength);
        const reader = new DataView(arrayBuffer);
        let offset = 0;
        const action = reader.getUint8(offset);
        offset += 1;
        let chatmessage = '';
        while (offset < message.byteLength) {
            chatmessage += String.fromCharCode(reader.getUint16(offset, true));
            offset += 2;
        }
        this.server.onChatMessage(this.socket.player, null, chatmessage);
    }

    processMouse() {
        if (this.mouseData == null) return;
        let player = this.socket.player;
        var reader = new BinaryReader(this.mouseData);
        reader.skipBytes(1);
        if (this.mouseData.length === 13) {
            player.mouse.x = reader.readInt32() - player.scrambleX;
            player.mouse.y = reader.readInt32() - player.scrambleY;
        } else if (this.mouseData.length === 9) {
            player.mouse.x = reader.readInt16() - player.scrambleX;
            player.mouse.y = reader.readInt16() - player.scrambleY;
        } else if (this.mouseData.length === 21) {

            player.mouse.x = ~~reader.readDouble() - player.scrambleX;
            player.mouse.y = ~~reader.readDouble() - player.scrambleY;
        }
        this.mouseData = null;
    }

    setNickname(text, boolBot) {
        let name = "Agar Teams", skin = null;

        const escapeHTML = (str) => {
            return str.replace(/[&<>"']/g, (char) => {
                const escapeMap = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                };
                return escapeMap[char] || char;
            });
        };

        if (text && text.length > 0) {
            const skinMatch = text.match(/^<(.*?)>/);
            if (skinMatch) {
                skin = skinMatch[1] || "";
                name = text.slice(skinMatch[0].length);
            } else {
                name = text;
            }
        }

        name = escapeHTML(name);
        skin = skin ? escapeHTML(skin) : null;

        name = name.substring(0, this.server.config.playerMaxNickLength);
        if (this.server.checkBadWord(name)) {
            skin = null;
            name = "Agar Teams";
        }

        this.socket.player.joinGame(name, skin, boolBot);
    }


    sendPacket(packet) {
        var socket = this.socket;
        if (!packet || !socket.isConnected || socket.player.isMi ||
            socket.player.isBot) return;
        if (socket.readyState == WebSocket.OPEN) {
            var buffer = packet.build(this.protocol);
            if (buffer) socket.send(buffer, { binary: true });
        }
    }
}

module.exports = Client;
