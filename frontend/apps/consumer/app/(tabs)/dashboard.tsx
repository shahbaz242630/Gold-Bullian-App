import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useAppStore } from '../../src/stores/app.store';
import { api } from '../../src/lib/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { goldWallet, currentPrice, setWallets, setCurrentPrice, isRefreshing, setRefreshing } =
    useAppStore();
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const [walletsRes, priceRes, transactionsRes] = await Promise.all([
        api.getWallets(user.id),
        api.getCurrentPrice(),
        api.getTransactions(user.id, 1, 5),
      ]);

      setWallets(walletsRes.wallets);
      setCurrentPrice(priceRes);
      setRecentTransactions(transactionsRes.transactions || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const portfolioValueAED = goldWallet && currentPrice
    ? (goldWallet.balanceGrams * currentPrice.sellPrice).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-8">
        <Text className="text-white text-2xl font-bold mb-1">
          Welcome, {user?.user_metadata?.firstName || 'User'}
        </Text>
        <Text className="text-blue-100">Your Gold Portfolio</Text>
      </View>

      {/* Portfolio Card */}
      <View className="px-6 -mt-4">
        <View className="bg-white rounded-xl shadow-lg p-6">
          <Text className="text-gray-600 text-sm mb-1">Total Portfolio Value</Text>
          <Text className="text-3xl font-bold text-gray-900 mb-4">
            {portfolioValueAED} AED
          </Text>

          <View className="flex-row justify-between pt-4 border-t border-gray-200">
            <View>
              <Text className="text-gray-600 text-xs mb-1">Gold Balance</Text>
              <Text className="text-lg font-semibold text-gray-900">
                {goldWallet?.balanceGrams.toFixed(3) || '0.000'} g
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-600 text-xs mb-1">Locked</Text>
              <Text className="text-lg font-semibold text-gray-500">
                {goldWallet?.lockedGrams.toFixed(3) || '0.000'} g
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Current Prices */}
      {currentPrice && (
        <View className="px-6 mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Current Prices (per gram)
          </Text>
          <View className="flex-row space-x-4">
            <View className="flex-1 bg-white rounded-lg p-4">
              <Text className="text-gray-600 text-xs mb-1">Buy Price</Text>
              <Text className="text-xl font-bold text-green-600">
                {currentPrice.buyPrice.toFixed(2)} {currentPrice.currency}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-lg p-4">
              <Text className="text-gray-600 text-xs mb-1">Sell Price</Text>
              <Text className="text-xl font-bold text-red-600">
                {currentPrice.sellPrice.toFixed(2)} {currentPrice.currency}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity
            onPress={() => router.push('/buy-gold')}
            className="flex-1 bg-green-600 rounded-lg py-4 items-center"
          >
            <Text className="text-2xl mb-1">🛒</Text>
            <Text className="text-white font-semibold">Buy Gold</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/sell-gold')}
            className="flex-1 bg-orange-600 rounded-lg py-4 items-center"
          >
            <Text className="text-2xl mb-1">💵</Text>
            <Text className="text-white font-semibold">Sell Gold</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row space-x-4 mt-4">
          <TouchableOpacity
            onPress={() => router.push('/withdraw')}
            className="flex-1 bg-purple-600 rounded-lg py-4 items-center"
          >
            <Text className="text-2xl mb-1">🏦</Text>
            <Text className="text-white font-semibold">Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/transactions')}
            className="flex-1 bg-blue-600 rounded-lg py-4 items-center"
          >
            <Text className="text-2xl mb-1">📜</Text>
            <Text className="text-white font-semibold">History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <View className="px-6 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text className="text-blue-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-lg overflow-hidden">
            {recentTransactions.map((tx, index) => (
              <View
                key={tx.id}
                className={`px-4 py-4 flex-row justify-between items-center ${
                  index !== recentTransactions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View>
                  <Text className="font-semibold text-gray-900 capitalize">
                    {tx.type.replace('_', ' ')}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`font-semibold ${
                      tx.type === 'BUY' ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {tx.type === 'BUY' ? '+' : '-'}
                    {tx.goldGrams.toFixed(3)} g
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1 capitalize">
                    {tx.status.toLowerCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
