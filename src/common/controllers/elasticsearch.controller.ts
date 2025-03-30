import {
  Controller,
  Post,
  Get,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ElasticsearchService } from '../services/elasticsearch.service';

@Controller('elasticsearch')
export class ElasticsearchController {
  private readonly logger = new Logger(ElasticsearchController.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

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
