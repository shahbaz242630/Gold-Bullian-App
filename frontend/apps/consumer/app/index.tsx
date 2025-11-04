import { Link, Stack } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

import { styles } from '../src/styles';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Bulliun' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Bulliun Digital Gold</Text>
        <Text style={styles.body}>
          Fractional gold saving made simple. This is the starter consumer app shell.
        </Text>
        <Link href="/onboarding" style={styles.cta}>
          Get Started
        </Link>
      </View>
    </SafeAreaView>
  );
}
