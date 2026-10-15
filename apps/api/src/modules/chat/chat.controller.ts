import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@neighborly/shared';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get or create conversation for a booking' })
  async getBookingConversation(@Param('bookingId') bookingId: string) {
    return this.chatService.getOrCreateBookingConversation(bookingId);
  }

  @Post('message')
  @ApiOperation({ summary: 'Send message in conversation via REST' })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: { conversationId: string; body: string },
  ) {
    return this.chatService.sendMessage(user.sub, body.conversationId, body.body);
  }
}
