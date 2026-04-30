import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';
import { PostType } from '@prisma/client';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get community feed' })
  getFeed(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.socialService.getFeed(req.user.id, +page, +limit);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  createPost(@Request() req: any, @Body() body: { content: string; imageUrl?: string; type?: PostType }) {
    return this.socialService.createPost(req.user.id, body);
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Like a post' })
  like(@Request() req: any, @Param('id') id: string) {
    return this.socialService.likePost(req.user.id, id);
  }

  @Delete('posts/:id/like')
  @ApiOperation({ summary: 'Unlike a post' })
  unlike(@Request() req: any, @Param('id') id: string) {
    return this.socialService.unlikePost(req.user.id, id);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add a comment' })
  addComment(@Request() req: any, @Param('id') id: string, @Body() body: { content: string }) {
    return this.socialService.addComment(req.user.id, id, body.content);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Get post comments' })
  getComments(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.socialService.getPostComments(id, +page, +limit);
  }

  // ── FOLLOW SYSTEM ───────────────────────────────────────────

  @Post('follow/:userId')
  @ApiOperation({ summary: 'Follow a user or send request if private' })
  follow(@Request() req: any, @Param('userId') userId: string) {
    return this.socialService.followUser(req.user.id, userId);
  }

  @Delete('follow/:userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@Request() req: any, @Param('userId') userId: string) {
    return this.socialService.unfollowUser(req.user.id, userId);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get pending follow requests' })
  getRequests(@Request() req: any) {
    return this.socialService.getPendingRequests(req.user.id);
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Accept a follow request' })
  acceptRequest(@Request() req: any, @Param('id') id: string) {
    return this.socialService.acceptFollowRequest(id, req.user.id);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject a follow request' })
  rejectRequest(@Request() req: any, @Param('id') id: string) {
    return this.socialService.rejectFollowRequest(id, req.user.id);
  }
}

