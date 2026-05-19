import { Router } from 'express';
import { getOperationsDashboard } from '../controllers/internal.controller';
import { verifyGatewaySession } from '../middleware/auth.middleware';
import { checkAccessRole } from '../middleware/rbac.middleware';
import { auditInterceptor } from '../middleware/interceptor.middleware';

const router = Router();

router.get('/dashboard', verifyGatewaySession, checkAccessRole(['ADMIN', 'OPS']), auditInterceptor, getOperationsDashboard);

export default router;