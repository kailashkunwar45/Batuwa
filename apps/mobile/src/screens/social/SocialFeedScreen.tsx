import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KCard } from '../../components/ui/KCard';
import { Heart, MessageCircle, Share2, MoreHorizontal, PlusCircle } from 'lucide-react-native';
import { useSocialStore } from '../../store/useSocialStore';
import { BatuwaLogo } from '../../components/ui/BatuwaLogo';

export default function SocialFeedScreen() {
  const { feed, isLoading, fetchFeed, likePost } = useSocialStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ transform: [{ scale: 0.6 }], marginRight: -10 }}>
            <BatuwaLogo size={32} />
          </View>
          <Text style={styles.headerTitle}>Batuwa Social</Text>
        </View>
        <TouchableOpacity style={styles.postBtn}>
          <PlusCircle size={24} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
        renderItem={({ item }) => (
          <KCard variant="flat" style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                {item.author.avatarUrl ? (
                  <Image source={{ uri: item.author.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder} />
                )}
                <View>
                  <Text style={styles.authorName}>{item.author.fullName}</Text>
                  <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MoreHorizontal size={20} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{item.content}</Text>

            <View style={styles.postFooter}>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => likePost(item.id)}
                >
                  <Heart 
                    size={20} 
                    color={item.isLiked ? THEME.colors.danger : THEME.colors.textSecondary} 
                    fill={item.isLiked ? THEME.colors.danger : 'transparent'}
                  />
                  <Text style={[styles.actionText, item.isLiked && { color: THEME.colors.danger }]}>
                    {item._count.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <MessageCircle size={20} color={THEME.colors.textSecondary} />
                  <Text style={styles.actionText}>{item._count.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Share2 size={20} color={THEME.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </KCard>
        )}
        ListEmptyComponent={
          !isLoading && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: THEME.colors.textSecondary }}>No posts yet. Start following people!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginLeft: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  postBtn: {
    padding: 4,
  },
  listContent: {
    padding: THEME.spacing.md,
  },
  postCard: {
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceLight,
    marginRight: THEME.spacing.sm,
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  postTime: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: THEME.spacing.lg,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
});
