import React from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'light'} />

      <View style={styles.container}>
        <View style={[styles.heroCard, isCompact && styles.heroCardCompact]}>
          <Text style={styles.eyebrow}>TaskBuddy</Text>
          <Text style={styles.title}>Find help when you need it</Text>
          <Text style={styles.subtitle}>
            A phone-first experience for homeowners and service providers on iOS and Android.
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Fast booking</Text>
            <Text style={styles.tileText}>Book trusted help in just a few taps.</Text>
          </View>

          <View style={styles.tile}>
            <Text style={styles.tileTitle}>Real-time updates</Text>
            <Text style={styles.tileText}>Stay connected from confirmation to completion.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroCardCompact: {
    padding: 20,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  tileTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  tileText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
  },
});
