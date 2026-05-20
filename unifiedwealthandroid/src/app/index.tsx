import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AuthAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await AuthAPI.login({ email, password });
      await AsyncStorage.setItem('gatewayToken', res.data.token);
      await AsyncStorage.setItem('userProfile', JSON.stringify(res.data.profile));
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login Failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="pie-chart" size={40} color="#ffffff" />
          </View>
          <Text style={styles.title}>Unified Wealth</Text>
          <Text style={styles.subtitle}>Intelligence Platform</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your email" 
                placeholderTextColor="#94a3b8"
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Enter your password" 
                placeholderTextColor="#94a3b8"
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Secure Login</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLinkContainer}>
            <Text style={styles.registerLinkText}>New to the platform? <Text style={styles.registerLinkHighlight}>Create an Account</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1e293b' },
  btnPrimary: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorText: { color: '#ef4444', marginLeft: 8, fontWeight: '500', fontSize: 14 },
  registerLinkContainer: { marginTop: 24, alignItems: 'center' },
  registerLinkText: { color: '#64748b', fontSize: 14 },
  registerLinkHighlight: { color: '#3b82f6', fontWeight: '700' }
});