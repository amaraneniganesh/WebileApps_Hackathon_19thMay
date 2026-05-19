import express from 'express';
import dotenv from 'dotenv';
import mfRoutes from './routes/mf.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Mount the mutual funds microservice route tree
app.use('/mf', mfRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Server 2 Mutual Fund Infrastructure Motor' });
});

app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`[SERVER 2] Mutual Funds microservice operational on port: ${PORT}`);
  console.log(`==================================================================`);
});