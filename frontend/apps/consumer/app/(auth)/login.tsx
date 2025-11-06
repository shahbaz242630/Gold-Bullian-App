import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/auth.store';

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-base text-gray-600">Sign in to your account</Text>
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

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            disabled={loading}
          >
            <Text className="text-sm text-blue-600 text-right">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-lg ${
              loading ? 'bg-blue-300' : 'bg-blue-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={loading}
            >
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
