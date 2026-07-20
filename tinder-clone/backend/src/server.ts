import { app, server } from './app';
import os from 'os';

const PORT = process.env.PORT || 3000;

// Listen on all network interfaces so phones on the same Wi-Fi can connect
server.listen(Number(PORT), '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const localIPs = Object.values(nets)
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n!.address);

  console.log(`\n🚀 Server running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  localIPs.forEach((ip) => console.log(`   Network: http://${ip}:${PORT}  ← use this on your phone`));
  console.log('');
});
