import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  private client: MeiliSearch | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const enabled = this.config.get<boolean>('SEARCH_ENABLED', false);
    if (enabled) {
      this.client = new MeiliSearch({
        host: this.config.get<string>('MEILISEARCH_URL', 'http://localhost:7700'),
        apiKey: this.config.get<string>('MEILISEARCH_MASTER_KEY'),
      });
    }
  }

  async searchUsers(query: string, userId: string) {
    if (this.client) {
      // Future: Meilisearch logic
    }

    // Fallback: Prisma fuzzy search
    const results = await this.prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
        id: { not: userId }, // Don't search self
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        isPrivate: true,
        _count: { select: { followers: true } },
      },
      take: 20,
    });

    // Check if current user follows them
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, followingId: { in: results.map(r => r.id) } },
      select: { followingId: true },
    });
    const followingIds = new Set(following.map(f => f.followingId));

    return results.map(user => ({
      ...user,
      isFollowing: followingIds.has(user.id),
    }));
  }

  async search(query: string, userId: string) {
    return this.searchUsers(query, userId);
  }
}

