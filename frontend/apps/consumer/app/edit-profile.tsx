import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.firstName || '',
    lastName: user?.user_metadata?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.user_metadata?.phoneNumber || '',
  });

  const handleSave = () => {
    Alert.alert('Coming Soon', 'Profile editing functionality will be available soon!');
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Edit Profile</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">First Name</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            value={formData.firstName}
            onChangeText={(val) => setFormData((prev) => ({ ...prev, firstName: val }))}
            editable={false}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Last Name</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            value={formData.lastName}
            onChangeText={(val) => setFormData((prev) => ({ ...prev, lastName: val }))}
            editable={false}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            value={formData.email}
            editable={false}
          />
          <Text className="text-xs text-gray-500 mt-1">Email cannot be changed</Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            value={formData.phoneNumber}
            onChangeText={(val) => setFormData((prev) => ({ ...prev, phoneNumber: val }))}
            keyboardType="phone-pad"
            editable={false}
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          className="w-full py-4 bg-gray-300 rounded-lg"
          disabled
        >
          <Text className="text-gray-600 text-center font-semibold text-lg">
            Save Changes (Coming Soon)
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-gray-500 text-center mt-4">
          Profile editing is currently disabled. Contact support to make changes to your profile.
        </Text>
      </ScrollView>
    </View>
  );
}
