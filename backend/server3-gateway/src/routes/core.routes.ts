import { Router } from 'express';
import { 
  gatewayLogin, 
  publicRegisterUser, 
  linkFinancialIdentity, 
  rmAssignInvestorToOps, 
  getAggregatedMultiAssetPortfolio ,
  getMyAllocatedInvestors
} from '../controllers/core.controller';
import { opsOrUserAddRealEstate } from '../controllers/admin.controller';
import { verifyGatewaySession } from '../middleware/auth.middleware';
import { checkAccessRole } from '../middleware/rbac.middleware';
import { auditInterceptor } from '../middleware/interceptor.middleware';

const router = Router();

// Public Authentication Routes
router.post('/register', publicRegisterUser);
router.post('/login', gatewayLogin);

// Secure Core Workflow Layer
router.use(verifyGatewaySession);

// Self-Onboarding Financial Linking (Available to VIEWER/Investors)
router.post('/link-identity', checkAccessRole(['VIEWER', 'ADMIN', 'OPS']), auditInterceptor, linkFinancialIdentity);

// Relationship Management Assignment Controls (RM only)
router.post('/assign-ops', checkAccessRole(['RM', 'ADMIN']), auditInterceptor, rmAssignInvestorToOps);

// Multi-Asset Consolidated Visualizer (Enforces checking via checkOpsUserAuthority internal controls)
router.get('/portfolio', checkAccessRole(['VIEWER', 'RM', 'OPS', 'ADMIN']), auditInterceptor, getAggregatedMultiAssetPortfolio);
router.get('/portfolio/:panNumber', verifyGatewaySession, checkAccessRole(['ADMIN', 'RM']), auditInterceptor, getAggregatedMultiAssetPortfolio);
router.get('/my-investors', verifyGatewaySession, checkAccessRole(['OPS', 'ADMIN']), auditInterceptor, getMyAllocatedInvestors);

// Operational Asset Additions (OPS or Admin or User accounts self-submitting positions)
router.post('/real-estate/add', checkAccessRole(['ADMIN', 'OPS', 'VIEWER']), auditInterceptor, opsOrUserAddRealEstate);

export default router;