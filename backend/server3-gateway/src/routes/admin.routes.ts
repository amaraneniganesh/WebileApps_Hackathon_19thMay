import { Router } from 'express';
import { 
  opsOrUserAddRealEstate, 
  appendValuationRevaluation, 
  viewPlatformAuditLedger,
  opsAddEquityAssetWithLog,
  opsAddMutualFundWithLog,
  opsOrAdminUpdateProperty,
  opsOrAdminDeleteProperty,
  opsProxyUpdateEquityHoldings,      // 🔥 REST CRUD Proxy Mount
  opsProxyDeleteEquityHoldings,      // 🔥 REST CRUD Proxy Mount
  opsProxyUpdateMutualFundsHoldings,  // 🔥 REST CRUD Proxy Mount
  opsProxyDeleteMutualFundsHoldings   // 🔥 REST CRUD Proxy Mount
} from '../controllers/admin.controller';
import { verifyGatewaySession } from '../middleware/auth.middleware';
import { checkAccessRole } from '../middleware/rbac.middleware';
import { auditInterceptor } from '../middleware/interceptor.middleware';

const router = Router();

// Force structural session interception across all admin/ops vectors
router.use(verifyGatewaySession);

// ==========================================
// ➕ CREATE ENGINE (Ingestions)
// ==========================================
// Real Estate: Accessible by Admin, RM, OPS, and self-submitting Viewers
router.post('/real-estate/add', checkAccessRole(['ADMIN', 'RM', 'OPS', 'VIEWER']), auditInterceptor, opsOrUserAddRealEstate);

// Stocks & Mutual Funds Ingestions: Accessible by Admin, RM, and OPS
router.post('/equity/inject-asset', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsAddEquityAssetWithLog);
router.post('/mutual-funds/inject-asset', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsAddMutualFundWithLog);

// ==========================================
// 🔄 UPDATE ENGINE (Modifications)
// ==========================================
// Real Estate Update
router.put('/real-estate/update', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsOrAdminUpdateProperty);

// Downstream Microservice CRUD Proxies (Server 1 & Server 2)
router.put('/equity/update-asset', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsProxyUpdateEquityHoldings);
router.put('/mutual-funds/update-asset', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsProxyUpdateMutualFundsHoldings);

// ==========================================
// 🗑️ DELETE ENGINE (Purging)
// ==========================================
// Real Estate Cascade Deletion
router.delete('/real-estate/delete/:propertyId', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsOrAdminDeleteProperty);

// Downstream Microservice Purge Proxies (Requires both identification params for wire dispatching)
router.delete('/equity/delete-asset/:investorId/:id', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsProxyDeleteEquityHoldings);
router.delete('/mutual-funds/delete-asset/:customerRef/:id', checkAccessRole(['ADMIN', 'RM', 'OPS']), auditInterceptor, opsProxyDeleteMutualFundsHoldings);

// ==========================================
// 🛠️ ADMINISTRATIVE EXCLUSIVE ENCLAVES
// ==========================================
router.post('/real-estate/revalue', checkAccessRole(['ADMIN']), auditInterceptor, appendValuationRevaluation);
router.get('/audit-logs', checkAccessRole(['ADMIN']), viewPlatformAuditLedger);

export default router;