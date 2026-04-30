import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, Delete, ArrowLeft } from 'lucide-react-native';

export default function SetupPinScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: set, 2: confirm
  const [isLoading, setIsLoading] = useState(false);
  const { fetchMe } = useAuthStore();

  const handleNumberPress = (num: number) => {
    if (step === 1) {
      if (pin.length < 4) setPin(prev => prev + num);
    } else {
      if (confirmPin.length < 4) setConfirmPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (step === 1) {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const nextStep = () => {
    if (pin.length === 4) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      setConfirmPin('');
      setStep(1);
      setPin('');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/users/me/pin', { pin });
      await fetchMe();
      Alert.alert('Success', 'Your Secure MPIN has been set!', [
        { text: 'Awesome', onPress: () => navigation.replace('Main') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to set MPIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (step === 1 && pin.length === 4) {
      setTimeout(() => setStep(2), 300);
    } else if (step === 2 && confirmPin.length === 4) {
      handleSubmit();
    }
  }, [pin, confirmPin]);

  const renderDots = (value: string) => {
    return (
      <View style={styles.dotsContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              value.length >= i ? styles.dotActive : null
            ]} 
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={THEME.colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldCheck color={THEME.colors.primary} size={48} />
        </View>

        <Text style={styles.title}>
          {step === 1 ? 'Create Secure MPIN' : 'Confirm Your MPIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? 'Set a 4-digit PIN to secure your transactions' 
            : 'Enter the PIN again to confirm'}
        </Text>

        {renderDots(step === 1 ? pin : confirmPin)}

        {isLoading && <ActivityIndicator color={THEME.colors.primary} style={{ marginTop: 20 }} />}
      </View>

      <View style={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity 
            key={num} 
            style={styles.numBtn} 
            onPress={() => handleNumberPress(num)}
          >
            <Text style={styles.numText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.numBtn} />
        <TouchableOpacity style={styles.numBtn} onPress={() => handleNumberPress(0)}>
          <Text style={styles.numText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.numBtn} onPress={handleDelete}>
          <Delete color={THEME.colors.textPrimary} size={24} />
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
  header: {
    padding: 20,
  },
  content: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  numBtn: {
    width: '30%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 28,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
});
