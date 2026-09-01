import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { healthRouter } from './routes/health';

const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);

app.listen(env.port, () => {
  console.log(`cloud6-server listening on port ${env.port} (${env.nodeEnv})`);
});
