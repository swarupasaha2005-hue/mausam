import cors from 'cors';
import express from 'express';

import { healthRouter } from './routes/health';
import { weatherRouter } from './routes/weather';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use('/api/weather', weatherRouter);
