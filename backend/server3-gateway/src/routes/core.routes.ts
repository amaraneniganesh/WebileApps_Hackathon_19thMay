import { Router } from 'express';
import { 
  gatewayLogin,
  unifiedGatewayRegister, 
  linkFinancialIdentity, 
  rmAssignInvestorToOps, 
  getAggregatedMultiAssetPortfolio,
  getMyAllocatedInvestors,
  adminFetchUserRegistry,       
  adminToggleUserLifecycle ,     
  adminProvisionCorporateStaff,
  getRmLookupMetadata,
  getRmAssignmentsLedger,
  getMyEquityHoldings,
  getMyEquityTransactions,
  getMyMfPortfolio,
  getMyMfSips,
  getMyMfTransactions
} from '../controllers/core.controller';
import { opsOrUserAddRealEstate } from '../controllers/admin.controller';
import { verifyGatewaySession } from '../middleware/auth.middleware';
import { checkAccessRole } from '../middleware/rbac.middleware';
import { auditInterceptor } from '../middleware/interceptor.middleware';

const router = Router();

// ==========================================
// 🔓 PUBLIC ENDPOINTS
// ==========================================
router.post('/register', unifiedGatewayRegister);
router.post('/login', gatewayLogin);

// ==========================================
// 🔒 SECURE CORE WORKFLOW LAYER (Requires Valid Bearer JWT)
// ==========================================
router.use(verifyGatewaySession);

// Self-Onboarding Identity Linkages
router.post('/link-identity', checkAccessRole(['VIEWER', 'ADMIN', 'OPS']), auditInterceptor, linkFinancialIdentity);

// Relationship Management Assignment Vectors (RMs + Admins Only)
router.post('/assign-ops', checkAccessRole(['RM', 'ADMIN']), auditInterceptor, rmAssignInvestorToOps);

// Multi-Asset Aggregator Pipelines
router.get('/portfolio', checkAccessRole(['VIEWER', 'RM', 'OPS', 'ADMIN']), auditInterceptor, getAggregatedMultiAssetPortfolio);
router.get('/portfolio/:panNumber', checkAccessRole(['ADMIN', 'RM']), auditInterceptor, getAggregatedMultiAssetPortfolio);
router.get('/my-investors', checkAccessRole(['OPS', 'ADMIN']), auditInterceptor, getMyAllocatedInvestors);

// Operational Asset Additions 
router.post('/real-estate/add', checkAccessRole(['ADMIN', 'OPS', 'VIEWER']), auditInterceptor, opsOrUserAddRealEstate);

// ==========================================
// 🛠️ ADMINISTRATIVE DEPLOYMENT LAYER (ADMIN ONLY)
// ==========================================
router.get('/admin/users', checkAccessRole(['ADMIN']), auditInterceptor, adminFetchUserRegistry);
router.post('/admin/users/toggle', checkAccessRole(['ADMIN']), auditInterceptor, adminToggleUserLifecycle);
router.post('/admin/create-staff', checkAccessRole(['ADMIN']), auditInterceptor, adminProvisionCorporateStaff);

// Relationship Management Mapping & Discovery Utilities
router.post('/assign-ops', checkAccessRole(['RM', 'ADMIN']), auditInterceptor, rmAssignInvestorToOps);
router.get('/rm/lookup-meta', checkAccessRole(['RM', 'ADMIN']), auditInterceptor, getRmLookupMetadata);
router.get('/rm/assignments-ledger', checkAccessRole(['RM', 'ADMIN']), auditInterceptor, getRmAssignmentsLedger);

// 🔥 ADD NEW DETACHED READ-PROXY OVER-WIRE ROUTES FOR VIEWER LAYOUT
router.get('/viewer/equity/holdings', checkAccessRole(['VIEWER']), auditInterceptor, getMyEquityHoldings);
router.get('/viewer/equity/transactions', checkAccessRole(['VIEWER']), auditInterceptor, getMyEquityTransactions);
router.get('/viewer/mf/portfolio', checkAccessRole(['VIEWER']), auditInterceptor, getMyMfPortfolio);
router.get('/viewer/mf/sips', checkAccessRole(['VIEWER']), auditInterceptor, getMyMfSips);
router.get('/viewer/mf/transactions', checkAccessRole(['VIEWER']), auditInterceptor, getMyMfTransactions);

export default router;