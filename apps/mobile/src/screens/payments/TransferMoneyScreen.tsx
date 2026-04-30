import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KInput } from '../../components/ui/KInput';
import { KButton } from '../../components/ui/KButton';
import { User, Banknote } from 'lucide-react-native';

export default function TransferMoneyScreen({ navigation }: any) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleTransfer = () => {
    // Navigate to Confirm (reusing confirm or specialized)
    navigation.navigate('BillConfirm', {
      providerName: 'P2P Transfer',
      accountId: recipient,
      amount: parseFloat(amount),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Send Money</Text>
          <Text style={styles.subtitle}>Instantly transfer to any Batuwa user</Text>
        </View>

        <KInput
          label="Recipient Phone / ID"
          placeholder="98XXXXXXXX"
          value={recipient}
          onChangeText={setRecipient}
          leftIcon={<User color={THEME.colors.textMuted} size={20} />}
        />

        <KInput
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          leftIcon={<Banknote color={THEME.colors.textMuted} size={20} />}
        />

        <KInput
          label="Note (Optional)"
          placeholder="e.g. Lunch split"
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.spacer} />

        <KButton 
          label="Continue" 
          onPress={handleTransfer} 
          disabled={!recipient || !amount}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { padding: THEME.spacing.lg },
  header: { marginBottom: 30 },
  title: { color: THEME.colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: THEME.colors.textSecondary, fontSize: 14, marginTop: 4 },
  spacer: { height: 20 },
  button: { marginTop: 10 },
});
