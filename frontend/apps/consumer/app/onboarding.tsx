import { Stack } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

import { styles } from '../src/styles';

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Onboarding' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Bulliun</Text>
        <Text style={styles.body}>
          Configure onboarding flows (KYC, nominee, funding) within this screen set.
        </Text>
      </View>
    </SafeAreaView>
  );
}
