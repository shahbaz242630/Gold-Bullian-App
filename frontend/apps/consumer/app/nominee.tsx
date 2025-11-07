import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { api } from '../src/lib/api';

interface Nominee {
  id: string;
  fullName: string;
  relationship: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
}

export default function NomineeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nominee, setNominee] = useState<Nominee | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    relationship: '',
    email: '',
    phoneNumber: '',
    countryCode: '+971',
  });

  const fetchNominee = async () => {
    if (!user?.id) return;

    try {
      const data = await api.getNominee(user.id);
      setNominee(data);
      setFormData({
        fullName: data.fullName,
        relationship: data.relationship,
        email: data.email,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
      });
    } catch (error: any) {
      // Nominee might not exist yet
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominee();
  }, [user?.id]);

  const handleSave = async () => {
    if (
      !formData.fullName ||
      !formData.relationship ||
      !formData.email ||
      !formData.phoneNumber
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) return;

    setSubmitting(true);
    try {
      await api.updateNominee({
        userId: user.id,
        ...formData,
      });

      Alert.alert('Success', 'Nominee information saved successfully!');
      setEditing(false);
      fetchNominee();
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Failed to save nominee information');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Nominee Management</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Info Banner */}
        {!nominee && (
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <Text className="text-blue-900 font-semibold mb-2">What is a nominee?</Text>
            <Text className="text-blue-800 text-sm">
              A nominee is the person who will receive your gold holdings in the event of your
              passing. It's important to keep this information up to date.
            </Text>
          </View>
        )}

        {/* Display Mode */}
        {!editing && nominee && (
          <View className="bg-white">
            <View className="bg-gray-50 rounded-lg p-4 mb-6">
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Full Name</Text>
                <Text className="text-lg font-semibold text-gray-900">{nominee.fullName}</Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Relationship</Text>
                <Text className="text-lg font-semibold text-gray-900">{nominee.relationship}</Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Email</Text>
                <Text className="text-lg font-semibold text-gray-900">{nominee.email}</Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-1">Phone Number</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {nominee.countryCode} {nominee.phoneNumber}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setEditing(true)}
              className="w-full py-4 bg-blue-600 rounded-lg"
            >
              <Text className="text-white text-center font-semibold text-lg">Edit Nominee</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Mode */}
        {editing && (
          <View>
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Full Name *</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Enter nominee's full name"
                value={formData.fullName}
                onChangeText={(val) => setFormData((prev) => ({ ...prev, fullName: val }))}
                editable={!submitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Relationship *</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="e.g., Spouse, Child, Parent, Sibling"
                value={formData.relationship}
                onChangeText={(val) => setFormData((prev) => ({ ...prev, relationship: val }))}
                editable={!submitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email *</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="nominee@email.com"
                value={formData.email}
                onChangeText={(val) => setFormData((prev) => ({ ...prev, email: val }))}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number *</Text>
              <View className="flex-row space-x-2">
                <TextInput
                  className="w-24 px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="+971"
                  value={formData.countryCode}
                  onChangeText={(val) => setFormData((prev) => ({ ...prev, countryCode: val }))}
                  keyboardType="phone-pad"
                  editable={!submitting}
                />
                <TextInput
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="501234567"
                  value={formData.phoneNumber}
                  onChangeText={(val) => setFormData((prev) => ({ ...prev, phoneNumber: val }))}
                  keyboardType="phone-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              className={`w-full py-4 rounded-lg mb-3 ${
                submitting ? 'bg-blue-300' : 'bg-blue-600'
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Save Nominee
                </Text>
              )}
            </TouchableOpacity>

            {nominee && (
              <TouchableOpacity
                onPress={() => {
                  setEditing(false);
                  setFormData({
                    fullName: nominee.fullName,
                    relationship: nominee.relationship,
                    email: nominee.email,
                    phoneNumber: nominee.phoneNumber,
                    countryCode: nominee.countryCode,
                  });
                }}
                disabled={submitting}
                className="w-full py-4 border border-gray-300 rounded-lg"
              >
                <Text className="text-gray-700 text-center font-semibold text-lg">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text className="text-xs text-gray-500 text-center mt-6">
          Your nominee information is kept secure and confidential. It will only be used in
          accordance with our terms of service.
        </Text>
      </ScrollView>
    </View>
  );
}
