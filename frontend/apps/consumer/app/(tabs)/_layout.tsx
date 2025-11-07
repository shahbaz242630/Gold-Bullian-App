import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabBarIcon({ name }: { name: string }) {
  return <Text className="text-xl">{name}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="📊" />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <TabBarIcon name="💰" />,
        }}
      />
      <Tabs.Screen
        name="kyc"
        options={{
          title: 'KYC',
          tabBarIcon: ({ color }) => <TabBarIcon name="✓" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="👤" />,
        }}
      />
    </Tabs>
  );
}
