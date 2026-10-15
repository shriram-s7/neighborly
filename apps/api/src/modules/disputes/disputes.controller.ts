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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';
import {
  CreateDisputeDto,
  ResolveDisputeDto,
  Role,
  DisputeStatus,
} from '@neighborly/shared';

@ApiTags('Disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Raise a dispute on a booking' })
  async createDispute(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.createDispute(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all disputes (Admin only)' })
  async getAllDisputes(@Query('status') status?: DisputeStatus) {
    return this.disputesService.getAllDisputes(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details' })
  async getDispute(@Param('id') id: string) {
    return this.disputesService.getDispute(id);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Resolve a dispute (Refund, Release, or Split Escrow)' })
  async resolveDispute(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(adminId, id, dto);
  }
}
