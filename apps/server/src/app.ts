import cors from 'cors';
import express from 'express';

import { healthRouter } from './routes/health';
import { personalizationRouter } from './routes/personalization';
import { recommendationsRouter } from './routes/recommendations';
import { routesRouter } from './routes/routes';
import { weatherRouter } from './routes/weather';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/personalization', personalizationRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/routes', routesRouter);
