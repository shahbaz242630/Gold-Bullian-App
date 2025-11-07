import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/auth.store';

export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '+971', // UAE default
    password: '',
    confirmPassword: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Register via backend API
      await api.register({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        countryCode: formData.countryCode.trim(),
      });

      // After successful registration, sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/dashboard'),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView className="flex-1">
        <View className="flex-1 px-6 py-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
            <Text className="text-base text-gray-600">Join us to start investing in gold</Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">First Name</Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="John"
                  value={formData.firstName}
                  onChangeText={(val) => updateField('firstName', val)}
                  editable={!loading}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Last Name</Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChangeText={(val) => updateField('lastName', val)}
                  editable={!loading}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(val) => updateField('email', val)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
              <View className="flex-row space-x-2">
                <TextInput
                  className="w-24 px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="+971"
                  value={formData.countryCode}
                  onChangeText={(val) => updateField('countryCode', val)}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
                <TextInput
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="501234567"
                  value={formData.phoneNumber}
                  onChangeText={(val) => updateField('phoneNumber', val)}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="At least 8 characters"
                value={formData.password}
                onChangeText={(val) => updateField('password', val)}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChangeText={(val) => updateField('confirmPassword', val)}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`w-full py-4 rounded-lg mt-4 ${
                loading ? 'bg-blue-300' : 'bg-blue-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                disabled={loading}
              >
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
