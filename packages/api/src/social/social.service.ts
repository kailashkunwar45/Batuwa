import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostType, FollowRequestStatus } from '@prisma/client';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPost(userId: string, data: { content: string; imageUrl?: string; type?: PostType }) {
    return this.prisma.post.create({
      data: {
        authorId: userId,
        content: data.content,
        imageUrl: data.imageUrl,
        type: data.type || PostType.USER_POST,
      },
      include: { author: { select: { fullName: true, avatarUrl: true } } },
    });
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get IDs of people the user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Feed includes: posts from followed users, your own posts, and system announcements
    // We also include financial tips from ANY user if they are public
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          OR: [
            { authorId: { in: [...followingIds, userId] } },
            { type: PostType.SYSTEM_ANNOUNCEMENT },
            { AND: [{ type: PostType.FINANCIAL_TIP }, { author: { isPrivate: false } }] },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true, role: true, isPrivate: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({
        where: {
          OR: [
            { authorId: { in: [...followingIds, userId] } },
            { type: PostType.SYSTEM_ANNOUNCEMENT },
            { AND: [{ type: PostType.FINANCIAL_TIP }, { author: { isPrivate: false } }] },
          ],
        },
      }),
    ]);

    // Check if user liked these posts
    const postIds = items.map(i => i.id);
    const userLikes = await this.prisma.like.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true }
    });
    const likedPostIds = new Set(userLikes.map(l => l.postId));

    return {
      items: items.map(item => ({
        ...item,
        isLiked: likedPostIds.has(item.id)
      })),
      total,
      page,
      limit
    };
  }

  async likePost(userId: string, postId: string) {
    // Check if post is accessible
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: { isPrivate: true } } }
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.author.isPrivate && post.authorId !== userId) {
      const isFollowing = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: post.authorId } }
      });
      if (!isFollowing) throw new BadRequestException('You must follow this user to like their posts');
    }

    return this.prisma.like.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
  }

  async unlikePost(userId: string, postId: string) {
    return this.prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    }).catch(() => null);
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException('You cannot follow yourself');
    
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
      select: { isPrivate: true },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    if (targetUser.isPrivate) {
      return this.prisma.followRequest.upsert({
        where: { senderId_receiverId: { senderId: followerId, receiverId: followingId } },
        create: { senderId: followerId, receiverId: followingId, status: FollowRequestStatus.PENDING },
        update: { status: FollowRequestStatus.PENDING },
      });
    }

    return this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.followRequest.findMany({
      where: { receiverId: userId, status: FollowRequestStatus.PENDING },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async acceptFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: request.senderId, followingId: request.receiverId } },
      create: { followerId: request.senderId, followingId: request.receiverId },
      update: {},
    });

    return this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: FollowRequestStatus.ACCEPTED },
    });
  }

  async rejectFollowRequest(requestId: string, userId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    return this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: FollowRequestStatus.REJECTED },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    }).catch(() => null);
  }

  async addComment(userId: string, postId: string, content: string) {
    return this.prisma.comment.create({
      data: { userId, postId, content },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
  }

  async getPostComments(postId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.comment.findMany({
      where: { postId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
  }
}

