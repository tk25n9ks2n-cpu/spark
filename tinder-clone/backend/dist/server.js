"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const os_1 = __importDefault(require("os"));
const PORT = process.env.PORT || 3000;
// Listen on all network interfaces so phones on the same Wi-Fi can connect
app_1.server.listen(Number(PORT), '0.0.0.0', () => {
    const nets = os_1.default.networkInterfaces();
    const localIPs = Object.values(nets)
        .flat()
        .filter((n) => n && n.family === 'IPv4' && !n.internal)
        .map((n) => n.address);
    console.log(`\n🚀 Server running!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    localIPs.forEach((ip) => console.log(`   Network: http://${ip}:${PORT}  ← use this on your phone`));
    console.log('');
});
