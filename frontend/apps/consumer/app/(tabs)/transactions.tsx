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
import { api } from '../../src/lib/api';

interface Transaction {
  id: string;
  type: string;
  status: string;
  goldGrams: number;
  fiatAmount: number;
  fiatCurrency: string;
  referenceCode: string;
  createdAt: string;
  completedAt: string | null;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (pageNum: number = 1, refresh: boolean = false) => {
    if (!user?.id) return;

    try {
      const response = await api.getTransactions(user.id, pageNum, 20);

      if (refresh) {
        setTransactions(response.transactions);
      } else {
        setTransactions((prev) => [...prev, ...response.transactions]);
      }

      setHasMore(response.transactions.length === 20);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, true);
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTransactions(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'FAILED':
      case 'CANCELLED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return '🛒';
      case 'SELL':
        return '💵';
      case 'WITHDRAW_CASH':
        return '🏦';
      case 'WITHDRAW_PHYSICAL':
        return '📦';
      default:
        return '📄';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-6">
        <Text className="text-white text-2xl font-bold">Transactions</Text>
        <Text className="text-blue-100 mt-1">Your transaction history</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View className="px-6 py-4">
          {transactions.length === 0 ? (
            <View className="bg-white rounded-lg p-8 items-center">
              <Text className="text-6xl mb-4">📝</Text>
              <Text className="text-gray-900 font-semibold text-lg mb-2">
                No Transactions Yet
              </Text>
              <Text className="text-gray-600 text-center">
                Start buying gold to see your transactions here
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/buy-gold')}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Buy Gold Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {transactions.map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  onPress={() => router.push(`/transaction-details?id=${tx.id}`)}
                  className="bg-white rounded-lg p-4 mb-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start flex-1">
                      <Text className="text-3xl mr-3">{getTypeIcon(tx.type)}</Text>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold capitalize">
                          {tx.type.replace(/_/g, ' ')}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          Ref: {tx.referenceCode}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end ml-4">
                      <Text
                        className={`font-semibold ${
                          tx.type === 'BUY' || tx.type === 'ADJUSTMENT'
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {tx.type === 'BUY' || tx.type === 'ADJUSTMENT' ? '+' : '-'}
                        {tx.goldGrams.toFixed(3)} g
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {tx.fiatAmount.toFixed(2)} {tx.fiatCurrency}
                      </Text>
                      <Text className={`text-xs mt-1 capitalize ${getStatusColor(tx.status)}`}>
                        {tx.status.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {hasMore && (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#2563eb" />
                  <Text className="text-gray-500 text-sm mt-2">Loading more...</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
