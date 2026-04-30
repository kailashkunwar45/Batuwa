import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, StatusBar, Alert,
} from 'react-native';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { ArrowLeft, Building2, CreditCard, Smartphone, ChevronRight, CheckCircle2 } from 'lucide-react-native';

const AMOUNT_PRESETS = [500, 1000, 2000, 5000, 10000];

const FUNDING_SOURCES = [
  { id: 'bank', label: 'Bank Transfer (NEFT)', sublabel: 'Nepal Rastra Bank cleared', icon: Building2, fee: 'Free' },
  { id: 'card', label: 'Debit / Credit Card', sublabel: 'Visa, MasterCard accepted', icon: CreditCard, fee: '1.5%' },
  { id: 'esewa', label: 'eSewa / Khalti', sublabel: 'Instant transfer', icon: Smartphone, fee: '0.5%' },
];

export default function AddMoneyScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [selectedSource, setSelectedSource] = useState('bank');

  const selectedFee = FUNDING_SOURCES.find(s => s.id === selectedSource)?.fee;
  const numericAmount = parseFloat(amount) || 0;
  const fee = selectedFee === 'Free' ? 0 : numericAmount * (parseFloat(selectedFee) / 100);

  const handleAddMoney = () => {
    if (numericAmount < 100) {
      Alert.alert('Minimum amount is Rs. 100');
      return;
    }
    Alert.alert('Add Money', `Add Rs. ${numericAmount} via ${selectedSource}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Proceed', onPress: () => navigation.navigate('PaymentSuccess') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Amount Input */}
        <KCard variant="elevated" style={styles.amountCard}>
          <Text style={styles.amountLabel}>Enter Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>Rs.</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={THEME.colors.textMuted}
              maxLength={7}
            />
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            {AMOUNT_PRESETS.map(preset => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetChip, amount === String(preset) && styles.presetChipActive]}
                onPress={() => setAmount(String(preset))}
              >
                <Text style={[styles.presetText, amount === String(preset) && styles.presetTextActive]}>
                  {preset >= 1000 ? `${preset / 1000}K` : preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </KCard>

        {/* Funding Source */}
        <Text style={styles.sectionTitle}>Funding Source</Text>
        {FUNDING_SOURCES.map(source => {
          const Icon = source.icon;
          const isSelected = selectedSource === source.id;
          return (
            <TouchableOpacity key={source.id} onPress={() => setSelectedSource(source.id)}>
              <KCard variant="flat" style={[styles.sourceCard, isSelected && styles.sourceCardActive]}>
                <View style={[styles.sourceIconBox, { backgroundColor: isSelected ? THEME.colors.primary : THEME.colors.surfaceLight }]}>
                  <Icon size={20} color={isSelected ? '#FFF' : THEME.colors.textSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sourceLabel}>{source.label}</Text>
                  <Text style={styles.sourceSublabel}>{source.sublabel}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.sourceFee, { color: source.fee === 'Free' ? THEME.colors.success : THEME.colors.warning }]}>
                    {source.fee}
                  </Text>
                  {isSelected && <CheckCircle2 size={18} color={THEME.colors.primary} style={{ marginTop: 4 }} />}
                </View>
              </KCard>
            </TouchableOpacity>
          );
        })}

        {/* Summary */}
        {numericAmount > 0 && (
          <KCard variant="glass" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Amount</Text>
              <Text style={styles.summaryValue}>Rs. {numericAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Processing Fee</Text>
              <Text style={[styles.summaryValue, { color: fee === 0 ? THEME.colors.success : THEME.colors.warning }]}>
                {fee === 0 ? 'Free' : `Rs. ${fee.toFixed(2)}`}
              </Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: THEME.colors.border, paddingTop: 8, marginTop: 4 }]}>
              <Text style={[styles.summaryKey, { fontWeight: 'bold', color: THEME.colors.textPrimary }]}>Total Added</Text>
              <Text style={[styles.summaryValue, { color: THEME.colors.primary, fontWeight: 'bold', fontSize: 16 }]}>
                Rs. {(numericAmount - fee).toFixed(2)}
              </Text>
            </View>
          </KCard>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.addBtn, !numericAmount && styles.addBtnDisabled]}
          onPress={handleAddMoney}
          disabled={!numericAmount}
        >
          <Text style={styles.addBtnText}>Add Money to Batuwa</Text>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          🔒 Secured by Nepal Rastra Bank guidelines. Your money is protected.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.colors.textPrimary },
  content: { padding: THEME.spacing.md, paddingBottom: 40 },
  amountCard: { marginBottom: THEME.spacing.lg, padding: THEME.spacing.lg },
  amountLabel: { color: THEME.colors.textSecondary, fontSize: 13, marginBottom: 8 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: THEME.spacing.md },
  currencySymbol: { color: THEME.colors.textSecondary, fontSize: 22, fontWeight: 'bold', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 42, fontWeight: 'bold', color: THEME.colors.textPrimary },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 1, borderColor: THEME.colors.border,
  },
  presetChipActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  presetText: { fontSize: 13, color: THEME.colors.textSecondary, fontWeight: '500' },
  presetTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: THEME.colors.textPrimary, marginBottom: THEME.spacing.sm },
  sourceCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: THEME.spacing.md, marginBottom: THEME.spacing.sm,
  },
  sourceCardActive: { borderColor: THEME.colors.primary, borderWidth: 1 },
  sourceIconBox: {
    width: 44, height: 44, borderRadius: THEME.radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceLabel: { fontSize: 15, fontWeight: '600', color: THEME.colors.textPrimary },
  sourceSublabel: { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 },
  sourceFee: { fontSize: 13, fontWeight: '600' },
  summaryCard: { padding: THEME.spacing.md, marginTop: THEME.spacing.md, marginBottom: THEME.spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryKey: { color: THEME.colors.textSecondary, fontSize: 14 },
  summaryValue: { color: THEME.colors.textPrimary, fontSize: 14 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: THEME.colors.primary, padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg, marginTop: THEME.spacing.md,
    gap: 8,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  disclaimer: { textAlign: 'center', color: THEME.colors.textMuted, fontSize: 12, marginTop: THEME.spacing.lg },
});
