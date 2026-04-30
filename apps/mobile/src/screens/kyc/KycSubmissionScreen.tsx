import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { Camera, FileText, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react-native';
import { useKycStore } from '../../store/useKycStore';

export default function KycSubmissionScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const { isLoading, submitL1, submitL2 } = useKycStore();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    citizenshipNo: '',
    dob: '1995-01-01',
    address: 'Kathmandu, Nepal',
  });

  const handleL1Submit = async () => {
    await submitL1({ fullName: formData.fullName, phone: formData.phone });
    setStep(2);
  };

  const handleL2Submit = async () => {
    await submitL2({
      ...formData,
      dob: new Date(formData.dob),
      citizenshipFrontUrl: 'https://via.placeholder.com/600x400?text=Citizenship+Front',
      citizenshipBackUrl: 'https://via.placeholder.com/600x400?text=Citizenship+Back',
      selfieUrl: 'https://via.placeholder.com/400x400?text=Selfie',
    });
    setStep(3);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Verification (L1)</Text>
      <Text style={styles.stepSubtitle}>Required to increase your daily limit to Rs. 10,000</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Full Name (as per documents)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="John Doe" 
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.fullName}
          onChangeText={(val) => setFormData({ ...formData, fullName: val })}
        />
        
        <Text style={styles.label}>Phone Number</Text>
        <TextInput 
          style={styles.input} 
          placeholder="+977-XXXXXXXXXX" 
          placeholderTextColor={THEME.colors.textSecondary} 
          value={formData.phone}
          onChangeText={(val) => setFormData({ ...formData, phone: val })}
        />
      </View>

      <TouchableOpacity 
        style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]} 
        onPress={handleL1Submit}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 size={24} color="#FFF" style={styles.spinner} /> : <Text style={styles.btnText}>Continue to Level 2</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Identity Documents (L2)</Text>
      <Text style={styles.stepSubtitle}>Required for full account access and Rs. 5,00,000 limit</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Citizenship / Passport Number</Text>
        <TextInput 
          style={styles.input} 
          placeholder="123-456-789" 
          placeholderTextColor={THEME.colors.textSecondary}
          value={formData.citizenshipNo}
          onChangeText={(val) => setFormData({ ...formData, citizenshipNo: val })}
        />
      </View>

      <KCard variant="elevated" style={styles.uploadCard}>
        <FileText size={32} color={THEME.colors.primary} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.uploadTitle}>Citizenship / Passport</Text>
          <Text style={styles.uploadSubtitle}>Upload front and back images</Text>
        </View>
        <TouchableOpacity style={styles.uploadBtn}>
          <Camera size={20} color="#FFF" />
        </TouchableOpacity>
      </KCard>

      <KCard variant="elevated" style={styles.uploadCard}>
        <Camera size={32} color={THEME.colors.primary} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.uploadTitle}>Selfie Verification</Text>
          <Text style={styles.uploadSubtitle}>Take a clear photo of your face</Text>
        </View>
        <TouchableOpacity style={styles.uploadBtn}>
          <Camera size={20} color="#FFF" />
        </TouchableOpacity>
      </KCard>

      <TouchableOpacity 
        style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]} 
        onPress={handleL2Submit}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 size={24} color="#FFF" style={styles.spinner} /> : <Text style={styles.btnText}>Submit for Review</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <CheckCircle2 size={80} color={THEME.colors.success} />
      <Text style={styles.successTitle}>Submitted Successfully!</Text>
      <Text style={styles.successSubtitle}>
        Our AI and compliance team will review your documents within 24 hours.
      </Text>
      <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.outlineBtnText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressItem, step >= 1 && styles.progressActive]} />
          <View style={[styles.progressItem, step >= 2 && styles.progressActive]} />
          <View style={[styles.progressItem, step >= 3 && styles.progressActive]} />
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderSuccess()}
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xl,
  },
  progressItem: {
    flex: 1,
    height: 4,
    backgroundColor: THEME.colors.surfaceLight,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: THEME.colors.primary,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xl,
  },
  form: {
    marginBottom: THEME.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.radius.md,
    height: 52,
    paddingHorizontal: THEME.spacing.md,
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.lg,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  uploadBtn: {
    width: 44,
    height: 44,
    backgroundColor: THEME.colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.lg,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: THEME.spacing.xl,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    height: 52,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: THEME.colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  spinner: {
    // Add any specific spinner styles if needed, though Loader2 usually handles it
  },
});
