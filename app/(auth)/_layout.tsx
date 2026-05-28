import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const { logout, userProfile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#16213e' },
        headerTintColor: '#fff',
        headerRight: () => (
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{userProfile?.displayName || ''}</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="#e94560" />
            </TouchableOpacity>
          </View>
        ),
        tabBarStyle: { backgroundColor: '#16213e', borderTopColor: '#0f3460', height: 60 },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="messages"
        options={{
          title: '💑 CoupleApp',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analyzer"
        options={{
          title: 'Analyse',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="song"
        options={{
          title: 'Chanson',
          tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 },
  userName: { color: '#aaa', fontSize: 13 },
  logoutBtn: { padding: 4 },
});
