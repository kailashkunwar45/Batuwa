import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { FollowRequestStatus } from '@prisma/client';

describe('SocialService', () => {
  let service: SocialService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    follow: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    followRequest: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('followUser', () => {
    it('should create a direct follow if user is public', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isPrivate: false });
      
      await service.followUser('u1', 'u2');
      
      expect(mockPrisma.follow.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { followerId_followingId: { followerId: 'u1', followingId: 'u2' } }
        })
      );
    });

    it('should create a follow request if user is private', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ isPrivate: true });
      
      await service.followUser('u1', 'u2');
      
      expect(mockPrisma.followRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ status: FollowRequestStatus.PENDING })
        })
      );
    });
  });

  describe('acceptFollowRequest', () => {
    it('should create follow record and update request status', async () => {
      const mockRequest = { id: 'r1', senderId: 's1', receiverId: 'r1_user' };
      mockPrisma.followRequest.findUnique.mockResolvedValue(mockRequest);

      await service.acceptFollowRequest('r1', 'r1_user');

      expect(mockPrisma.follow.upsert).toHaveBeenCalled();
      expect(mockPrisma.followRequest.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: FollowRequestStatus.ACCEPTED }
      });
    });
  });
});
