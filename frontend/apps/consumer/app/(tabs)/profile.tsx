import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useAppStore } from '../../src/stores/app.store';
import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { reset: resetAppStore } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await supabase.auth.signOut();
            logout();
            resetAppStore();
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Error', 'Failed to logout');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100"
    >
      <View className="flex-row items-center flex-1">
        <Text className="text-2xl mr-4">{icon}</Text>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold">{title}</Text>
          {subtitle && <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Text className="text-gray-400 text-xl">›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-8">
        <View className="items-center">
          <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-3">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {user?.user_metadata?.firstName || 'User'} {user?.user_metadata?.lastName || ''}
          </Text>
          <Text className="text-blue-100 text-sm mt-1">{user?.email}</Text>
        </View>
      </View>

      {/* Account Section */}
      <View className="mt-6">
        <Text className="text-gray-600 text-sm font-semibold px-6 mb-2">ACCOUNT</Text>
        <View className="bg-white">
          <MenuItem
            icon="👤"
            title="Personal Information"
            subtitle="View and edit your profile"
            onPress={() => router.push('/edit-profile')}
          />
          <MenuItem
            icon="✓"
            title="KYC Verification"
            subtitle="Verify your identity"
            onPress={() => router.push('/(tabs)/kyc')}
          />
          <MenuItem
            icon="👥"
            title="Nominee Management"
            subtitle="Manage your nominee details"
            onPress={() => router.push('/nominee')}
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View className="mt-6">
        <Text className="text-gray-600 text-sm font-semibold px-6 mb-2">PREFERENCES</Text>
        <View className="bg-white">
          <MenuItem
            icon="🔔"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon!')}
          />
          <MenuItem
            icon="🔒"
            title="Security"
            subtitle="Password and 2FA settings"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon!')}
          />
          <MenuItem
            icon="🌍"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Coming Soon', 'Multi-language support coming soon!')}
          />
        </View>
      </View>

      {/* Support Section */}
      <View className="mt-6">
        <Text className="text-gray-600 text-sm font-semibold px-6 mb-2">SUPPORT</Text>
        <View className="bg-white">
          <MenuItem
            icon="❓"
            title="Help Center"
            subtitle="FAQs and support articles"
            onPress={() => Alert.alert('Coming Soon', 'Help center coming soon!')}
          />
          <MenuItem
            icon="📧"
            title="Contact Us"
            subtitle="Get in touch with support"
            onPress={() => Alert.alert('Contact Us', 'Email: support@goldapp.com')}
          />
          <MenuItem
            icon="📄"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => Alert.alert('Coming Soon', 'Legal documents coming soon!')}
          />
        </View>
      </View>

      {/* App Info */}
      <View className="mt-6 px-6">
        <Text className="text-gray-500 text-sm text-center">Version 1.0.0</Text>
      </View>

      {/* Logout Button */}
      <View className="px-6 py-8">
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loading}
          className="w-full py-4 bg-red-600 rounded-lg"
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
