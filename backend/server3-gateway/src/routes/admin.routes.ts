import { Router } from 'express';
import { 
  opsOrUserAddRealEstate, 
  appendValuationRevaluation, 
  viewPlatformAuditLedger,
  opsAddEquityAssetWithLog,
  opsAddMutualFundWithLog ,
    opsOrAdminUpdateProperty,
    opsOrAdminDeleteProperty
} from '../controllers/admin.controller';
import { verifyGatewaySession } from '../middleware/auth.middleware';
import { checkAccessRole } from '../middleware/rbac.middleware';
import { auditInterceptor } from '../middleware/interceptor.middleware';

const router = Router();

// Force structural session interception across all admin/ops vectors
router.use(verifyGatewaySession);

// Core Multi-Asset Operational Ingestion Nodes
router.post('/real-estate/add', checkAccessRole(['ADMIN', 'OPS', 'VIEWER']), auditInterceptor, opsOrUserAddRealEstate);
router.post('/equity/inject-asset', checkAccessRole(['ADMIN', 'OPS']), auditInterceptor, opsAddEquityAssetWithLog);
router.post('/mutual-funds/inject-asset', checkAccessRole(['ADMIN', 'OPS']), auditInterceptor, opsAddMutualFundWithLog);

// Exclusive Infrastructure Administrator Control Enclaves
router.post('/real-estate/revalue', checkAccessRole(['ADMIN']), auditInterceptor, appendValuationRevaluation);
router.get('/audit-logs', checkAccessRole(['ADMIN']), viewPlatformAuditLedger);

// New Property Lifecycle Controls
router.put('/real-estate/update', checkAccessRole(['ADMIN', 'OPS', 'RM']), auditInterceptor, opsOrAdminUpdateProperty);
router.delete('/real-estate/delete/:propertyId', checkAccessRole(['ADMIN', 'OPS', 'RM']), auditInterceptor, opsOrAdminDeleteProperty);

export default router;