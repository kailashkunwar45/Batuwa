import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { KCard } from '../components/ui/KCard';
import { Brain, TrendingUp, TrendingDown, ShieldAlert, Award, ArrowLeft } from 'lucide-react-native';
import { useAiStore } from '../store/useAiStore';

export default function AiInsightsScreen({ navigation }: any) {
  const { insights, healthScore, fetchInsights, fetchHealthScore, isLoading } = useAiStore();

  useEffect(() => {
    fetchInsights();
    fetchHealthScore();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Financial Guardian</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Health Score Section */}
        <KCard variant="elevated" style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Award size={24} color={THEME.colors.accent} />
            <Text style={styles.scoreTitle}>Financial Health Score</Text>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{healthScore?.score || '--'}</Text>
            <Text style={styles.scoreGrade}>Grade {healthScore?.grade || '-'}</Text>
          </View>
          <Text style={styles.adviceText}>{healthScore?.advice}</Text>
        </KCard>

        {/* Spending Insights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Breakdown</Text>
          <Text style={styles.sectionSubtitle}>Period: {insights?.period}</Text>
          
          {insights?.categories.map((cat, index) => (
            <KCard key={index} variant="flat" style={styles.categoryCard}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <Text style={styles.categoryAmount}>Rs. {cat.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.trendRow}>
                {cat.trend === 'up' ? (
                  <TrendingUp size={16} color={THEME.colors.error} />
                ) : (
                  <TrendingDown size={16} color={THEME.colors.success} />
                )}
                <Text style={[styles.trendText, { color: cat.trend === 'up' ? THEME.colors.error : THEME.colors.success }]}>
                  {cat.changePercent}% {cat.trend}
                </Text>
              </View>
            </KCard>
          ))}
        </View>

        {/* AI Tip Section */}
        <KCard variant="glass" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Brain size={24} color={THEME.colors.primary} />
            <Text style={styles.tipTitle}>Guardian Tip</Text>
          </View>
          <Text style={styles.tipText}>{insights?.tip}</Text>
        </KCard>

        {/* Security / Fraud Monitoring */}
        <View style={styles.securityBox}>
          <ShieldAlert size={20} color={THEME.colors.accent} />
          <Text style={styles.securityText}>Real-time fraud monitoring is active. Your transactions are protected by Batuwa AI.</Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginLeft: 16,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  scoreCard: {
    alignItems: 'center',
    padding: THEME.spacing.xl,
    marginBottom: THEME.spacing.xl,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  scoreGrade: {
    fontSize: 14,
    color: THEME.colors.accent,
    fontWeight: 'bold',
  },
  adviceText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  categoryAmount: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tipCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginLeft: 12,
  },
  tipText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceLight,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    marginBottom: 40,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 12,
    lineHeight: 16,
  },
});
