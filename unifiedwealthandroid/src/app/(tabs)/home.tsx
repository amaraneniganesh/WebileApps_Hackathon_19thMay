import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { CoreAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');

  const initApp = async () => {
    const pStr = await AsyncStorage.getItem('userProfile');
    if (pStr) {
      const p = JSON.parse(pStr);
      setProfile(p);
      
      try {
        if (p.roles.includes('OPS')) {
          const res = await CoreAPI.getMyInvestors();
          setInvestors(res.data.data || []);
        } 
        else if (p.roles.includes('ADMIN') || p.roles.includes('RM')) {
          const res = await CoreAPI.getPlatformUsers();
          setInvestors(res.data.data.investors || []);
        }
      } catch (e) { console.error("Error fetching dashboard lists", e); }
      
      fetchPortfolio();
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const fetchPortfolio = (targetId?: string) => {
    setLoading(true);
    CoreAPI.getPortfolio(targetId)
      .then(res => {
        setData(res.data.data);
      })
      .catch(err => {
        const status = err.response?.status;
        if (status === 404 || status === 403) {
          setData({ slices: { equity: { holdings: [] }, mutualFunds: { positions: [] }, realEstate: [] } });
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio(selectedClient);
  };

  const handleClientSwitch = (uuid: string) => {
    setSelectedClient(uuid);
    if (uuid) fetchPortfolio(uuid);
    else fetchPortfolio(); 
  };

  if (loading && !data) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
  );

  const equityTotal = data?.slices?.equity?.holdings?.reduce((acc: number, curr: any) => acc + (curr.quantity * curr.current_market_price), 0) || 0;
  const mfTotal = data?.slices?.mutualFunds?.positions?.reduce((acc: number, curr: any) => acc + Number(curr.current_value), 0) || 0;
  const reTotal = data?.slices?.realEstate?.reduce((acc: number, curr: any) => acc + Number(curr.latest_valuation), 0) || 0;
  const netWorth = equityTotal + mfTotal + reTotal;

  const chartData = [
    { name: 'Equity', value: equityTotal, color: '#3b82f6', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Mutual Funds', value: mfTotal, color: '#10b981', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Real Estate', value: reTotal, color: '#f59e0b', legendFontColor: '#475569', legendFontSize: 12 },
  ].filter(d => d.value > 0);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
    >
      <View style={styles.profileHeader}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.name}</Text>
          <View style={styles.roleContainer}>
            {profile?.roles?.map((role: string, idx: number) => (
              <View key={idx} style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{role}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Ionicons name="person" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Multi-Tenant Dashboard Selector */}
      {(profile?.roles.includes('OPS') || profile?.roles.includes('ADMIN') || profile?.roles.includes('RM')) && (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Viewing Portfolio For</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selectedClient} onValueChange={handleClientSwitch} style={styles.picker} dropdownIconColor="#3b82f6">
              <Picker.Item label="-- My Personal Portfolio --" value="" />
              {investors.map((inv, idx) => (
                <Picker.Item key={idx} label={`${inv.full_name} ${inv.pan_number ? `(${inv.pan_number})` : ''}`} value={inv.user_id} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {chartData.length > 0 ? (
        <>
          <View style={styles.netWorthCard}>
            <View style={styles.netWorthHeader}>
              <Ionicons name="wallet-outline" size={20} color="#94a3b8" />
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
            </View>
            <Text style={styles.netWorthValue}>₹{netWorth.toLocaleString('en-IN')}</Text>
            <View style={styles.netWorthTrend}>
              <Ionicons name="trending-up" size={16} color="#10b981" />
              <Text style={styles.netWorthTrendText}>Updated Just Now</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Asset Allocation</Text>
            <PieChart
              data={chartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={{ color: () => `rgba(0, 0, 0, 1)` }}
              accessor={"value"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              center={[10, 0]}
              absolute
            />
          </View>

          <Text style={styles.sectionTitleMain}>Detailed Holdings</Text>
          
          <View style={styles.assetCard}>
            <View style={[styles.assetHeader, { borderLeftColor: '#3b82f6' }]}>
              <View style={styles.assetTitleRow}>
                <Ionicons name="business" size={18} color="#3b82f6" style={styles.assetIcon} />
                <Text style={styles.assetHeaderText}>Equities</Text>
              </View>
              <Text style={styles.assetTotal}>₹{equityTotal.toLocaleString('en-IN')}</Text>
            </View>
            {data.slices.equity.holdings.length > 0 ? data.slices.equity.holdings.map((h: any, i: number) => (
              <View key={i} style={styles.holdingRow}>
                <Text style={styles.holdingSymbol}>{h.stock_symbol}</Text>
                <View style={styles.holdingDetails}>
                  <Text style={styles.holdingUnits}>{h.quantity} units</Text>
                  <Text style={styles.holdingPrice}>₹{h.current_market_price}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyRow}>No equity holdings found.</Text>}
          </View>

          <View style={styles.assetCard}>
            <View style={[styles.assetHeader, { borderLeftColor: '#10b981' }]}>
              <View style={styles.assetTitleRow}>
                <Ionicons name="pie-chart" size={18} color="#10b981" style={styles.assetIcon} />
                <Text style={styles.assetHeaderText}>Mutual Funds</Text>
              </View>
              <Text style={styles.assetTotal}>₹{mfTotal.toLocaleString('en-IN')}</Text>
            </View>
            {data.slices.mutualFunds.positions.length > 0 ? data.slices.mutualFunds.positions.map((m: any, i: number) => (
              <View key={i} style={styles.holdingRow}>
                <Text style={styles.holdingSymbol}>{m.scheme_name}</Text>
                <Text style={styles.holdingPrice}>₹{m.current_value}</Text>
              </View>
            )) : <Text style={styles.emptyRow}>No mutual fund positions found.</Text>}
          </View>
          
          <View style={styles.assetCard}>
            <View style={[styles.assetHeader, { borderLeftColor: '#f59e0b' }]}>
              <View style={styles.assetTitleRow}>
                <Ionicons name="home" size={18} color="#f59e0b" style={styles.assetIcon} />
                <Text style={styles.assetHeaderText}>Real Estate</Text>
              </View>
              <Text style={styles.assetTotal}>₹{reTotal.toLocaleString('en-IN')}</Text>
            </View>
            {data.slices.realEstate.length > 0 ? data.slices.realEstate.map((r: any, i: number) => (
              <View key={i} style={styles.holdingRow}>
                <Text style={styles.holdingSymbol}>{r.property_name}</Text>
                <Text style={styles.holdingPrice}>₹{r.latest_valuation}</Text>
              </View>
            )) : <Text style={styles.emptyRow}>No real estate properties found.</Text>}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Asset Data</Text>
          <Text style={styles.emptyStateText}>
            Select a client from the dropdown or link accounts in the Manage tab to see portfolio insights.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  roleContainer: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 6 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  roleBadgeText: { color: '#1d4ed8', fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  pickerContainer: { marginBottom: 24 },
  pickerLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerWrapper: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  picker: { height: 50, width: '100%' },
  netWorthCard: { backgroundColor: '#0f172a', padding: 24, borderRadius: 20, marginBottom: 24, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  netWorthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  netWorthLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  netWorthValue: { color: '#ffffff', fontSize: 36, fontWeight: '800', letterSpacing: 0.5 },
  netWorthTrend: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  netWorthTrendText: { color: '#10b981', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  chartContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  sectionTitleMain: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 16, marginTop: 8 },
  assetCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  assetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderLeftWidth: 4 },
  assetTitleRow: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: { marginRight: 8 },
  assetHeaderText: { fontWeight: '700', fontSize: 16, color: '#1e293b' },
  assetTotal: { fontWeight: '800', fontSize: 16, color: '#0f172a' },
  holdingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  holdingSymbol: { fontSize: 15, fontWeight: '600', color: '#334155', flex: 1 },
  holdingDetails: { alignItems: 'flex-end' },
  holdingUnits: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  holdingPrice: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  emptyRow: { padding: 16, fontStyle: 'italic', color: '#94a3b8', fontSize: 14 },
  emptyState: { backgroundColor: '#ffffff', padding: 40, borderRadius: 24, marginTop: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  emptyStateTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 16, marginBottom: 8 },
  emptyStateText: { textAlign: 'center', color: '#64748b', fontSize: 14, lineHeight: 22 }
});