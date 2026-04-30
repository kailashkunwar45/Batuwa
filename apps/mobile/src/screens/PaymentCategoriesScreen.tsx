import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';

const CATEGORIES = [
  { id: 'mobile', name: 'Mobile Topup', icon: '📱' },
  { id: 'electricity', name: 'Electricity', icon: '⚡' },
  { id: 'internet', name: 'Internet', icon: '🌐' },
  { id: 'tv', name: 'TV', icon: '📺' },
  { id: 'water', name: 'Water', icon: '💧' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'government', name: 'Govt. Pay', icon: '🏛️' },
  { id: 'education', name: 'Education', icon: '🎓' },
  { id: 'merchant', name: 'Merchant', icon: '🛒' },
  { id: 'ott', name: 'Subscriptions', icon: '🍿' },
];

export default function PaymentCategoriesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Select a category to pay your bills</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => navigation.navigate('BillInquiry', { 
              providerId: item.id, 
              providerName: item.name 
            })}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    padding: THEME.spacing.lg,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: THEME.spacing.md,
  },
  categoryCard: {
    flex: 1/3,
    backgroundColor: THEME.colors.surface,
    margin: 6,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  categoryName: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
