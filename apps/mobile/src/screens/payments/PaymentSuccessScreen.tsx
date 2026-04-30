import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KButton } from '../../components/ui/KButton';
import { CheckCircle2 } from 'lucide-react-native';

export default function PaymentSuccessScreen({ route, navigation }: any) {
  const { title, amount, reference } = route.params || {
    title: 'Payment Successful',
    amount: 0,
    reference: 'N/A'
  };

  const handleDone = () => {
    // Reset back to main tab navigator (Home)
    navigation.getParent()?.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <CheckCircle2 color={THEME.colors.success} size={100} strokeWidth={1.5} />
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Your payment has been processed successfully.</Text>
        
        <View style={styles.receiptCard}>
          <Text style={styles.amount}>Rs. {amount.toFixed(2)}</Text>
          <Text style={styles.refLabel}>Reference ID</Text>
          <Text style={styles.refValue}>{reference}</Text>
        </View>

        <KButton 
          label="Back to Home" 
          onPress={handleDone}
          style={styles.button}
        />
        
        <KButton 
          label="Download Receipt" 
          onPress={() => {}} 
          variant="outline"
          style={styles.outlineButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: THEME.spacing.xl },
  title: { color: THEME.colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginTop: 24 },
  subtitle: { color: THEME.colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
  receiptCard: { 
    width: '100%', 
    backgroundColor: THEME.colors.surface, 
    borderRadius: THEME.radius.lg, 
    padding: THEME.spacing.lg, 
    alignItems: 'center',
    marginVertical: 40,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  amount: { color: THEME.colors.textPrimary, fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  refLabel: { color: THEME.colors.textMuted, fontSize: 12, textTransform: 'uppercase' },
  refValue: { color: THEME.colors.textSecondary, fontSize: 14, marginTop: 4, fontWeight: '500' },
  button: { width: '100%', marginBottom: 12 },
  outlineButton: { width: '100%' },
});
