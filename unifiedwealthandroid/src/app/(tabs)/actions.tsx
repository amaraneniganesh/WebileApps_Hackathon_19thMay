import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoreAPI, AdminAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ActionsScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [allocatedInvestors, setAllocatedInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);

  // Tabs
  const [activeFormTab, setActiveFormTab] = useState<'property' | 'equity' | 'fund'>('property');

  // Form States - Property
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Form States - Equity
  const [stockSymbol, setStockSymbol] = useState('');
  const [equityQty, setEquityQty] = useState('');
  const [equityBuyPrice, setEquityBuyPrice] = useState('');
  const [exchange, setExchange] = useState('NSE');

  // Form States - Mutual Funds
  const [schemeCode, setSchemeCode] = useState('');
  const [mfUnits, setMfUnits] = useState('');
  const [mfAmount, setMfAmount] = useState('');

  const initData = async () => {
    const pStr = await AsyncStorage.getItem('userProfile');
    if (!pStr) return;
    const p = JSON.parse(pStr);
    setProfile(p);
    await pullMyAllocatedInvestorsList(p);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { initData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    initData();
  };

  const pullMyAllocatedInvestorsList = async (p: any) => {
    try {
      let res;
      if (p.roles.includes('ADMIN')) {
        res = await CoreAPI.getUsers();
      } else {
        res = await CoreAPI.getMyInvestors();
      }
      if (res.data.status === 'SUCCESS') setAllocatedInvestors(res.data.data || []);
    } catch (err: any) { console.error('Roster error', err); }
  };

  const inspectTargetClientPortfolio = async (client: any) => {
    setSelectedClient(client);
    setLoading(true);
    try {
      const res = await CoreAPI.getPortfolio(client.user_id);
      setPortfolioData(res.data.data);
    } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Failed to fetch portfolio'); }
    finally { setLoading(false); }
  };

  const handleAssetSubmission = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      if (activeFormTab === 'property') {
        await AdminAPI.addRealEstate({ panNumber: selectedClient.pan_number, targetUserId: selectedClient.user_id, propertyName, address, purchasePrice: parseFloat(purchasePrice), purchaseDate: new Date().toISOString().split('T')[0] });
      } else if (activeFormTab === 'equity') {
        await AdminAPI.injectEquity({ investorId: selectedClient.equity_id || selectedClient.user_id, stockSymbol: stockSymbol.trim().toUpperCase(), quantity: parseFloat(equityQty), avgBuyPrice: parseFloat(equityBuyPrice), exchange });
      } else {
        await AdminAPI.injectMutualFund({ customerRef: selectedClient.mf_ref || selectedClient.user_id, schemeCode: schemeCode.trim().toUpperCase(), units: parseFloat(mfUnits), investedAmount: parseFloat(mfAmount) });
      }

      Alert.alert('Success', 'Asset injected successfully.');
      setPropertyName(''); setPurchasePrice(''); setAddress('');
      setStockSymbol(''); setEquityQty(''); setEquityBuyPrice('');
      setSchemeCode(''); setMfUnits(''); setMfAmount('');
      
      inspectTargetClientPortfolio(selectedClient);
    } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Asset deployment failed'); }
    finally { setLoading(false); }
  };

  const executeAssetPurgeRow = async (assetType: 'RE' | 'STK' | 'MF', targetId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to permanently delete this asset?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          if (assetType === 'RE') await AdminAPI.deleteRealEstate(targetId);
          else if (assetType === 'STK') await AdminAPI.deleteEquity(selectedClient.equity_id, targetId);
          else await AdminAPI.deleteMutualFund(selectedClient.mf_ref, targetId);
          
          Alert.alert('Success', 'Asset deleted.');
          inspectTargetClientPortfolio(selectedClient);
        } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Failed to delete'); }
        finally { setLoading(false); }
      }}
    ]);
  };

  if (loading && !profile) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (profile && (!profile.roles.includes('OPS') && !profile.roles.includes('RM') && !profile.roles.includes('ADMIN'))) {
    return <View style={styles.center}><Text style={styles.errorText}>Access Denied. Ops/RM Only.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Operational Servicing</Text>
          <Text style={styles.pageSubtitle}>Full CRUD lifecycle over proxy microservice allocation logs.</Text>
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {/* Allocated Clients Roster */}
          <View style={[styles.card, { borderColor: '#334155', borderWidth: 1 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color="#60a5fa" />
              <Text style={styles.cardTitle}>Allocated Client Base Matrix</Text>
            </View>
            <View style={styles.clientList}>
              {allocatedInvestors.length === 0 ? <Text style={styles.emptyText}>No clients assigned.</Text> : allocatedInvestors.map((client, idx) => (
                <View key={client.user_id || idx} style={[styles.clientItem, selectedClient?.user_id === client.user_id && styles.clientItemActive]}>
                  <View style={styles.flex}>
                    <Text style={styles.clientName}>{client.full_name}</Text>
                    <Text style={styles.clientPan}>PAN: {client.pan_number || 'UNSET'}</Text>
                  </View>
                  <TouchableOpacity style={styles.auditBtn} onPress={() => inspectTargetClientPortfolio(client)}>
                    <Text style={styles.auditBtnText}>Audit</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Asset Staging Area */}
          {selectedClient && (
            <View style={[styles.card, { borderColor: '#8b5cf6', borderWidth: 1, marginTop: 15 }]}>
              <View style={styles.gradientBar} />
              <View style={styles.cardHeaderSpaced}>
                <Text style={styles.cardTitle}>Log Asset Context</Text>
              </View>

              <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabBtn, activeFormTab === 'property' && styles.tabBtnProp]} onPress={() => setActiveFormTab('property')}>
                  <Ionicons name="business" size={14} color={activeFormTab === 'property' ? '#fff' : '#94a3b8'} style={{marginRight: 4}} />
                  <Text style={[styles.tabText, activeFormTab === 'property' && styles.tabTextActive]}>Property</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeFormTab === 'equity' && styles.tabBtnEq]} onPress={() => setActiveFormTab('equity')}>
                  <Ionicons name="trending-up" size={14} color={activeFormTab === 'equity' ? '#fff' : '#94a3b8'} style={{marginRight: 4}} />
                  <Text style={[styles.tabText, activeFormTab === 'equity' && styles.tabTextActive]}>Stocks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeFormTab === 'fund' && styles.tabBtnMf]} onPress={() => setActiveFormTab('fund')}>
                  <Ionicons name="wallet" size={14} color={activeFormTab === 'fund' ? '#fff' : '#94a3b8'} style={{marginRight: 4}} />
                  <Text style={[styles.tabText, activeFormTab === 'fund' && styles.tabTextActive]}>Funds</Text>
                </TouchableOpacity>
              </View>

              {activeFormTab === 'property' && (
                <View style={styles.formGroup}>
                  <TextInput style={styles.input} placeholder="Asset Identifier Name" placeholderTextColor="#64748b" value={propertyName} onChangeText={setPropertyName} />
                  <TextInput style={styles.input} placeholder="Address Site Location" placeholderTextColor="#64748b" value={address} onChangeText={setAddress} />
                  <TextInput style={styles.input} placeholder="Purchase Price (INR)" placeholderTextColor="#64748b" keyboardType="numeric" value={purchasePrice} onChangeText={setPurchasePrice} />
                  <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#d97706'}]} onPress={handleAssetSubmission} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log Real Estate Asset</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {activeFormTab === 'equity' && (
                <View style={styles.formGroup}>
                  <TextInput style={styles.input} placeholder="Stock Symbol (e.g. INF)" placeholderTextColor="#64748b" value={stockSymbol} onChangeText={setStockSymbol} autoCapitalize="characters" />
                  <TextInput style={styles.input} placeholder="Volume Quantity" placeholderTextColor="#64748b" keyboardType="numeric" value={equityQty} onChangeText={setEquityQty} />
                  <TextInput style={styles.input} placeholder="Avg Execution Price" placeholderTextColor="#64748b" keyboardType="numeric" value={equityBuyPrice} onChangeText={setEquityBuyPrice} />
                  <View style={styles.row}>
                    {['NSE', 'BSE'].map(ex => (
                      <TouchableOpacity key={ex} style={[styles.exchangeBtn, exchange === ex && styles.exchangeBtnActive]} onPress={() => setExchange(ex)}>
                        <Text style={[styles.exchangeBtnText, exchange === ex && styles.exchangeBtnTextActive]}>{ex}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#2563eb'}]} onPress={handleAssetSubmission} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Push Equity (Server 1)</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {activeFormTab === 'fund' && (
                <View style={styles.formGroup}>
                  <TextInput style={styles.input} placeholder="Scheme Code Index" placeholderTextColor="#64748b" value={schemeCode} onChangeText={setSchemeCode} autoCapitalize="characters" />
                  <TextInput style={styles.input} placeholder="Allotted Units" placeholderTextColor="#64748b" keyboardType="numeric" value={mfUnits} onChangeText={setMfUnits} />
                  <TextInput style={styles.input} placeholder="Lump-Sum Value" placeholderTextColor="#64748b" keyboardType="numeric" value={mfAmount} onChangeText={setMfAmount} />
                  <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#9333ea'}]} onPress={handleAssetSubmission} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Push Fund (Server 2)</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {portfolioData?.slices && (
                <View style={styles.portfolioSection}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="layers" size={18} color="#3b82f6" />
                    <Text style={styles.portfolioTitle}>Current Distributed Balances Roster</Text>
                  </View>
                  
                  {/* Real Estate List */}
                  {portfolioData.slices.realEstate?.map((asset: any) => (
                    <View key={asset.property_id} style={styles.assetItem}>
                      <View style={styles.flex}>
                        <Text style={styles.assetName}>{asset.property_name}</Text>
                        <Text style={styles.assetMeta}>Valuation: ₹{asset.latest_valuation}</Text>
                      </View>
                      <TouchableOpacity onPress={() => executeAssetPurgeRow('RE', asset.property_id)} style={styles.delBtn}>
                        <Ionicons name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Equity List */}
                  {portfolioData.slices.equity?.holdings?.map((asset: any) => (
                    <View key={asset.id} style={styles.assetItem}>
                      <View style={styles.flex}>
                        <Text style={styles.assetName}>{asset.stock_symbol}</Text>
                        <Text style={styles.assetMeta}>{asset.quantity} Qty • ₹{asset.current_market_price}</Text>
                      </View>
                      <TouchableOpacity onPress={() => executeAssetPurgeRow('STK', asset.id)} style={styles.delBtn}>
                        <Ionicons name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Mutual Fund List */}
                  {portfolioData.slices.mutualFunds?.positions?.map((asset: any) => (
                    <View key={asset.id} style={styles.assetItem}>
                      <View style={styles.flex}>
                        <Text style={styles.assetName}>{asset.scheme_name || asset.scheme_code}</Text>
                        <Text style={styles.assetMeta}>{asset.units} Units • ₹{asset.current_value}</Text>
                      </View>
                      <TouchableOpacity onPress={() => executeAssetPurgeRow('MF', asset.id)} style={styles.delBtn}>
                        <Ionicons name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}

                </View>
              )}
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 15, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  errorText: { color: '#ef4444', fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardHeaderSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginLeft: 8 },
  gradientBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#8b5cf6' },
  clientList: { maxHeight: 300 },
  clientItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#334155', borderRadius: 12, backgroundColor: '#0f172a', marginBottom: 8 },
  clientItemActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' },
  clientName: { color: '#f8fafc', fontWeight: 'bold', fontSize: 13 },
  clientPan: { color: '#64748b', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 4 },
  auditBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  auditBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyText: { color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: 10, fontSize: 12 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#334155', marginBottom: 15 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  tabBtnProp: { backgroundColor: '#d97706' },
  tabBtnEq: { backgroundColor: '#2563eb' },
  tabBtnMf: { backgroundColor: '#9333ea' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  formGroup: { marginBottom: 10 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', borderWidth: 1, borderColor: '#334155', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  exchangeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center', backgroundColor: '#0f172a' },
  exchangeBtnActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  exchangeBtnText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  exchangeBtnTextActive: { color: '#3b82f6' },
  btnPrimary: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  portfolioSection: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#334155' },
  portfolioTitle: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', marginLeft: 8 },
  assetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  assetName: { color: '#f8fafc', fontWeight: 'bold', fontSize: 13 },
  assetMeta: { color: '#64748b', fontSize: 11, marginTop: 2 },
  delBtn: { padding: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }
});