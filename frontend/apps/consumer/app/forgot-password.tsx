import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: 'goldapp://reset-password',
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 bg-white justify-center px-6">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Check Your Email
          </Text>
          <Text className="text-base text-gray-600 text-center">
            We've sent password reset instructions to {email}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="w-full py-4 bg-blue-600 rounded-lg"
        >
          <Text className="text-white text-center font-semibold text-base">
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Reset Password</Text>
        <Text className="text-base text-gray-600">
          Enter your email and we'll send you instructions to reset your password
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading}
          className={`w-full py-4 rounded-lg ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Send Reset Link
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
          className="mt-4"
        >
          <Text className="text-blue-600 text-center font-semibold">Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
