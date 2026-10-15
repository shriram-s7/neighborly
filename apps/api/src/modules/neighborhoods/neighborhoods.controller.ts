import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NeighborhoodsService } from './neighborhoods.service';

@ApiTags('neighborhoods')
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all neighborhoods with activity counts' })
  @ApiResponse({ status: 200, description: 'List of neighborhoods' })
  async findAll() {
    return this.neighborhoodsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get neighborhood details by ID' })
  async findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findOne(id);
  }
}
