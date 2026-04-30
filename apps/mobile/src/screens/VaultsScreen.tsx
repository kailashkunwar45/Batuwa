import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ProgressBarAndroid, ProgressViewIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { KCard } from '../components/ui/KCard';
import { Plus, Target, Calendar, ArrowRight, Wallet } from 'lucide-react-native';
import { useVaultStore } from '../store/useVaultStore';

export default function VaultsScreen() {
  const { vaults, isLoading, fetchVaults } = useVaultStore();

  useEffect(() => {
    fetchVaults();
  }, []);

  const renderProgressBar = (progress: number) => {
    if (Platform.OS === 'ios') {
      return <ProgressViewIOS progress={progress} progressTintColor={THEME.colors.accent} trackTintColor={THEME.colors.surfaceLight} style={styles.progress} />;
    }
    return <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>My Batuwas</Text>
          <Text style={styles.subtitle}>Goal-based savings for your future adventures.</Text>
        </View>

        <TouchableOpacity style={styles.createBtn}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.createBtnText}>Create New Goal</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          {vaults.length === 0 && !isLoading && (
            <KCard variant="flat" style={styles.emptyCard}>
              <Target size={48} color={THEME.colors.surfaceLight} />
              <Text style={styles.emptyText}>You haven't set any goals yet.</Text>
            </KCard>
          )}

          {vaults.map((vault) => {
            const progress = vault.targetAmount > 0 ? vault.savedAmount / vault.targetAmount : 0;
            return (
              <KCard key={vault.id} variant="elevated" style={styles.vaultCard}>
                <View style={styles.vaultHeader}>
                  <View style={styles.emojiContainer}>
                    <Text style={styles.emoji}>{vault.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.vaultName}>{vault.name}</Text>
                    <Text style={styles.vaultTarget}>Goal: Rs. {vault.targetAmount.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity style={styles.depositBtn}>
                    <Plus size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>{Math.round(progress * 100)}% Saved</Text>
                    <Text style={styles.remainingText}>Rs. {(vault.targetAmount - vault.savedAmount).toLocaleString()} left</Text>
                  </View>
                  {renderProgressBar(progress)}
                </View>

                <View style={styles.footer}>
                  <View style={styles.dateInfo}>
                    <Calendar size={14} color={THEME.colors.textSecondary} />
                    <Text style={styles.dateText}>{vault.targetDate ? new Date(vault.targetDate).toLocaleDateString() : 'No Deadline'}</Text>
                  </View>
                  <TouchableOpacity style={styles.detailsBtn}>
                    <Text style={styles.detailsText}>View Details</Text>
                    <ArrowRight size={14} color={THEME.colors.primary} />
                  </TouchableOpacity>
                </View>
              </KCard>
            );
          })}
        </View>

        <KCard variant="glass" style={styles.roundupCard}>
          <View style={styles.roundupHeader}>
            <Wallet size={24} color={THEME.colors.primary} />
            <Text style={styles.roundupTitle}>Spare Change Roundup</Text>
          </View>
          <Text style={styles.roundupText}>
            We automatically round up your transactions to the nearest Rs. 10 and save it in your primary Batuwa.
          </Text>
          <TouchableOpacity style={styles.setupBtn}>
            <Text style={styles.setupText}>Setup Roundup</Text>
          </TouchableOpacity>
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
  createBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xl,
  },
  createBtnText: {
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
  },
  vaultCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  vaultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  vaultTarget: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  depositBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: THEME.spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  remainingText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  progress: {
    height: 6,
    borderRadius: 3,
  },
  progressBg: {
    height: 6,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.spacing.sm,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 6,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginRight: 4,
  },
  roundupCard: {
    marginTop: THEME.spacing.md,
  },
  roundupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginLeft: 12,
  },
  roundupText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  setupBtn: {
    backgroundColor: THEME.colors.surfaceLight,
    height: 44,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupText: {
    color: THEME.colors.primary,
    fontWeight: 'bold',
  },
});
