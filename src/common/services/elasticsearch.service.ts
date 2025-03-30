import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SearchCourseDto } from '../dto/search-course.dto';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly indexName = 'courses';

  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
    private readonly prismaService: PrismaService,
  ) {
    this.createIndex();
  }

  async onModuleInit() {
    try {
      await this.createIndex();
      await this.syncCoursesToElasticsearch();
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch', error);
    }
  }

  async createIndex() {
    const exists = await this.elasticsearchService.indices.exists({
      index: this.indexName,
    });

    if (!exists) {
      await this.elasticsearchService.indices.create({
        index: this.indexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                flexible_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'word_delimiter_graph', // Xử lý các khoảng trắng, dấu gạch ngang, v.v.
                    'asciifolding', // Xử lý dấu
                  ],
                  char_filter: ['whitespace_remover'],
                },
              },
              char_filter: {
                whitespace_remover: {
                  type: 'pattern_replace',
                  pattern: '([a-zA-Z0-9])(\\s+)([a-zA-Z0-9])', // Khoảng trắng giữa chữ và số
                  replacement: '$1$3', // Loại bỏ khoảng trắng
                },
              },
            },
          },
          mappings: {
            properties: {
              courseId: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'flexible_analyzer',
                search_analyzer: 'flexible_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'flexible_analyzer',
              },
              overview: {
                type: 'text',
                analyzer: 'flexible_analyzer',
              },
              price: { type: 'float' },
              rating: { type: 'float' },
              isBestSeller: { type: 'boolean' },
              isRecommended: { type: 'boolean' },
              categories: { type: 'keyword' },
              instructor: { type: 'text' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });
      this.logger.log(`Index ${this.indexName} created with flexible_analyzer`);
    }
  }

  async syncCoursesToElasticsearch() {
    try {
      const courses = await this.prismaService.tbl_courses.findMany({
        include: {
          tbl_instructors: true,
          tbl_course_categories: {
            include: {
              tbl_categories: true,
            },
          },
        },
      });

      if (courses.length === 0) {
        this.logger.log('No courses found to sync');
        return;
      }

      const operations = courses.flatMap((course) => [
        { index: { _index: this.indexName, _id: course.courseId } },
        {
          courseId: course.courseId,
          title: course.title,
          description: course.description,
          overview: course.overview,
          price: course.price ? parseFloat(course.price.toString()) : null,
          rating: course.rating ? parseFloat(course.rating.toString()) : null,
          isBestSeller: course.isBestSeller,
          isRecommended: course.isRecommended,
          categories: course.tbl_course_categories.map((cc) => cc.categoryId),
          instructor: course.tbl_instructors?.userId,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        },
      ]);

      const response = await this.elasticsearchService.bulk({
        body: operations,
      });

      if (response.errors) {
        this.logger.error('Errors during bulk indexing', response.items);
      } else {
        this.logger.log(`Indexed ${courses.length} courses successfully`);
      }
    } catch (error) {
      this.logger.error('Failed to sync courses to Elasticsearch', error);
      throw error;
    }
  }

  async searchCourses(searchDto: SearchCourseDto) {
    const { query = '', page = 1, limit = 10 } = searchDto;

    const from = (page - 1) * limit;
    const mustClauses: any[] = [];
    const shouldClauses: any[] = [];
    console.log('query::', query);
    if (query) {
      // Tạo các biến thể của query: một có khoảng trắng, một không có
      // Ví dụ: "machine learning" -> ["machine learning", "machinelearning"]
      const queryWithSpaces = query.trim();
      const queryWithoutSpaces = queryWithSpaces.replace(/\s+/g, '');

      // Thêm cả hai biến thể vào tìm kiếm với boost khác nhau
      shouldClauses.push(
        // Exact match với boost cao nhất
        {
          term: {
            'title.keyword': {
              value: queryWithSpaces,
              boost: 15.0,
            },
          },
        },
        // Match phrase cho trường hợp có khoảng trắng
        {
          match_phrase: {
            title: {
              query: queryWithSpaces,
              boost: 8.0,
              slop: 1,
            },
          },
        },
        // Match với biến thể không có khoảng trắng
        {
          match: {
            title: {
              query: queryWithoutSpaces,
              boost: 6.0,
            },
          },
        },
        // Fuzzy match cho phép lỗi chính tả
        {
          match: {
            title: {
              query: queryWithSpaces,
              fuzziness: 'AUTO',
              boost: 4.0,
            },
          },
        },
        // Multi-match trên nhiều trường
        {
          multi_match: {
            query: queryWithSpaces,
            fields: ['title^3', 'description^2', 'overview'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            boost: 2.0,
          },
        },
      );
    }

    // Xây dựng truy vấn tổng thể
    let queryBody: any = {
      bool: {},
    };

    if (shouldClauses.length > 0) {
      queryBody.bool.should = shouldClauses;
      queryBody.bool.minimum_should_match = 1;
    }

    if (mustClauses.length > 0) {
      queryBody.bool.must = mustClauses;
    }

    let sortConfig: any[] = [];

    try {
      const { hits } = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          query: queryBody,
          sort: sortConfig,
          from,
          size: limit,
        },
      });

      const total =
        typeof hits.total === 'number' ? hits.total : hits.total?.value || 0;

      return {
        total,
        results: hits.hits.map((hit) => ({
          ...(hit._source as object),
          score: hit._score,
        })),
      };
    } catch (error) {
      this.logger.error('Error searching courses', error);
      throw error;
    }
  }

  async indexCourse(course: any) {
    try {
      await this.elasticsearchService.index({
        index: this.indexName,
        id: course.courseId,
        body: {
          courseId: course.courseId,
          title: course.title,
          description: course.description,
          overview: course.overview,
          price: course.price ? parseFloat(course.price.toString()) : null,
          rating: course.rating ? parseFloat(course.rating.toString()) : null,
          isBestSeller: course.isBestSeller,
          isRecommended: course.isRecommended,
          categories:
            course.tbl_course_categories?.map((cc) => cc.categoryId) || [],
          instructor: course.tbl_instructors?.userId,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        },
      });
      this.logger.log(`Course ${course.courseId} indexed successfully`);
    } catch (error) {
      this.logger.error(`Failed to index course ${course.courseId}`, error);
      throw error;
    }
  }

  async removeCourse(courseId: string) {
    try {
      await this.elasticsearchService.delete({
        index: this.indexName,
        id: courseId,
      });
      this.logger.log(`Course ${courseId} removed from index`);
    } catch (error) {
      this.logger.error(
        `Failed to remove course ${courseId} from index`,
        error,
      );
      throw error;
    }
  }

  async checkClusterHealth() {
    return this.elasticsearchService.cluster.health();
  }

  async deleteIndex(indexName: string = this.indexName) {
    return this.elasticsearchService.indices.delete({
      index: indexName,
    });
  }
}
