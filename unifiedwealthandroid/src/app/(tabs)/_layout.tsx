import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#94a3b8',
      headerStyle: { backgroundColor: '#ffffff', shadowOpacity: 0, elevation: 0 },
      headerTitleStyle: { color: '#0f172a', fontWeight: 'bold' },
      headerShadowVisible: false,
      tabBarStyle: { 
        backgroundColor: '#ffffff', 
        borderTopWidth: 1, 
        borderTopColor: '#f1f5f9',
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600'
      }
    }}>
      <Tabs.Screen 
        name="home" 
        options={{ title: 'Portfolio', tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="actions" 
        options={{ title: 'Manage', tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="admin" 
        options={{ title: 'System', tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} /> }} 
      />
    </Tabs>
  );
}