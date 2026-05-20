import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { CoreAPI, AdminAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'rm-mapping' | 'provision' | 'system-logs'>('audit');

  // Audit Tab
  const [users, setUsers] = useState<any[]>([]);
  
  // System Logs Tab
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // RM Mapping Tab
  const [investorsList, setInvestorsList] = useState<any[]>([]);
  const [opsStaffList, setOpsStaffList] = useState<any[]>([]);
  const [assignmentsLedger, setAssignmentsLedger] = useState<any[]>([]);
  const [opsUserId, setOpsUserId] = useState('');
  const [investorUserId, setInvestorUserId] = useState('');

  // Provision Tab
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [role, setRole] = useState('OPS');

  const initData = async () => {
    const pStr = await AsyncStorage.getItem('userProfile');
    if (!pStr) return;
    const p = JSON.parse(pStr);
    setProfile(p);
    await pullRegistryLogs();
    await loadRmOrchestrationData();
    await pullSystemAuditTrail();
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { initData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    initData();
  };

  const pullRegistryLogs = async () => {
    try {
      const res = await CoreAPI.getUsers();
      if (res.data.status === 'SUCCESS') setUsers(res.data.data || []);
    } catch (err) { console.error('Registry Error:', err); }
  };

  const pullSystemAuditTrail = async () => {
    try {
      const res = await AdminAPI.getAuditLogs();
      if (res.data.status === 'SUCCESS') setAuditLogs(res.data.matrixLog || res.data.data || []);
    } catch (err) { console.error('Audit Error:', err); }
  };

  const loadRmOrchestrationData = async () => {
    try {
      const metaRes = await CoreAPI.getRmLookupMeta();
      if (metaRes.data.status === 'SUCCESS') {
        setInvestorsList(metaRes.data.data.investors || []);
        setOpsStaffList(metaRes.data.data.opsStaff || []);
      }
      const ledgerRes = await CoreAPI.getRmAssignmentsLedger();
      if (ledgerRes.data.status === 'SUCCESS') setAssignmentsLedger(ledgerRes.data.data || []);
    } catch (err) { console.error('RM Orchestration Error:', err); }
  };

  const handleToggleState = async (uid: string, currentStatus: boolean) => {
    try {
      await CoreAPI.toggleUserStatus({ targetUserId: uid, isEnabled: !currentStatus });
      Alert.alert('Success', 'User state toggled successfully');
      pullRegistryLogs();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Failed to toggle status'); }
  };

  const executeDelegationMapSubmit = async () => {
    if (!opsUserId || !investorUserId) return Alert.alert('Warning', 'Select both an Ops Engineer and an Investor.');
    setLoading(true);
    try {
      await CoreAPI.assignOps({ opsUserId, investorUserId });
      Alert.alert('Success', 'Investor assigned successfully');
      setOpsUserId(''); setInvestorUserId('');
      loadRmOrchestrationData();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Failed to assign'); }
    finally { setLoading(false); }
  };

  const handleStaffCreateSubmit = async () => {
    setLoading(true);
    try {
      await CoreAPI.createStaff({ fullName: name.trim(), email: email.trim().toLowerCase(), password: pass, assignedRole: role });
      Alert.alert('Success', `${role} created successfully.`);
      setName(''); setEmail(''); setPass('');
      pullRegistryLogs();
      loadRmOrchestrationData();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Provisioning failed'); }
    finally { setLoading(false); }
  };

  if (loading && !profile) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  
  if (profile && !profile.roles.includes('ADMIN')) {
    return <View style={styles.center}><Text style={styles.alertText}>Access Denied. Admins Only.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Infrastructure Core Registry</Text>
          <Text style={styles.pageSubtitle}>System-wide master orchestration</Text>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {(['audit', 'rm-mapping', 'provision', 'system-logs'] as const).map(t => (
              <TouchableOpacity key={t} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]} onPress={() => setActiveTab(t)}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t === 'audit' ? 'User Audit Ledger' : t === 'rm-mapping' ? 'RM Assignments' : t === 'provision' ? 'Create Staff' : 'Audit Logs'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          
          {/* TAB 1: User Audit Ledger */}
          {activeTab === 'audit' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={20} color="#3b82f6" />
                <Text style={styles.cardTitle}>User Intercept Registry</Text>
              </View>
              {users.map((u, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={styles.listCol}>
                    <Text style={styles.listTitle}>{u.full_name}</Text>
                    <Text style={styles.listSubtitle}>{u.email}</Text>
                    <Text style={styles.listMeta}>{u.assigned_role || 'VIEWER'}</Text>
                  </View>
                  <View style={styles.listActionCol}>
                    <TouchableOpacity style={[styles.toggleBtn, u.is_active ? styles.toggleActive : styles.toggleInactive]} onPress={() => handleToggleState(u.user_id, u.is_active)}>
                      <Text style={[styles.toggleText, u.is_active ? styles.toggleTextActive : styles.toggleTextInactive]}>{u.is_active ? 'Active' : 'Disabled'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: RM Assignments */}
          {activeTab === 'rm-mapping' && (
            <View style={styles.spaceY}>
              <View style={[styles.card, { borderColor: '#3b82f6', borderWidth: 1 }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="git-network" size={20} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Mutate Management Vector</Text>
                </View>
                <Text style={styles.label}>1. Select Target Investor</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={investorUserId} onValueChange={setInvestorUserId} style={styles.picker}>
                    <Picker.Item label="-- Choose Active Investor --" value="" />
                    {investorsList.map(inv => <Picker.Item key={inv.user_id} label={`${inv.full_name} (${inv.pan_number || 'No PAN'})`} value={inv.user_id} />)}
                  </Picker>
                </View>

                <Text style={styles.label}>2. Select Servicing Node</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={opsUserId} onValueChange={setOpsUserId} style={styles.picker}>
                    <Picker.Item label="-- Choose Operational Engineer --" value="" />
                    {opsStaffList.map(ops => <Picker.Item key={ops.user_id} label={`${ops.full_name} (${ops.email})`} value={ops.user_id} />)}
                  </Picker>
                </View>

                <TouchableOpacity style={styles.btnPrimary} onPress={executeDelegationMapSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Bind Operational Map</Text>}
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="link" size={20} color="#10b981" />
                  <Text style={styles.cardTitle}>Live Relationship Ledger</Text>
                </View>
                {assignmentsLedger.length === 0 ? <Text style={styles.emptyText}>Zero assignments found.</Text> : assignmentsLedger.map((row, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.listCol}>
                      <Text style={styles.listTitle}>{row.investor_name}</Text>
                      <Text style={styles.listSubtitle}>Client: {row.investor_email}</Text>
                    </View>
                    <View style={styles.listCol}>
                      {row.ops_name ? (
                        <>
                          <Text style={styles.listTitle}>{row.ops_name}</Text>
                          <Text style={styles.listSubtitle}>Agent: {row.ops_email}</Text>
                        </>
                      ) : (
                        <Text style={styles.errorText}>UNASSIGNED</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => { setInvestorUserId(row.investor_user_id); setOpsUserId(row.ops_user_id || ''); }}>
                      <Text style={styles.btnOutlineText}>Reassign</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: Provision Staff */}
          {activeTab === 'provision' && (
            <View style={[styles.card, { borderColor: '#8b5cf6', borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-add" size={20} color="#8b5cf6" />
                <Text style={styles.cardTitle}>Deploy Operator Staff Node</Text>
              </View>
              <TextInput style={styles.input} placeholder="Staff Full Name" placeholderTextColor="#64748b" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Corporate Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Workspace Password" placeholderTextColor="#64748b" value={pass} onChangeText={setPass} secureTextEntry />
              
              <Text style={styles.label}>Workgroup Role</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.roleBtn, role === 'OPS' && styles.roleBtnActive]} onPress={() => setRole('OPS')}>
                  <Text style={[styles.roleBtnText, role === 'OPS' && styles.roleBtnTextActive]}>Operations Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleBtn, role === 'RM' && styles.roleBtnActive]} onPress={() => setRole('RM')}>
                  <Text style={[styles.roleBtnText, role === 'RM' && styles.roleBtnTextActive]}>Relationship Mgr</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#8b5cf6'}]} onPress={handleStaffCreateSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Provision Corporate Node</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 4: System Logs */}
          {activeTab === 'system-logs' && (
            <View style={styles.terminalCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="terminal" size={20} color="#f59e0b" />
                <Text style={[styles.cardTitle, { color: '#fff' }]}>Global Firewall Intercepts</Text>
              </View>
              {auditLogs.length === 0 ? <Text style={styles.emptyTextTerminal}>No logs recorded.</Text> : auditLogs.map((log, index) => (
                <View key={index} style={styles.terminalLog}>
                  <Text style={styles.terminalPath}><Text style={[styles.methodBadge, log.http_method === 'POST' ? styles.methodPost : log.http_method === 'PUT' ? styles.methodPut : styles.methodOther]}>{log.http_method}</Text> {log.request_path}</Text>
                  <Text style={styles.terminalDetail}>User: {log.user_email || 'Unknown'} | IP: {log.ip_address}</Text>
                  <Text style={log.status_code < 400 ? styles.terminalStatusOk : styles.terminalStatusErr}>STATUS: {log.status_code} ({log.execution_ms}ms)</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 30, backgroundColor: '#0f172a' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  pageSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  tabsContainer: { backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  tabsScroll: { paddingHorizontal: 15, paddingBottom: 10 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#1e293b' },
  tabBtnActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#ffffff' },
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 15, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  alertText: { color: '#ef4444', fontWeight: 'bold' },
  spaceY: { gap: 15 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginLeft: 8 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  listCol: { flex: 1 },
  listActionCol: { marginLeft: 10 },
  listTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
  listSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  listMeta: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  toggleActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' },
  toggleInactive: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' },
  toggleText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  toggleTextActive: { color: '#10b981' },
  toggleTextInactive: { color: '#ef4444' },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  pickerWrapper: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, overflow: 'hidden', marginBottom: 15 },
  picker: { height: 50, width: '100%', color: '#f8fafc' },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', borderWidth: 1, borderColor: '#334155', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', alignItems: 'center', backgroundColor: '#0f172a' },
  roleBtnActive: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  roleBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  roleBtnTextActive: { color: '#8b5cf6' },
  btnPrimary: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  btnOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center' },
  btnOutlineText: { color: '#3b82f6', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  errorText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  terminalCard: { backgroundColor: '#020617', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  terminalLog: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  terminalPath: { color: '#f8fafc', fontWeight: 'bold', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
  terminalDetail: { color: '#64748b', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  terminalStatusOk: { color: '#10b981', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  terminalStatusErr: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  methodBadge: { fontSize: 9, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  methodPost: { backgroundColor: '#064e3b', color: '#34d399' },
  methodPut: { backgroundColor: '#1e3a8a', color: '#60a5fa' },
  methodOther: { backgroundColor: '#7f1d1d', color: '#f87171' },
  emptyText: { color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  emptyTextTerminal: { color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', padding: 20 }
});