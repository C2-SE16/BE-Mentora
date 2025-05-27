import {
  Controller,
  Post,
  Get,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from '../decorators/userid.decorator';
import { CreateSearchHistoryDto } from '../dto/course.dto';

@Controller('elasticsearch')
export class ElasticsearchController {
  private readonly logger = new Logger(ElasticsearchController.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @UseGuards(JwtAuthGuard)
  @Post('search-history')
  async getUserSearchHistory(
    @UserId() userId: string,
    @Body() createSearchHistoryDto: CreateSearchHistoryDto,
  ) {
    try {
      return await this.elasticsearchService.saveSearchHistory(
        userId,
        createSearchHistoryDto.content,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to get search history', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('search-history')
  async getSearchHistory(@UserId() userId: string) {
    return await this.elasticsearchService.getSearchHistory(userId);
  }

  @Get('search-suggestions')
  @UseGuards(JwtAuthGuard)
  async getSearchSuggestions(
    @Query('query') query: string,
    @Query('limit') limit?: number,
    @UserId() userId?: string,
  ) {
    return await this.elasticsearchService.getSearchSuggestions(
      query,
      userId,
      limit,
    );
  }

  @Get('popular-searches')
  async getPopularSearches(@Query('limit') limit?: number) {
    return await this.elasticsearchService.getPopularSearches(limit);
  }

  @Post('recreate-index')
  async recreateIndex() {
    try {
      await this.elasticsearchService.deleteIndex();
      await this.elasticsearchService.createIndex();
      return {
        success: true,
        message: 'Index recreated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to recreate index',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync')
  async syncData() {
    try {
      await this.elasticsearchService.syncCoursesToElasticsearch();
      return {
        success: true,
        message: 'Courses synced to Elasticsearch successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync courses',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  async checkHealth() {
    try {
      const health = await this.elasticsearchService.checkClusterHealth();
      return { status: health.status, message: 'Elasticsearch is running' };
    } catch (error) {
      this.logger.error('Elasticsearch health check failed', error);
      return { status: 'red', message: 'Elasticsearch is not available' };
    }
  }

  @Delete('delete-index')
  async deleteIndex() {
    try {
      await this.elasticsearchService.deleteIndex();
      return { message: 'Courses index deleted successfully' };
    } catch (error) {
      this.logger.error('Failed to delete index', error);
      throw error;
    }
  }
}
