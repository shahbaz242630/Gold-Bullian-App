import React, { useState } from 'react';
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

export default function SellGoldScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { goldWallet, currentPrice } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [grams, setGrams] = useState('');

  const availableGrams = goldWallet
    ? (goldWallet.balanceGrams - goldWallet.lockedGrams).toFixed(3)
    : '0.000';

  const calculatedAmount =
    grams && currentPrice ? (parseFloat(grams) * currentPrice.sellPrice).toFixed(2) : '0.00';

  const handleSell = async () => {
    if (!grams || parseFloat(grams) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(grams) > parseFloat(availableGrams)) {
      Alert.alert('Error', 'Insufficient gold balance');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Confirm Sale',
      `Are you sure you want to sell ${grams} grams of gold for ${calculatedAmount} AED?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.sellGold({
                userId: user.id,
                goldGrams: parseFloat(grams),
              });

              Alert.alert('Success', 'Gold sold successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Sale Failed', error.message || 'Failed to complete sale');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-orange-600 px-6 pt-12 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Sell Gold</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Available Balance */}
        <View className="bg-orange-50 rounded-lg p-4 mb-6">
          <Text className="text-gray-600 text-sm mb-1">Available Balance</Text>
          <Text className="text-2xl font-bold text-orange-600">{availableGrams} g</Text>
          {goldWallet && goldWallet.lockedGrams > 0 && (
            <Text className="text-xs text-gray-500 mt-2">
              ({goldWallet.lockedGrams.toFixed(3)} g locked in pending transactions)
            </Text>
          )}
        </View>

        {/* Current Price */}
        {currentPrice && (
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-gray-600 text-sm mb-1">Current Sell Price</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {currentPrice.sellPrice.toFixed(2)} AED per gram
            </Text>
          </View>
        )}

        {/* Input */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Enter Grams to Sell
          </Text>
          <TextInput
            className="w-full px-4 py-4 border-2 border-orange-600 rounded-lg text-xl"
            placeholder="10.000"
            value={grams}
            onChangeText={setGrams}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setGrams(availableGrams)}
            className="mt-2"
          >
            <Text className="text-orange-600 font-medium text-right">Sell All</Text>
          </TouchableOpacity>
        </View>

        {/* Calculation Preview */}
        {grams && parseFloat(grams) > 0 && (
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">You will receive</Text>
              <Text className="font-semibold text-gray-900">{calculatedAmount} AED</Text>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-gray-200">
              <Text className="text-gray-600">Rate</Text>
              <Text className="font-semibold text-gray-900">
                {currentPrice?.sellPrice.toFixed(2)} AED/g
              </Text>
            </View>
          </View>
        )}

        {/* Sell Button */}
        <TouchableOpacity
          onPress={handleSell}
          disabled={
            loading ||
            !grams ||
            parseFloat(grams) <= 0 ||
            parseFloat(grams) > parseFloat(availableGrams)
          }
          className={`w-full py-4 rounded-lg ${
            loading ||
            !grams ||
            parseFloat(grams) <= 0 ||
            parseFloat(grams) > parseFloat(availableGrams)
              ? 'bg-gray-300'
              : 'bg-orange-600'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Complete Sale
            </Text>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text className="text-xs text-gray-500 text-center mt-4">
          Funds will be credited to your account immediately. Sale prices are subject to market
          conditions.
        </Text>
      </ScrollView>
    </View>
  );
}
