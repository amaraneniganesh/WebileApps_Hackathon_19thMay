import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthAPI, EquityAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Controls whether we are showing the Gateway form or the Equity form
  const [mode, setMode] = useState<'GATEWAY' | 'EQUITY'>('GATEWAY');

  // State mapping perfectly to backend requirements
  const [gateForm, setGateForm] = useState({ fullName: '', email: '', password: '', panNumber: '', assignedRole: 'VIEWER' });
  const [eqForm, setEqForm] = useState({ investorId: '', fullName: '', email: '', panNumber: '', dematAccount: '', password: '' });

  const handleGatewayRegister = async () => {
    setLoading(true);
    try {
      await AuthAPI.register(gateForm);
      alert('Gateway Account Created! You can now login.');
      router.back();
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Registration failed.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEquityRegister = async () => {
    setLoading(true);
    try {
      // Calls Server 1 directly using the new endpoint
      await EquityAPI.register(eqForm);
      alert('Equity Vault Created! Link this ID inside the main app dashboard.');
      setMode('GATEWAY'); // Send them back to create their gateway account
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Equity Registration failed. Ensure Server 1 is running.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the Unified Wealth Platform</Text>
          </View>

          <View style={styles.card}>
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, mode === 'GATEWAY' && styles.activeToggle]} 
                onPress={() => setMode('GATEWAY')}
              >
                <Text style={[styles.toggleText, mode === 'GATEWAY' && styles.activeToggleText]}>Gateway Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, mode === 'EQUITY' && styles.activeToggle]} 
                onPress={() => setMode('EQUITY')}
              >
                <Text style={[styles.toggleText, mode === 'EQUITY' && styles.activeToggleText]}>Equity Vault</Text>
              </TouchableOpacity>
            </View>

            {mode === 'GATEWAY' ? (
              <View style={styles.formContainer}>
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle" size={16} color="#3b82f6" />
                  <Text style={styles.infoText}>Create your master dashboard platform account.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#94a3b8" onChangeText={t => setGateForm({...gateForm, fullName: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor="#94a3b8" autoCapitalize="none" onChangeText={t => setGateForm({...gateForm, email: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#94a3b8" secureTextEntry onChangeText={t => setGateForm({...gateForm, password: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PAN Number</Text>
                  <TextInput style={styles.input} placeholder="ABCDE1234F" placeholderTextColor="#94a3b8" autoCapitalize="characters" onChangeText={t => setGateForm({...gateForm, panNumber: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Assigned Role</Text>
                  <TextInput style={styles.input} placeholder="VIEWER" placeholderTextColor="#94a3b8" defaultValue="VIEWER" onChangeText={t => setGateForm({...gateForm, assignedRole: t})} />
                </View>
                
                <TouchableOpacity style={styles.btnPrimary} onPress={handleGatewayRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register Gateway</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={[styles.infoBanner, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="lock-closed" size={16} color="#10b981" />
                  <Text style={[styles.infoText, { color: '#047857' }]}>Open an isolated stock trading vault on Server 1.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Investor ID</Text>
                  <TextInput style={styles.input} placeholder="INV1005" placeholderTextColor="#94a3b8" autoCapitalize="characters" onChangeText={t => setEqForm({...eqForm, investorId: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#94a3b8" onChangeText={t => setEqForm({...eqForm, fullName: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor="#94a3b8" autoCapitalize="none" onChangeText={t => setEqForm({...eqForm, email: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PAN Number</Text>
                  <TextInput style={styles.input} placeholder="ABCDE1234F" placeholderTextColor="#94a3b8" autoCapitalize="characters" onChangeText={t => setEqForm({...eqForm, panNumber: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Demat Account (Optional)</Text>
                  <TextInput style={styles.input} placeholder="0000000000000000" placeholderTextColor="#94a3b8" onChangeText={t => setEqForm({...eqForm, dematAccount: t})} />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vault Password</Text>
                  <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#94a3b8" secureTextEntry onChangeText={t => setEqForm({...eqForm, password: t})} />
                </View>
                
                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#10b981', shadowColor: '#10b981' }]} onPress={handleEquityRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Equity Vault</Text>}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => router.back()} style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkHighlight}>Login here</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  keyboardView: { flex: 1 },
  container: { flexGrow: 1, padding: 20, alignItems: 'center' },
  backButton: { position: 'absolute', top: 20, left: 10, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerContainer: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 5, letterSpacing: 0.5 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  toggleContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeToggle: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  toggleText: { fontWeight: '600', color: '#64748b', fontSize: 14 },
  activeToggleText: { color: '#0f172a', fontWeight: 'bold' },
  formContainer: { width: '100%' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 20 },
  infoText: { color: '#1d4ed8', fontSize: 13, marginLeft: 8, flex: 1, fontWeight: '500' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#f8fafc', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b' },
  btnPrimary: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  loginLinkContainer: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { color: '#64748b', fontSize: 14 },
  loginLinkHighlight: { color: '#3b82f6', fontWeight: '700' }
});