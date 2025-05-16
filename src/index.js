// External modules.
require('dotenv').config();
process.chdir(__dirname);

const ReadLine = require("readline");
const fs = require("fs");

const addToProto = (obj, name, func) => {
    if (!obj.prototype[name]) obj.prototype[name] = func;
};
addToProto(Array, "removeSorted", function(item) {
    const index = this.indexOf(item);
    if (index != -1) this.splice(index, 1);
    return this;
});
addToProto(Array, "removeUnsorted", function(item, index = this.indexOf(item)) {
    if (index == this.length - 1) this.pop();
    else if (index != -1) this[index] = this.pop();
    return this;
});

// Project modules.
const Commands = require("./modules/CommandList.js");
const Server = require("./Server.js");
const Logger = require("./modules/Logger.js");

// Leer archivo de configuración personalizado desde argumento
const path = require("path");
const configArg = process.argv[2];
let config;

if (configArg) {
    const resolvedPath = path.join(__dirname, configArg);
    console.log("Buscando archivo en:", resolvedPath);

    try {
        config = require(resolvedPath);
        Logger.info(`🛠️  Usando configuración personalizada: ${resolvedPath}`);
    } catch (err) {
        Logger.fatal(`❌ Error al cargar el archivo: ${resolvedPath}`);
        console.error(err);
        process.exit(1);
    }

} else {
    config = require("./config.js");
    Logger.info("🛠️  Usando configuración por defecto: config.js");
}

// Crear consola
const inputInterface = ReadLine.createInterface(process.stdin, process.stdout);

// Crear e iniciar servidor
const server = new Server(config);
server.start();
Logger.info(`✔️ Servidor iniciado en puerto ${config.serverPort} con modo ${config.serverGamemode}`);
