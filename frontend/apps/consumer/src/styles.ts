import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#002147',
  },
  body: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  cta: {
    marginTop: 24,
    fontSize: 18,
    color: '#0ea5e9',
  },
});
