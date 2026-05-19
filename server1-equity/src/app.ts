import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import equityRoutes from './routes/equity.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Attach individual routing tables
app.use('/auth', authRoutes);
app.use('/equity', equityRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Server 1 Equity Infrastructure Motor' });
});

app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`[SERVER 1] Equity microservice operational on port: ${PORT}`);
  console.log(`==================================================================`);
});