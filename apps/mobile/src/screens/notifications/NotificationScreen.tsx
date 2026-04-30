import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { Bell, Check, ArrowLeft } from 'lucide-react-native';
import { useNotificationStore } from '../../store/useNotificationStore';

export default function NotificationScreen({ navigation }: any) {
  const { notifications, isLoading, fetchNotifications, markAsRead } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => markAsRead(item.id)}
            disabled={item.isRead}
          >
            <KCard 
              variant="flat" 
              style={[styles.notifCard, !item.isRead && styles.unreadCard]}
            >
              <View style={[styles.iconContainer, { backgroundColor: THEME.colors.surfaceLight }]}>
                <Bell size={20} color={item.isRead ? THEME.colors.textSecondary : THEME.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.notifTitle, !item.isRead && { fontWeight: 'bold' }]}>
                  {item.title}
                </Text>
                <Text style={styles.notifBody}>{item.body}</Text>
                <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </KCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={THEME.colors.surfaceLight} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  listContent: {
    padding: THEME.spacing.md,
  },
  notifCard: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: 'rgba(79, 124, 255, 0.05)',
    borderColor: THEME.colors.primary,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 15,
    color: THEME.colors.textPrimary,
  },
  notifBody: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: THEME.colors.textSecondary,
    fontSize: 15,
  },
});
