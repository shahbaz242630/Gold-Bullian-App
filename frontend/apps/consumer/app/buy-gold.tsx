import React, { useState, useEffect } from 'react';
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
import { useAppStore } from '../src/stores/app.store';
import { api } from '../src/lib/api';

export default function BuyGoldScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentPrice } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'amount' | 'grams'>('amount');
  const [amount, setAmount] = useState('');

  const calculatedGrams =
    mode === 'amount' && amount && currentPrice
      ? (parseFloat(amount) / currentPrice.buyPrice).toFixed(3)
      : '0.000';

  const calculatedAmount =
    mode === 'grams' && amount && currentPrice
      ? (parseFloat(amount) * currentPrice.buyPrice).toFixed(2)
      : '0.00';

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { userId: user.id };

      if (mode === 'amount') {
        payload.fiatAmount = parseFloat(amount);
        payload.fiatCurrency = 'AED';
      } else {
        payload.goldGrams = parseFloat(amount);
      }

      await api.buyGold(payload);

      Alert.alert('Success', 'Gold purchase completed successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Purchase Failed', error.message || 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-green-600 px-6 pt-12 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Buy Gold</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Mode Toggle */}
        <View className="flex-row bg-gray-100 rounded-lg p-1 mb-6">
          <TouchableOpacity
            onPress={() => {
              setMode('amount');
              setAmount('');
            }}
            className={`flex-1 py-3 rounded-lg ${
              mode === 'amount' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                mode === 'amount' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              By Amount (AED)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMode('grams');
              setAmount('');
            }}
            className={`flex-1 py-3 rounded-lg ${
              mode === 'grams' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                mode === 'grams' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              By Grams
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Price */}
        {currentPrice && (
          <View className="bg-green-50 rounded-lg p-4 mb-6">
            <Text className="text-gray-600 text-sm mb-1">Current Buy Price</Text>
            <Text className="text-2xl font-bold text-green-600">
              {currentPrice.buyPrice.toFixed(2)} AED per gram
            </Text>
          </View>
        )}

        {/* Input */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            {mode === 'amount' ? 'Enter Amount (AED)' : 'Enter Grams'}
          </Text>
          <TextInput
            className="w-full px-4 py-4 border-2 border-green-600 rounded-lg text-xl"
            placeholder={mode === 'amount' ? '1000' : '10.000'}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        {/* Calculation Preview */}
        {amount && parseFloat(amount) > 0 && (
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">
                {mode === 'amount' ? 'You will receive' : 'You will pay'}
              </Text>
              <Text className="font-semibold text-gray-900">
                {mode === 'amount' ? `${calculatedGrams} g` : `${calculatedAmount} AED`}
              </Text>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-gray-200">
              <Text className="text-gray-600">Rate</Text>
              <Text className="font-semibold text-gray-900">
                {currentPrice?.buyPrice.toFixed(2)} AED/g
              </Text>
            </View>
          </View>
        )}

        {/* Buy Button */}
        <TouchableOpacity
          onPress={handleBuy}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className={`w-full py-4 rounded-lg ${
            loading || !amount || parseFloat(amount) <= 0
              ? 'bg-gray-300'
              : 'bg-green-600'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Complete Purchase
            </Text>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text className="text-xs text-gray-500 text-center mt-4">
          By completing this purchase, you agree to our terms and conditions. Gold purchases are
          final and non-refundable.
        </Text>
      </ScrollView>
    </View>
  );
}
