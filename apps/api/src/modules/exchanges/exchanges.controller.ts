import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExchangesService } from './exchanges.service';
import { ProposeExchangeDto } from '@neighborly/shared';

@ApiTags('Skill Exchanges / Barter')
@Controller('exchanges')
export class ExchangesController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Get('board')
  @ApiOperation({ summary: 'Browse all listings that accept barter' })
  async getBarterListings(
    @Query('neighborhoodId') neighborhoodId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.exchangesService.getBarterListings(neighborhoodId, categoryId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propose a skill exchange swap' })
  async proposeExchange(
    @CurrentUser('sub') userId: string,
    @Body() dto: ProposeExchangeDto,
  ) {
    return this.exchangesService.proposeExchange(userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user skill exchanges (proposed & received)' })
  async getMyExchanges(@CurrentUser('sub') userId: string) {
    return this.exchangesService.getMyExchanges(userId);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or decline a proposed barter exchange' })
  async respondExchange(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() body: { accept: boolean },
  ) {
    return this.exchangesService.respondExchange(userId, id, body.accept);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm completion of skill swap (earns 5 credits)' })
  async confirmExchange(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.exchangesService.confirmExchange(userId, id);
  }
}
