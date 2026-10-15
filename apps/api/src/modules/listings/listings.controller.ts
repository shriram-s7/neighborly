import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto, JwtPayload } from '@neighborly/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter active marketplace listings with distance' })
  @ApiResponse({ status: 200, description: 'List of matching listings' })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('neighborhoodId') neighborhoodId?: string,
    @Query('search') search?: string,
    @Query('barterOnly') barterOnly?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('sortBy') sortBy?: 'distance' | 'trustScore' | 'priceAsc' | 'priceDesc' | 'rating',
  ) {
    return this.listingsService.findAll({
      categoryId,
      neighborhoodId,
      search,
      barterOnly: barterOnly === 'true',
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      sortBy,
    });
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all listings created by the authenticated provider' })
  async findMyListings(@CurrentUser() user: JwtPayload) {
    return this.listingsService.findMyListings(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full service listing details by ID' })
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service listing' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing details' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: Partial<CreateListingDto>,
  ) {
    return this.listingsService.update(user.sub, id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle active status of a listing' })
  async toggleActive(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.listingsService.toggleActive(user.sub, id, body.isActive);
  }
}
