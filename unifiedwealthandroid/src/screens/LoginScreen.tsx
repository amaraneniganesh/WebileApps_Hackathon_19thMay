import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // 1. IMPORT THE HOOK
import { AuthAPI } from '../services/api';

export default function LoginScreen() {
  const router = useRouter(); // 2. INITIALIZE THE ROUTER HERE

  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await AuthAPI.login({ email, password });
      if (response.data.status === 'SUCCESS') {
        await AsyncStorage.setItem('gatewayToken', response.data.token);
        await AsyncStorage.setItem('userProfile', JSON.stringify(response.data.profile));
        
        // 3. NOW ROUTER IS DEFINED AND READY TO USE!
        router.replace({
          pathname: '/dashboard',
          params: { profile: JSON.stringify(response.data.profile) }
        });
      }
    } catch (err: any) {
      console.error("THE REAL ERROR IS:", err); 
      setError(err.response?.data?.error || 'Connection failed. Ensure Server 3 is running on port 5002.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Wealth Platform</Text>
        <Text style={styles.subtitle}>Unified Multi-Asset Gateway</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email (e.g., admin@wealthplatform.com)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Secure Login</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2f5' },
  card: { width: '90%', maxWidth: 400, backgroundColor: '#fff', padding: 30, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 25, textAlign: 'center' },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#0f172a', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#ef4444', marginBottom: 15, textAlign: 'center', fontWeight: '500' }
});