import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload, TopupWalletDto } from '@neighborly/shared';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user wallet balance, held escrow, credits, and ledger history' })
  async getMyWallet(@CurrentUser() user: JwtPayload) {
    return this.walletService.getWallet(user.sub);
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Top up wallet balance (simulated payment)' })
  async topup(@CurrentUser() user: JwtPayload, @Body() dto: TopupWalletDto) {
    return this.walletService.topup(user.sub, dto.amount);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify double-entry escrow invariant' })
  @ApiResponse({ status: 200, description: 'Ledger mathematical verification report' })
  async verifyLedger() {
    return this.walletService.verifyLedger();
  }
}
