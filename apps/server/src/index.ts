import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`cloud6-server listening on port ${env.port} (${env.nodeEnv})`);
});
