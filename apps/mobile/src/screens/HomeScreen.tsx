import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { KCard } from '../components/ui/KCard';
import { BatuwaLogo } from '../components/ui/BatuwaLogo';
import { Send, QrCode, Plus, History as HistoryIcon, Bell, Users, Brain, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { useAiStore } from '../store/useAiStore';
import { useNotificationStore } from '../store/useNotificationStore';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const hasPin = !!user?.pinHash;
  const { balance, transactions, isLoading: isWalletLoading, fetchWallet, fetchTransactions } = useWalletStore();
  const { insights, fetchInsights } = useAiStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchInsights();
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    await Promise.all([fetchWallet(), fetchTransactions(), fetchInsights(), fetchNotifications()]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isWalletLoading} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
      >
        
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ transform: [{ scale: 0.6 }], marginRight: -10 }}>
              <BatuwaLogo size={32} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.greeting}>Namaste,</Text>
              <Text style={styles.userName}>{user?.fullName || 'Kailash Kunwar'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              style={styles.headerAction} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell size={24} color={THEME.colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
              ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: 22, backgroundColor: THEME.colors.surfaceLight }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* MPIN SETUP PROMPT */}
        {!hasPin && (
          <TouchableOpacity onPress={() => navigation.navigate('SetupPin')}>
            <KCard variant="elevated" style={styles.pinWarningCard}>
              <View style={styles.pinWarningIcon}>
                <ShieldCheck color="#FFF" size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pinWarningTitle}>Set Transaction PIN</Text>
                <Text style={styles.pinWarningText}>Secure your payments with a 4-digit MPIN.</Text>
              </View>
              <Plus color="#FFF" size={20} />
            </KCard>
          </TouchableOpacity>
        )}

        {/* BALANCE CARD (Premium Gradient) */}
        <KCard variant="elevated" style={styles.balanceCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>NPR</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>Rs. {balance.toLocaleString()}</Text>
          
          <View style={styles.actionRow}>
            <ActionButton 
              label="Send" 
              icon={<Send size={20} color="#FFF" />} 
              onPress={() => navigation.navigate('TransferMoney')} 
            />
            <ActionButton 
              label="Scan" 
              icon={<QrCode size={20} color="#FFF" />} 
              onPress={() => {}} 
            />
            <ActionButton 
              label="Add" 
              icon={<Plus size={20} color="#FFF" />} 
              onPress={() => {}} 
            />
            <ActionButton 
              label="History" 
              icon={<HistoryIcon size={20} color="#FFF" />} 
              onPress={() => navigation.navigate('History')} 
            />
          </View>
        </KCard>

        {/* FAMILY BATUWA WIDGET */}
        <TouchableOpacity onPress={() => navigation.navigate('FamilyManagement')}>
          <KCard variant="flat" style={styles.familyWidget}>
            <View style={styles.familyIconContainer}>
              <Users size={24} color={THEME.colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.familyTitle}>Family Batuwa</Text>
              <Text style={styles.familySubtitle}>Manage family spending & limits</Text>
            </View>
            <View style={styles.familyAvatars}>
              <View style={[styles.miniAvatar, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.miniAvatar, { backgroundColor: '#4DABF7', marginLeft: -8 }]} />
              <View style={[styles.miniAvatar, { backgroundColor: '#51CF66', marginLeft: -8 }]} />
            </View>
          </KCard>
        </TouchableOpacity>

        {/* AI INSIGHT CARD */}
        {insights?.tip && (
          <TouchableOpacity onPress={() => navigation.navigate('AiInsights')}>
            <KCard variant="glass" style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Brain size={20} color={THEME.colors.primary} />
                <Text style={styles.insightTitle}>Guardian Tip</Text>
              </View>
              <Text style={styles.insightText}>{insights.tip}</Text>
            </KCard>
          </TouchableOpacity>
        )}

        {/* RECENT ACTIVITY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.slice(0, 5).map((txn) => (
            <ActivityItem 
              key={txn.id}
              title={txn.description} 
              amount={`${txn.type === 'DEBIT' ? '-' : '+'}Rs. ${txn.amount}`} 
              date={new Date(txn.createdAt).toLocaleDateString()} 
              status={txn.status} 
            />
          ))}

          {transactions.length === 0 && !isWalletLoading && (
            <Text style={{ textAlign: 'center', color: THEME.colors.textSecondary, marginTop: 20 }}>
              No recent activity
            </Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


function ActionButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={styles.actionIconContainer}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityItem({ title, amount, date, status }: any) {
  return (
    <KCard variant="flat" style={styles.activityItem}>
      <View style={styles.activityIcon} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDate}>{date}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.activityAmount}>{amount}</Text>
        <Text style={[styles.activityStatus, { color: THEME.colors.success }]}>{status}</Text>
      </View>
    </KCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
  },
  greeting: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  userName: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surfaceLight,
    marginLeft: THEME.spacing.sm,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: THEME.colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: THEME.colors.background,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: THEME.colors.primary,
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.lg,
    borderRadius: THEME.radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currencyText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: THEME.spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.sm,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    color: '#FFF',
    fontSize: 12,
  },
  familyWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.surfaceLight,
  },
  familyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  familySubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  familyAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.background,
  },
  insightCard: {
    marginBottom: THEME.spacing.lg,
  },
  insightTitle: {
    color: THEME.colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  insightText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginTop: THEME.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: THEME.colors.primary,
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 8,
  },
  activityTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  activityDate: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  activityAmount: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  activityStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  pinWarningCard: {
    backgroundColor: THEME.colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 20,
    borderRadius: 12,
  },
  pinWarningIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWarningTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pinWarningText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});
