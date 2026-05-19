import { Router } from 'express';
import { addRealEstateAsset, appendValuationRevaluation, viewPlatformAuditLedger } from '../controllers/admin.controller';
import { verifyGatewaySession } from '../middleware/auth.middleware';
import { checkAccessRole } from '../middleware/rbac.middleware';
import { auditInterceptor } from '../middleware/interceptor.middleware';

const router = Router();

router.use(verifyGatewaySession);

router.post('/real-estate/add', checkAccessRole(['ADMIN']), auditInterceptor, addRealEstateAsset);
router.post('/real-estate/revalue', checkAccessRole(['ADMIN']), auditInterceptor, appendValuationRevaluation);
router.get('/audit-logs', checkAccessRole(['ADMIN']), viewPlatformAuditLedger);

export default router;