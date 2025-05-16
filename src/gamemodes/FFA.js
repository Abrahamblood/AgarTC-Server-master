const Mode = require('./Mode');

class FFA extends Mode {
    constructor() {
        super();
        this.ID = 0;
        this.name = "Free For All";
        this.specByLeaderboard = true;
    }
    onServerInit(server) {
        server.run = true;
    }

    startTimer(server) {
        let timeLeft = 3600; // 3 minutes in seconds

        const timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                server.sendMsg(``);
                server.rc();
                setTimeout(() => {
                    this.startTimer(server); // Restart the timer after restart
                    //  server.run = true;
                }, 2500);
                return;
            }

            const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const seconds = String(timeLeft % 60).padStart(2, '0');
            server.sendMsg(`${minutes}:${seconds}`);
            timeLeft--;
        }, 1000);
    }


    // Gamemode Specific Functions
    onPlayerSpawn(server, player, boolBot) {
        player.color = server.getRandomColor();
        // Spawn player
        server.spawnPlayer(player, server.randomPos(), boolBot);
    }
    updateLB(server, lb) {
        server.leaderboardType = this.packetLB;
        for (var i = 0, pos = 0; i < server.clients.length; i++) {
            var player = server.clients[i].player;
            if (player.isRemoved || !player.cells.length ||
                player.socket.isConnected == false || (!server.config.minionsOnLeaderboard && player.isMi))
                continue;
            for (var j = 0; j < pos; j++)
                if (lb[j]._score < player._score)
                    break;
                
            lb.splice(j, 0, player);
            pos++;
        }
        this.rankOne = lb[0];
    }
}

module.exports = FFA;
FFA.prototype = new Mode();
