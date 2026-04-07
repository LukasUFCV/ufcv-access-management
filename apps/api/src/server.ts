import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.APP_PORT, () => {
  console.log(`API Habilitations UFCV disponible sur ${env.APP_URL}`);
});
