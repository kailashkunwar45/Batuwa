import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { KCard } from '../components/ui/KCard';
import { useAuthStore } from '../store/useAuthStore';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.name}>{user?.fullName || 'Kailash Kunwar'}</Text>
          <Text style={styles.email}>{user?.email || 'kailash@kkollection.com'}</Text>
        </View>

        <KCard variant="flat" style={styles.menuCard}>
          <MenuItem icon="👤" label="Personal Details" />
          <MenuItem 
            icon="🛡️" 
            label="KYC Verification" 
            subLabel={`Level ${user?.kycLevel || 0} ${user?.kycStatus || 'PENDING'}`} 
            onPress={() => navigation.navigate('KycSubmission')}
          />
          <MenuItem 
            icon="👨‍👩‍👧‍👦" 
            label="Family Batuwa" 
            subLabel="Manage shared wallets" 
            onPress={() => navigation.navigate('FamilyManagement')}
          />
          <MenuItem icon="🔒" label="Security & PIN" />
          <MenuItem icon="🔔" label="Notifications" />
        </KCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, subLabel, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>

      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subLabel && <Text style={styles.menuSubLabel}>{subLabel}</Text>}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { padding: THEME.spacing.md },
  header: { alignItems: 'center', marginVertical: THEME.spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.colors.surfaceLight, marginBottom: 12 },
  name: { color: THEME.colors.textPrimary, fontSize: 22, fontWeight: 'bold' },
  email: { color: THEME.colors.textSecondary, fontSize: 14 },
  menuCard: { marginTop: THEME.spacing.lg, padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: THEME.spacing.md, borderBottomWidth: 1, borderBottomColor: THEME.colors.border },
  menuIcon: { fontSize: 20 },
  menuLabel: { color: THEME.colors.textPrimary, fontSize: 16, fontWeight: '500' },
  menuSubLabel: { color: THEME.colors.accent, fontSize: 12, marginTop: 2 },
  arrow: { color: THEME.colors.textMuted, fontSize: 24 },
  logoutBtn: { marginTop: 40, padding: THEME.spacing.md, alignItems: 'center' },
  logoutText: { color: THEME.colors.error, fontSize: 16, fontWeight: '600' },
});
