import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { KCard } from '../components/ui/KCard';
import { Users, Plus, Settings2, Trash2, ShieldCheck, TrendingUp } from 'lucide-react-native';
import { useFamilyStore } from '../store/useFamilyStore';

export default function FamilyManagementScreen() {
  const { links, isLoading, fetchLinks, removeMember } = useFamilyStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = (childId: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${name} from your Family Batuwa?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeMember(childId) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Batuwa</Text>
          <Text style={styles.subtitle}>Manage shared wallets and spending limits for your loved ones.</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add Family Member</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Members</Text>
          {links.length === 0 && !isLoading && (
            <KCard variant="flat" style={styles.emptyCard}>
              <Users size={48} color={THEME.colors.surfaceLight} />
              <Text style={styles.emptyText}>No family members linked yet.</Text>
            </KCard>
          )}

          {links.map((link) => (
            <KCard key={link.id} variant="elevated" style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{link.child.fullName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{link.child.fullName}</Text>
                    <Text style={styles.memberPhone}>{link.child.phone}</Text>
                  </View>
                </View>
                <View style={styles.memberActions}>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Settings2 size={20} color={THEME.colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.iconBtn} 
                    onPress={() => handleDelete(link.child.id, link.child.fullName)}
                  >
                    <Trash2 size={20} color={THEME.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Daily Limit</Text>
                  <Text style={styles.statValue}>Rs. {link.dailyLimit?.toLocaleString() || 'No Limit'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Monthly Limit</Text>
                  <Text style={styles.statValue}>Rs. {link.monthlyLimit?.toLocaleString() || 'No Limit'}</Text>
                </View>
              </View>

              <View style={styles.featureBadges}>
                <View style={styles.badge}>
                  <ShieldCheck size={14} color={THEME.colors.success} />
                  <Text style={styles.badgeText}>Smart Controls</Text>
                </View>
                <View style={styles.badge}>
                  <TrendingUp size={14} color={THEME.colors.primary} />
                  <Text style={styles.badgeText}>Spend Tracking</Text>
                </View>
              </View>
            </KCard>
          ))}
        </View>

        <KCard variant="glass" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why use Family Batuwa?</Text>
          <Text style={styles.infoText}>
            Give your children or elderly parents financial independence while maintaining safety with real-time alerts and custom spending limits.
          </Text>
        </KCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  header: {
    marginBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xl,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: THEME.colors.surfaceLight,
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    marginTop: 12,
    fontSize: 15,
  },
  memberCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: THEME.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  memberPhone: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 8,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
    height: '100%',
  },
  statLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  featureBadges: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  infoCard: {
    marginTop: THEME.spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.accent,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
});
