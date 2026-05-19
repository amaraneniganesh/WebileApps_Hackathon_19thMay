import { Router } from 'express';
import { getCustomerPortfolio, getCustomerSips, getCustomerTransactions } from '../controllers/mf.controller';
import { verifyHmacSignature } from '../middleware/hmac.middleware';

const router = Router();

// 🔓 1. TEMPORARY BYPASS ROUTES FOR FRICTIONLESS POSTMAN TESTING
router.get('/test/portfolio/:customerRef', getCustomerPortfolio);
router.get('/test/sips/:customerRef', getCustomerSips);
router.get('/test/transactions/:customerRef', getCustomerTransactions);

// 🔒 2. SECURE PRODUCTION ROUTES (This stays protected by the mandatory HMAC specifications)
router.use(verifyHmacSignature);

router.post('/portfolio/:customerRef', getCustomerPortfolio);
router.post('/sips/:customerRef', getCustomerSips);
router.post('/transactions/:customerRef', getCustomerTransactions);

export default router;