import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, TransitionBookingDto, JwtPayload, Role } from '@neighborly/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service booking with immediate escrow hold' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.sub, dto);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings as requester or provider' })
  async getMyBookings(
    @CurrentUser() user: JwtPayload,
    @Query('roleTab') roleTab?: 'requester' | 'provider',
  ) {
    return this.bookingsService.getMyBookings(user.sub, roleTab);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full booking details, status timeline, and chat' })
  async getBooking(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bookingsService.getBooking(id, user.sub);
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Transition booking to next state with state-machine validation' })
  async transition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: TransitionBookingDto,
  ) {
    return this.bookingsService.transitionBooking(user.sub, user.role, id, dto);
  }

  @Post('admin/fast-forward')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Admin Demo: Fast-forward 48-hour escrow auto-release time' })
  async fastForward(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.fastForwardAutoRelease(user.sub);
  }
}
