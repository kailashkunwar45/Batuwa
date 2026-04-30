import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { KCard } from '../components/ui/KCard';
import { useWalletStore } from '../store/useWalletStore';

export default function HistoryScreen() {
  const { transactions, isLoading, fetchTransactions } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      
      {/* Search Bar Placeholder */}
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>Search transactions...</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
        renderItem={({ item }) => (
          <KCard variant="flat" style={styles.activityItem}>
            <View style={styles.activityIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.activityTitle}>{item.description}</Text>
              <Text style={styles.activityDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.activityAmount, { color: item.type === 'DEBIT' ? THEME.colors.danger : THEME.colors.success }]}>
                {item.type === 'DEBIT' ? '-' : '+'}Rs. {item.amount}
              </Text>
              <Text style={styles.activityStatus}>{item.status}</Text>
            </View>
          </KCard>
        )}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No recent transactions found.</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingHorizontal: THEME.spacing.md }}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: { padding: THEME.spacing.lg },
  title: { color: THEME.colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  searchBar: {
    margin: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchText: { color: THEME.colors.textMuted },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: THEME.colors.textSecondary },
});
