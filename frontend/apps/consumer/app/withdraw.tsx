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

type WithdrawMode = 'cash' | 'physical';

export default function WithdrawScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { goldWallet } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<WithdrawMode>('cash');

  // Cash withdrawal state
  const [cashAmount, setCashAmount] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '',
    bankName: '',
    accountHolderName: '',
    iban: '',
  });

  // Physical withdrawal state
  const [physicalGrams, setPhysicalGrams] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'UAE',
    postalCode: '',
  });

  const availableGrams = goldWallet
    ? (goldWallet.balanceGrams - goldWallet.lockedGrams).toFixed(3)
    : '0.000';

  const handleCashWithdrawal = async () => {
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (
      !bankAccount.accountNumber ||
      !bankAccount.bankName ||
      !bankAccount.accountHolderName
    ) {
      Alert.alert('Error', 'Please fill in all bank account details');
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    try {
      await api.withdrawCash({
        userId: user.id,
        fiatAmount: parseFloat(cashAmount),
        fiatCurrency: 'AED',
        bankAccount,
      });

      Alert.alert('Success', 'Cash withdrawal request submitted successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Withdrawal Failed', error.message || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalWithdrawal = async () => {
    if (!physicalGrams || parseFloat(physicalGrams) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount of grams');
      return;
    }

    if (parseFloat(physicalGrams) > parseFloat(availableGrams)) {
      Alert.alert('Error', 'Insufficient gold balance');
      return;
    }

    if (
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.postalCode
    ) {
      Alert.alert('Error', 'Please fill in all delivery address details');
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    try {
      await api.withdrawPhysical({
        userId: user.id,
        goldGrams: parseFloat(physicalGrams),
        deliveryAddress,
      });

      Alert.alert('Success', 'Physical gold delivery request submitted successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Delivery Failed', error.message || 'Failed to process delivery request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-purple-600 px-6 pt-12 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Withdraw</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Mode Toggle */}
        <View className="flex-row bg-gray-100 rounded-lg p-1 mb-6">
          <TouchableOpacity
            onPress={() => setMode('cash')}
            className={`flex-1 py-3 rounded-lg ${
              mode === 'cash' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                mode === 'cash' ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              Cash Withdrawal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('physical')}
            className={`flex-1 py-3 rounded-lg ${
              mode === 'physical' ? 'bg-white' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                mode === 'physical' ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              Physical Delivery
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'cash' ? (
          <>
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Amount (AED)</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="1000"
                value={cashAmount}
                onChangeText={setCashAmount}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <Text className="text-lg font-semibold text-gray-900 mb-3">Bank Details</Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Account Holder Name</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="John Doe"
                value={bankAccount.accountHolderName}
                onChangeText={(val) =>
                  setBankAccount((prev) => ({ ...prev, accountHolderName: val }))
                }
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Bank Name</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Emirates NBD"
                value={bankAccount.bankName}
                onChangeText={(val) => setBankAccount((prev) => ({ ...prev, bankName: val }))}
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Account Number</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="1234567890"
                value={bankAccount.accountNumber}
                onChangeText={(val) =>
                  setBankAccount((prev) => ({ ...prev, accountNumber: val }))
                }
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">IBAN (Optional)</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="AE070331234567890123456"
                value={bankAccount.iban}
                onChangeText={(val) => setBankAccount((prev) => ({ ...prev, iban: val }))}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              onPress={handleCashWithdrawal}
              disabled={loading}
              className={`w-full py-4 rounded-lg ${
                loading ? 'bg-purple-300' : 'bg-purple-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Request Withdrawal
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="bg-purple-50 rounded-lg p-4 mb-4">
              <Text className="text-gray-600 text-sm mb-1">Available Balance</Text>
              <Text className="text-2xl font-bold text-purple-600">{availableGrams} g</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Grams to Deliver</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="10.000"
                value={physicalGrams}
                onChangeText={setPhysicalGrams}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <Text className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Street Address</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="123 Main Street"
                value={deliveryAddress.street}
                onChangeText={(val) =>
                  setDeliveryAddress((prev) => ({ ...prev, street: val }))
                }
                editable={!loading}
              />
            </View>

            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">City</Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Dubai"
                  value={deliveryAddress.city}
                  onChangeText={(val) =>
                    setDeliveryAddress((prev) => ({ ...prev, city: val }))
                  }
                  editable={!loading}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">State/Emirate</Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Dubai"
                  value={deliveryAddress.state}
                  onChangeText={(val) =>
                    setDeliveryAddress((prev) => ({ ...prev, state: val }))
                  }
                  editable={!loading}
                />
              </View>
            </View>

            <View className="flex-row space-x-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Country</Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="UAE"
                  value={deliveryAddress.country}
                  onChangeText={(val) =>
                    setDeliveryAddress((prev) => ({ ...prev, country: val }))
                  }
                  editable={!loading}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Postal Code</Text>
                <TextInput
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="12345"
                  value={deliveryAddress.postalCode}
                  onChangeText={(val) =>
                    setDeliveryAddress((prev) => ({ ...prev, postalCode: val }))
                  }
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePhysicalWithdrawal}
              disabled={loading}
              className={`w-full py-4 rounded-lg ${
                loading ? 'bg-purple-300' : 'bg-purple-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Request Delivery
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text className="text-xs text-gray-500 text-center mt-4">
          Withdrawal requests are processed within 1-3 business days. Additional verification may
          be required for large amounts.
        </Text>
      </ScrollView>
    </View>
  );
}
