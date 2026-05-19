import { Router } from 'express';
import { EquityController } from '../controllers/equity.controller';
import { authenticateEquityToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/holdings', authenticateEquityToken, EquityController.getHoldings);
router.get('/transactions', authenticateEquityToken, EquityController.getTransactions);
router.get('/watchlist', authenticateEquityToken, EquityController.getWatchlist);
router.get('/market-prices', authenticateEquityToken, EquityController.getMarketPrices);

export default router;