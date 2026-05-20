import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { CoreAPI, OpsAPI, AdminAPI } from '../services/api';
// 🚨 Notice the empty parentheses here! No more { route, navigation }
export default function DashboardScreen() {
  const router = useRouter(); 
  const params = useLocalSearchParams(); 
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // 🛡️ Web-Safe Profile Loader
    const loadProfileAndData = async () => {
      try {
        let activeProfile = null;

        // 1. First try to get it from the navigation parameters
        if (params.profile) {
          activeProfile = JSON.parse(params.profile as string);
        } 
        // 2. If you refreshed the web browser, params are lost! Grab from Storage instead.
        else {
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            activeProfile = JSON.parse(storedProfile);
          }
        }

        // 3. If we successfully found who is logged in, fetch their data
        if (activeProfile) {
          setProfile(activeProfile);
          await fetchDashboardData(activeProfile);
        } else {
          // If no profile exists anywhere, kick them back to the login screen
          router.replace('/');
        }
      } catch (error) {
        console.error("Profile Load Error", error);
        router.replace('/');
      }
    };

    loadProfileAndData();
  }, [params.profile]);

  const fetchDashboardData = async (userProfile: any) => {
    try {
      if (userProfile.roles.includes('ADMIN')) {
        const res = await AdminAPI.getAuditLogs();
        setData(res.data.matrixLog);
      } else if (userProfile.roles.includes('OPS')) {
        const [dashRes, invRes] = await Promise.all([OpsAPI.getDashboard(), CoreAPI.getMyInvestors()]);
        setData({ dashboard: dashRes.data.data, investors: invRes.data.data });
      } else {
        const res = await CoreAPI.getPortfolio();
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Data Fetch Error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('gatewayToken');
    await AsyncStorage.removeItem('userProfile');
    router.replace('/'); 
  };

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={{ marginTop: 10, color: '#475569' }}>Connecting to Gateway Server 3...</Text>
      </View>
    );
  }

  // ==========================================
  // 1. RENDER ADMIN VIEW
  // ==========================================
  if (profile.roles.includes('ADMIN')) {
    return (
      <ScrollView style={styles.container}>
        <Header profile={profile} onLogout={handleLogout} />
        <Text style={styles.sectionTitle}>System Audit Logs (Admin Endpoint)</Text>
        {data?.slice(0, 10).map((log: any, idx: number) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.bold}>{log.action}</Text>
            <Text>User: {log.user_email} | IP: {log.ip_address}</Text>
            <Text style={styles.subText}>{new Date(log.timestamp).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  // ==========================================
  // 2. RENDER OPS VIEW
  // ==========================================
  if (profile.roles.includes('OPS')) {
    return (
      <ScrollView style={styles.container}>
        <Header profile={profile} onLogout={handleLogout} />
        
        <Text style={styles.sectionTitle}>Ops Overview (Interrupted SIPs)</Text>
        {data?.dashboard?.interruptedSipsSummary?.rows?.map((sip: any, idx: number) => (
          <View key={idx} style={[styles.card, { borderLeftColor: '#ef4444', borderLeftWidth: 4 }]}>
            <Text style={styles.bold}>{sip.full_name} ({sip.scheme_code})</Text>
            <Text>Status: <Text style={{color: 'red', fontWeight: 'bold'}}>{sip.sip_status}</Text></Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>My Allocated Investors</Text>
        {data?.investors?.map((inv: any, idx: number) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.bold}>{inv.full_name}</Text>
            <Text>Email: {inv.email} | PAN: {inv.pan_number}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  // ==========================================
  // 3. RENDER INVESTOR VIEW (Aggregated Portfolio)
  // ==========================================
  return (
    <ScrollView style={styles.container}>
      <Header profile={profile} onLogout={handleLogout} />
      
      <Text style={styles.sectionTitle}>Equity Holdings</Text>
      {data?.slices?.equity?.holdings?.map((stock: any, idx: number) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.bold}>{stock.stock_symbol}</Text>
          <Text>Quantity: {stock.quantity} | Current Price: ₹{stock.current_market_price}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Mutual Funds</Text>
      {data?.slices?.mutualFunds?.positions?.map((mf: any, idx: number) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.bold}>{mf.scheme_name}</Text>
          <Text>Units: {mf.units} | Value: ₹{mf.current_value}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Real Estate Assets</Text>
      {data?.slices?.realEstate?.map((prop: any, idx: number) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.bold}>{prop.property_name}</Text>
          <Text>Valuation: ₹{prop.latest_valuation}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Reusable Header Component
const Header = ({ profile, onLogout }: any) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.greeting}>Welcome, {profile.name}</Text>
      <Text style={styles.roleBadge}>{profile.roles.join(', ')}</Text>
    </View>
    <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  roleBadge: { color: '#3b82f6', fontWeight: '600', marginTop: 4, fontSize: 12 },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  logoutText: { color: '#ef4444', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginHorizontal: 20, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  bold: { fontWeight: '700', fontSize: 16, color: '#1e293b', marginBottom: 4 },
  subText: { color: '#94a3b8', fontSize: 12, marginTop: 6 }
});