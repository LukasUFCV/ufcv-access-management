import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.APP_PORT, () => {
  console.log(`API Habilitations UFCV disponible sur ${env.APP_URL}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Le port ${env.APP_PORT} est deja utilise. Arrete le process en cours sur ce port puis relance \`npm run dev\`.`,
    );
    process.exit(1);
  }

  throw error;
});
