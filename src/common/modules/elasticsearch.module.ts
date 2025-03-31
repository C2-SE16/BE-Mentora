import { Module } from '@nestjs/common';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '../services/elasticsearch.service';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}