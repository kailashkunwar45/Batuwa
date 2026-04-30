import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { Store, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react-native';
import { useMerchantStore } from '../../store/useMerchantStore';

export default function MerchantPaymentScreen({ route, navigation }: any) {
  const { qrCode } = route.params || {};
  const { currentMerchant, isLoading, lookupMerchant, payMerchant } = useMerchantStore();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1); // 1: Amount, 2: Success

  useEffect(() => {
    if (qrCode) {
      lookupMerchant(qrCode).catch(() => {
        Alert.alert('Error', 'Invalid Merchant QR Code');
        navigation.goBack();
      });
    }
  }, [qrCode]);

  const handlePay = async () => {
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      await payMerchant(qrCode, Number(amount));
      setStep(2);
    } catch (error) {
      Alert.alert('Payment Failed', 'Something went wrong during the transaction.');
    }
  };

  if (isLoading && step === 1 && !currentMerchant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Identifying Merchant...</Text>
      </View>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <CheckCircle2 size={80} color={THEME.colors.success} />
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successAmount}>Rs. {Number(amount).toLocaleString()}</Text>
        <Text style={styles.successSubtitle}>Paid to {currentMerchant?.businessName}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merchant Payment</Text>
      </View>

      <View style={styles.content}>
        <KCard variant="elevated" style={styles.merchantCard}>
          <View style={styles.merchantHeader}>
            <View style={styles.storeIcon}>
              <Store size={24} color={THEME.colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.merchantName}>{currentMerchant?.businessName || 'Merchant'}</Text>
              <View style={styles.verifiedRow}>
                <ShieldCheck size={14} color={THEME.colors.success} />
                <Text style={styles.verifiedText}>Verified Batuwa Merchant</Text>
              </View>
            </View>
          </View>
        </KCard>

        <View style={styles.amountSection}>
          <Text style={styles.label}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currency}>Rs.</Text>
            <TextInput 
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={THEME.colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, (!amount || isLoading) && { opacity: 0.7 }]} 
          onPress={handlePay}
          disabled={!amount || isLoading}
        >
          {isLoading ? <Loader2 size={24} color="#FFF" /> : <Text style={styles.btnText}>Pay Now</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    marginTop: 12,
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
  content: {
    padding: THEME.spacing.lg,
  },
  merchantCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: THEME.colors.success,
    marginLeft: 4,
  },
  amountSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
    paddingBottom: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginTop: 20,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.colors.accent,
    marginVertical: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    marginBottom: 40,
  },
});
