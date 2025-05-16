// Library imports
const fs = require("fs");

// Project imports
const FakeSocket = require('./FakeSocket');
const Client = require('../MainHandler');
const BotPlayer = require('./BotPlayer');
const MinionPlayer = require('./MinionPlayer');

const botnameFile = "./ai/botnames.txt";
let botnames = null;
if (fs.existsSync(botnameFile))
    botnames = fs.readFileSync(botnameFile, "utf-8").split("\n");

class BotLoader {
    constructor(server) {
        this.server = server;
        this.botCount = 0;
    }
    addBot() {
        // Create a FakeSocket instance and assign its properties.
        const socket = new FakeSocket(this.server);
        socket.player = new BotPlayer(this.server, socket);
        socket.client = new Client(this.server, socket);
        const skins = [
            "Acorn", "Kraken", "Evader", "Kanji", "Glob", "Skin 5", "Jester", "Christmas Tree", "Target", "Skin 15",
            "Bat", "Dino", "Blue", "S Bunny", "Baby Octo", "Obba", "Hearts", "Baby Kraken", "Black Devil", "Vendetta",
            "Deadpool", "Mosasaurus", "Skel Bomb", "Crocodile", "Fire", "Gold Coin", "Mushroom", "Hero"
        ];

        const randomSkin = skins[Math.floor(Math.random() * skins.length)];

        const name = botnames ?
            botnames[Math.random() * botnames.length | 0] :
            `Bot | ${this.botCount++}`;

        // Add to client list and spawn.
        this.server.clients.push(socket);
        socket.client.setNickname(`<${randomSkin}> ` + name, "bot");
    }
    addMinion(owner, name, mass) {
        // Aliases
        const maxSize = this.server.config.minionMaxStartSize;
        const defaultSize = this.server.config.minionStartSize;

        // Create a FakeSocket instance and assign its properties.
        const socket = new FakeSocket(this.server);
        socket.player = new MinionPlayer(this.server, socket, owner);
        socket.client = new Client(this.server, socket);

        // Set minion spawn size
        socket.player.spawnmass = mass || maxSize > defaultSize ? Math.floor(Math.random() * (maxSize - defaultSize) + defaultSize) : defaultSize;

        // Add to client list
        this.server.clients.push(socket);

        // Add to world
        socket.client.setNickname(name == "" || !name ? this.server.config.defaultName : name);
    }
}

module.exports = BotLoader;
