import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { KButton } from '../../components/ui/KButton';

export default function BillConfirmScreen({ route, navigation }: any) {
  const { providerName, accountId, amount } = route.params;
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = () => {
    setIsPaying(true);
    // Simulate payment delay
    setTimeout(() => {
      setIsPaying(false);
      navigation.navigate('PaymentSuccess', {
        title: 'Bill Paid Successfully',
        amount,
        reference: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      });
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Payment</Text>
        </View>

        <KCard variant="flat" style={styles.summaryCard}>
          <SummaryRow label="Provider" value={providerName} />
          <SummaryRow label="Account Number" value={accountId} />
          <SummaryRow label="Consumer Name" value="Kailash Kunwar" />
          <View style={styles.divider} />
          <SummaryRow label="Bill Amount" value={`Rs. ${amount.toFixed(2)}`} isBold />
          <SummaryRow label="Service Fee" value="Rs. 0.00" />
          <View style={styles.divider} />
          <SummaryRow label="Total Payable" value={`Rs. ${amount.toFixed(2)}`} isBold isPrimary />
        </KCard>

        <Text style={styles.walletInfo}>
          Paying from: <Text style={{ fontWeight: 'bold' }}>Main Wallet (Rs. 1,24,500.50)</Text>
        </Text>

        <KButton 
          label={isPaying ? "Processing..." : `Pay Rs. ${amount.toFixed(2)}`} 
          onPress={handlePay}
          loading={isPaying}
          style={styles.payBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, isBold, isPrimary }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[
        styles.rowValue, 
        isBold && { fontWeight: 'bold' },
        isPrimary && { color: THEME.colors.primary, fontSize: 18 }
      ]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { padding: THEME.spacing.lg },
  header: { marginBottom: 20 },
  title: { color: THEME.colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  summaryCard: { padding: THEME.spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel: { color: THEME.colors.textSecondary, fontSize: 14 },
  rowValue: { color: THEME.colors.textPrimary, fontSize: 15 },
  divider: { height: 1, backgroundColor: THEME.colors.border, marginVertical: 12 },
  walletInfo: { color: THEME.colors.textSecondary, textAlign: 'center', marginTop: 30, fontSize: 13 },
  payBtn: { marginTop: 20 },
});
