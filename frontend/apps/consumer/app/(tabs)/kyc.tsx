import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { api } from '../../src/lib/api';

interface KycProfile {
  id: string;
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  provider: string;
  providerRef: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  notes: string | null;
}

export default function KycScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [formData, setFormData] = useState({
    idNumber: '',
    idType: 'PASSPORT',
    nationality: 'UAE',
    dateOfBirth: '',
    address: '',
  });

  const fetchKycProfile = async () => {
    if (!user?.id) return;

    try {
      const profile = await api.getKycProfile(user.id);
      setKycProfile(profile);
    } catch (error: any) {
      // KYC profile might not exist yet
      console.log('No KYC profile found');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKycProfile();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKycProfile();
  };

  const handleSubmitKyc = async () => {
    if (!formData.idNumber || !formData.dateOfBirth || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) return;

    setSubmitting(true);
    try {
      await api.submitKyc({
        userId: user.id,
        provider: 'manual', // Using manual for now, can integrate with Digitify later
        metadata: formData,
      });

      Alert.alert('Success', 'KYC information submitted successfully! We will review it shortly.');
      fetchKycProfile();
    } catch (error: any) {
      Alert.alert('Submission Failed', error.message || 'Failed to submit KYC information');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '✓';
      case 'IN_REVIEW':
        return '⏳';
      case 'REJECTED':
        return '✗';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // If KYC already submitted, show status
  if (kycProfile && kycProfile.status !== 'REJECTED') {
    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-blue-600 px-6 pt-12 pb-6">
          <Text className="text-white text-2xl font-bold">KYC Verification</Text>
          <Text className="text-blue-100 mt-1">Your verification status</Text>
        </View>

        <View className="px-6 py-6">
          {/* Status Card */}
          <View className="bg-white rounded-xl shadow-lg p-6 items-center">
            <Text className="text-6xl mb-4">{getStatusIcon(kycProfile.status)}</Text>
            <View
              className={`px-4 py-2 rounded-full mb-4 ${getStatusColor(kycProfile.status).split(' ')[0]}`}
            >
              <Text
                className={`font-semibold ${getStatusColor(kycProfile.status).split(' ')[1]}`}
              >
                {kycProfile.status.replace('_', ' ')}
              </Text>
            </View>

            {kycProfile.status === 'VERIFIED' && (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  Verification Complete!
                </Text>
                <Text className="text-gray-600 text-center">
                  Your identity has been verified. You can now access all features.
                </Text>
              </>
            )}

            {kycProfile.status === 'IN_REVIEW' && (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-2">Under Review</Text>
                <Text className="text-gray-600 text-center">
                  We're reviewing your KYC information. This usually takes 1-2 business days.
                </Text>
              </>
            )}

            {kycProfile.status === 'PENDING' && (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-2">Submitted</Text>
                <Text className="text-gray-600 text-center">
                  Your KYC information has been submitted and is awaiting review.
                </Text>
              </>
            )}

            {kycProfile.submittedAt && (
              <Text className="text-xs text-gray-500 mt-4">
                Submitted on {new Date(kycProfile.submittedAt).toLocaleDateString()}
              </Text>
            )}

            {kycProfile.reviewedAt && (
              <Text className="text-xs text-gray-500 mt-1">
                Reviewed on {new Date(kycProfile.reviewedAt).toLocaleDateString()}
              </Text>
            )}

            {kycProfile.notes && (
              <View className="mt-4 w-full">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Notes:</Text>
                <Text className="text-sm text-gray-600">{kycProfile.notes}</Text>
              </View>
            )}
          </View>

          {/* Information */}
          <View className="mt-6 bg-blue-50 rounded-lg p-4">
            <Text className="text-blue-900 font-semibold mb-2">What happens next?</Text>
            <Text className="text-blue-800 text-sm">
              • Our team will review your submitted documents{'\n'}
              • You'll receive an email notification once reviewed{'\n'}
              • You can refresh this page to check your status{'\n'}
              • Contact support if you have any questions
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Show KYC submission form
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-6">
        <Text className="text-white text-2xl font-bold">KYC Verification</Text>
        <Text className="text-blue-100 mt-1">Complete your identity verification</Text>
      </View>

      <View className="px-6 py-6">
        {/* Info Banner */}
        <View className="bg-blue-50 rounded-lg p-4 mb-6">
          <Text className="text-blue-900 font-semibold mb-2">Why do we need this?</Text>
          <Text className="text-blue-800 text-sm">
            To comply with regulations and ensure security, we need to verify your identity before
            you can trade gold.
          </Text>
        </View>

        {/* Form */}
        <View className="bg-white rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">ID Type *</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setFormData((prev) => ({ ...prev, idType: 'PASSPORT' }))}
                className={`flex-1 py-3 rounded-lg border ${
                  formData.idType === 'PASSPORT'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    formData.idType === 'PASSPORT' ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Passport
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFormData((prev) => ({ ...prev, idType: 'EMIRATES_ID' }))}
                className={`flex-1 py-3 rounded-lg border ${
                  formData.idType === 'EMIRATES_ID'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    formData.idType === 'EMIRATES_ID' ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Emirates ID
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">ID Number *</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your ID number"
              value={formData.idNumber}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, idNumber: val }))}
              editable={!submitting}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Nationality *</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="UAE"
              value={formData.nationality}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, nationality: val }))}
              editable={!submitting}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Date of Birth (YYYY-MM-DD) *
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="1990-01-01"
              value={formData.dateOfBirth}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, dateOfBirth: val }))}
              editable={!submitting}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Address *</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter your full address"
              value={formData.address}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, address: val }))}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmitKyc}
          disabled={submitting}
          className={`w-full py-4 rounded-lg ${submitting ? 'bg-blue-300' : 'bg-blue-600'}`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">Submit for Review</Text>
          )}
        </TouchableOpacity>

        <Text className="text-xs text-gray-500 text-center mt-4">
          By submitting, you agree that the information provided is accurate and complete.
        </Text>
      </View>
    </ScrollView>
  );
}
