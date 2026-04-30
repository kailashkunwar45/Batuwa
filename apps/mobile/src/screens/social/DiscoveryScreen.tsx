import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { Search, UserPlus, Check } from 'lucide-react-native';

const MOCK_USERS = [
  { id: '1', name: 'Pranish Shrestha', followers: 124, isFollowing: false },
  { id: '2', name: 'Sita Sharma', followers: 89, isFollowing: true },
  { id: '3', name: 'Rohan Devkota', followers: 56, isFollowing: false },
];

export default function DiscoveryScreen() {
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={THEME.colors.textSecondary} />
          <TextInput
            placeholder="Search friends, merchants..."
            placeholderTextColor={THEME.colors.textSecondary}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <FlatList
          data={MOCK_USERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KCard variant="flat" style={styles.userCard}>
              <View style={styles.avatarPlaceholder} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userStats}>{item.followers} followers</Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.followBtn, 
                  item.isFollowing && { backgroundColor: THEME.colors.surfaceLight }
                ]}
              >
                {item.isFollowing ? (
                  <Check size={18} color={THEME.colors.textSecondary} />
                ) : (
                  <UserPlus size={18} color="#FFF" />
                )}
                <Text style={[styles.followText, item.isFollowing && { color: THEME.colors.textSecondary }]}>
                  {item.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </KCard>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  searchContainer: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.sm,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: THEME.colors.textPrimary,
    fontSize: 15,
  },
  section: {
    padding: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surfaceLight,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  userStats: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
  },
  followText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
