import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KInput } from '../../components/ui/KInput';
import { KButton } from '../../components/ui/KButton';
import { Search } from 'lucide-react-native';

export default function BillInquiryScreen({ route, navigation }: any) {
  const { categoryId, providerId, providerName } = route.params || { 
    categoryId: 'electricity', 
    providerId: 'nea', 
    providerName: 'NEA Electricity' 
  };
  
  const [accountId, setAccountId] = useState('');

  const handleInquiry = () => {
    // Navigate to Confirm Screen (to be built)
    navigation.navigate('BillConfirm', {
      providerId,
      providerName,
      accountId,
      amount: 1250.00, // Mocked from inquiry
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{providerName}</Text>
          <Text style={styles.subtitle}>Enter your account details to fetch the bill</Text>
        </View>

        <KInput
          label="SC. Number / Customer ID"
          placeholder="e.g. 001.02.003"
          value={accountId}
          onChangeText={setAccountId}
          leftIcon={<Search color={THEME.colors.textMuted} size={20} />}
          helperText="You can find this on your physical bill."
        />

        <View style={styles.spacer} />

        <KButton 
          label="Check Bill" 
          onPress={handleInquiry} 
          disabled={accountId.length < 5}
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
});
