import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define both your Server URLs
const BASE_URL = 'http://localhost:5002/api/v1'; // Server 3 (Gateway)
const EQUITY_URL = 'http://localhost:5000';      // Server 1 (Equity)

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('gatewayToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gateway Registration & Login
export const AuthAPI = {
  login: (data: any) => api.post('/core/login', data),
  register: (data: any) => api.post('/core/register', data),
};

// 👉 DIRECT CALL TO SERVER 1 FOR EQUITY VAULT
export const EquityAPI = {
  register: (data: any) => axios.post(`${EQUITY_URL}/auth/register`, data),
};

export const CoreAPI = {
  getPortfolio: (userId?: string) => api.get(userId ? `/core/portfolio?userId=${userId}` : '/core/portfolio'),
  linkIdentity: (data: any) => api.post('/core/link-identity', data),
  assignOps: (data: any) => api.post('/core/assign-ops', data),
  getMyInvestors: () => api.get('/core/my-investors'),
  getPlatformUsers: () => api.get('/core/platform-users'),
  addRealEstate: (data: any) => api.post('/core/real-estate/add', data),
  
  // New Admin & RM Orchestration endpoints
  getUsers: () => api.get('/core/admin/users'),
  getRmLookupMeta: () => api.get('/core/rm/lookup-meta'),
  getRmAssignmentsLedger: () => api.get('/core/rm/assignments-ledger'),
  toggleUserStatus: (data: { targetUserId: string, isEnabled: boolean }) => api.post('/core/admin/users/toggle', data),
  createStaff: (data: any) => api.post('/core/admin/create-staff', data),
};

export const OpsAPI = {
  getDashboard: () => api.get('/ops/dashboard'),
};

export const AdminAPI = {
  getAuditLogs: () => api.get('/admin/audit-logs'),
  
  // Asset Injection (Create)
  addRealEstate: (data: any) => api.post('/admin/real-estate/add', data),
  injectEquity: (data: any) => api.post('/admin/equity/inject-asset', data),
  injectMutualFund: (data: any) => api.post('/admin/mutual-funds/inject-asset', data),
  
  // Asset Updates (Put)
  updateRealEstate: (data: any) => api.put('/admin/real-estate/update', data),
  updateEquity: (data: any) => api.put('/admin/equity/update-asset', data),
  updateMutualFund: (data: any) => api.put('/admin/mutual-funds/update-asset', data),
  
  // Asset Deletions (Delete)
  deleteRealEstate: (id: string) => api.delete(`/admin/real-estate/delete/${id}`),
  deleteEquity: (invId: string, id: string) => api.delete(`/admin/equity/delete-asset/${invId}/${id}`),
  deleteMutualFund: (mfRef: string, id: string) => api.delete(`/admin/mutual-funds/delete-asset/${mfRef}/${id}`),
  
  revalueRealEstate: (data: any) => api.post('/admin/real-estate/revalue', data),
};

export default api;