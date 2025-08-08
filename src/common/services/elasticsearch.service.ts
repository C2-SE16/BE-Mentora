import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SearchCourseDto } from '../dto/search-course.dto';
import {
  SearchHistoryDocument,
  SearchStatsDocument,
} from '../interfaces/course.interface';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly indexName = 'courses';
  private readonly historyIndexName = 'search-history';
  private readonly statsIndexName = 'search-stats';

  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
    private readonly prismaService: PrismaService,
  ) {
    this.createIndices();
  }

  async onModuleInit() {
    try {
      await this.createIndices();
      await this.syncCoursesToElasticsearch();
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch', error);
    }
  }

  async createIndices() {
    await this.createIndex();
    await this.createSearchHistoryIndex();
    await this.createSearchStatsIndex();
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

  async searchCourses(searchDto: SearchCourseDto, userId?: string) {
    const { query = '', page = 1, limit = 10 } = searchDto;

    if (userId && query.trim()) {
      try {
        await this.saveSearchHistory(userId, query.trim());
      } catch (error) {
        this.logger.error('Failed to save search history', error);
      }
    }

    const from = (page - 1) * limit;
    const mustClauses: any[] = [];
    const shouldClauses: any[] = [];

    if (query) {
      const queryWithSpaces = query.trim();
      const queryWithoutSpaces = queryWithSpaces.replace(/\s+/g, '');

      const queryTerms = queryWithSpaces
        .split(/\s+/)
        .filter((term) => term.length > 1);

      if (queryTerms.length > 0) {
        queryTerms.forEach((term) => {
          shouldClauses.push(
            {
              match: {
                title: {
                  query: term,
                  boost: 2.0,
                  operator: 'or',
                },
              },
            },
            {
              match: {
                description: {
                  query: term,
                  boost: 1.0,
                  operator: 'or',
                },
              },
            },
          );
        });
      }

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
              slop: 2,
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
              operator: 'or',
            },
          },
        },
        // Multi-match trên nhiều trường
        {
          multi_match: {
            query: queryWithSpaces,
            fields: ['title^3', 'description^2', 'overview'],
            type: 'cross_fields',
            operator: 'or',
            boost: 2.0,
          },
        },
        {
          multi_match: {
            query: queryWithSpaces,
            fields: ['title^2', 'description', 'overview'],
            type: 'best_fields',
            operator: 'or',
            fuzziness: 'AUTO',
            boost: 1.5,
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
      queryBody.bool.minimum_should_match = 1; // Giữ nguyên 1
    }

    if (mustClauses.length > 0) {
      queryBody.bool.must = mustClauses;
    }

    if (
      searchDto.categoryId ||
      searchDto.minPrice !== undefined ||
      searchDto.maxPrice !== undefined ||
      searchDto.minRating !== undefined ||
      searchDto.isBestSeller !== undefined ||
      searchDto.isRecommended !== undefined
    ) {
      queryBody.bool.filter = [];

      if (searchDto.categoryId) {
        queryBody.bool.filter.push({
          term: { categories: searchDto.categoryId },
        });
      }

      if (
        searchDto.minPrice !== undefined ||
        searchDto.maxPrice !== undefined
      ) {
        const rangeFilter: any = { range: { price: {} } };
        if (searchDto.minPrice !== undefined)
          rangeFilter.range.price.gte = searchDto.minPrice;
        if (searchDto.maxPrice !== undefined)
          rangeFilter.range.price.lte = searchDto.maxPrice;
        queryBody.bool.filter.push(rangeFilter);
      }

      if (searchDto.minRating !== undefined) {
        queryBody.bool.filter.push({
          range: { rating: { gte: searchDto.minRating } },
        });
      }

      if (searchDto.isBestSeller !== undefined) {
        queryBody.bool.filter.push({
          term: { isBestSeller: searchDto.isBestSeller },
        });
      }

      if (searchDto.isRecommended !== undefined) {
        queryBody.bool.filter.push({
          term: { isRecommended: searchDto.isRecommended },
        });
      }
    }

    let sortConfig: any[] = [];

    // Thêm sắp xếp
    if (searchDto.sortBy) {
      sortConfig.push({
        [searchDto.sortBy]: { order: searchDto.sortOrder || 'desc' },
      });
    }

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
          instructorName: course.tbl_instructors?.instructorName,
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

  async checkClusterHealth() {
    return this.elasticsearchService.cluster.health();
  }

  async deleteIndex(indexName: string = this.indexName) {
    return this.elasticsearchService.indices.delete({
      index: indexName,
    });
  }

  async saveSearchHistory(userId: string, content: string) {
    try {
      const normalizedContent = content.trim().replace(/\s+/g, ' ');

      const searchResponse = await this.elasticsearchService.search({
        index: this.historyIndexName,
        body: {
          query: {
            bool: {
              must: [
                { term: { userId } },
                { match: { 'content.keyword': normalizedContent } },
              ],
            },
          },
        },
      });

      const totalHits =
        typeof searchResponse.hits.total === 'number'
          ? searchResponse.hits.total
          : searchResponse.hits.total?.value || 0;

      if (totalHits > 0) {
        const existingDoc = searchResponse.hits.hits[0];
        const currentCount =
          (existingDoc._source as SearchHistoryDocument).searchCount || 0;

        await this.elasticsearchService.update({
          index: this.historyIndexName,
          id: existingDoc._id || '',
          body: {
            doc: {
              searchCount: currentCount + 1,
              updatedAt: new Date(),
            },
          },
          refresh: true,
        });
      } else {
        const document: SearchHistoryDocument = {
          userId,
          content: normalizedContent,
          searchCount: 1,
          updatedAt: new Date(),
        };

        await this.elasticsearchService.index({
          index: this.historyIndexName,
          body: document,
          refresh: true,
        });
      }

      const statsResponse = await this.elasticsearchService.search({
        index: this.statsIndexName,
        body: {
          query: {
            match: { 'content.keyword': normalizedContent },
          },
          size: 1,
        },
      });

      const statsHits =
        typeof statsResponse.hits.total === 'number'
          ? statsResponse.hits.total
          : statsResponse.hits.total?.value || 0;

      if (statsHits > 0) {
        const existingStats = statsResponse.hits.hits[0];
        const currentTotalCount =
          (existingStats._source as SearchStatsDocument).totalSearchCount || 0;

        await this.elasticsearchService.update({
          index: this.statsIndexName,
          id: existingStats._id || '',
          body: {
            doc: {
              totalSearchCount: currentTotalCount + 1,
              updatedAt: new Date(),
            },
          },
        });
      } else {
        await this.elasticsearchService.index({
          index: this.statsIndexName,
          body: {
            content: normalizedContent,
            totalSearchCount: 1,
            updatedAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to save search history:', error);
      throw error;
    }
  }

  async getSearchHistory(userId: string) {
    try {
      const userSearchResponse = await this.elasticsearchService.search({
        index: this.historyIndexName,
        body: {
          query: {
            term: { userId: userId },
          },
          sort: [
            { searchCount: { order: 'desc' } },
            { updatedAt: { order: 'desc' } },
          ],
          size: 10,
        },
      });

      const histories = userSearchResponse.hits.hits.map((hit) => {
        const source = hit._source as SearchHistoryDocument;
        return {
          id: hit._id,
          content: source.content,
          searchCount: source.searchCount,
          personal: true,
        };
      });

      return { histories };
    } catch (error) {
      this.logger.error('Failed to get search history:', error);
      throw error;
    }
  }

  async deleteSearchHistory(userId: string, historyId?: string) {
    try {
      if (historyId) {
        // Xác thực rằng bản ghi thuộc về người dùng
        const verifyResponse = await this.elasticsearchService.search({
          index: this.historyIndexName,
          body: {
            query: {
              bool: {
                must: [{ term: { userId } }, { ids: { values: [historyId] } }],
              },
            },
          },
        });

        if (verifyResponse.hits.hits.length === 0) {
          return {
            success: false,
            message: 'Search history item not found or does not belong to user',
          };
        }

        // Xóa bản ghi cụ thể
        await this.elasticsearchService.delete({
          index: this.historyIndexName,
          id: historyId,
          refresh: true,
        });

        return {
          success: true,
          message: 'Search history item deleted successfully',
        };
      } else {
        // Xóa tất cả lịch sử tìm kiếm của người dùng
        await this.elasticsearchService.deleteByQuery({
          index: this.historyIndexName,
          body: {
            query: {
              term: { userId: userId },
            },
          },
          refresh: true,
        });

        return {
          success: true,
          message: 'All search history deleted successfully',
        };
      }
    } catch (error) {
      this.logger.error('Failed to delete search history:', error);
      throw error;
    }
  }

  async getSearchSuggestions(
    query: string,
    userId?: string,
    limit: number = 5,
  ) {
    try {
      if (!query) {
        return {
          suggestions: [],
        };
      }
      const normalizedQuery = query.trim().toLowerCase();
      const suggestions = new Map<
        string,
        { content: string; type: string; score: number }
      >();
      const coursesResponse = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              should: [
                {
                  prefix: {
                    title: {
                      value: normalizedQuery,
                      boost: 10.0,
                    },
                  },
                },
                {
                  match_phrase_prefix: {
                    title: {
                      query: normalizedQuery,
                      boost: 5.0,
                      max_expansions: 10,
                    },
                  },
                },
                {
                  wildcard: {
                    title: {
                      value: `*${normalizedQuery}*`,
                      boost: 2.0,
                    },
                  },
                },
                {
                  match: {
                    description: {
                      query: normalizedQuery,
                      boost: 1.0,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
          _source: ['title'],
          size: limit * 2,
          highlight: {
            fields: {
              title: {
                pre_tags: [''],
                post_tags: [''],
                fragment_size: 100,
                number_of_fragments: 1,
              },
            },
          },
        },
      });
      
      coursesResponse.hits.hits.forEach((hit) => {
        const source = hit._source as any;
        const score = hit._score || 0;

        if (source.title) {
          const title = (hit.highlight?.title?.[0] || source.title) as string;
          suggestions.set(title.toLowerCase(), {
            content: title,
            type: 'course',
            score,
          });
        }
      });

      if (userId && suggestions.size < limit * 2) {
        const userHistoryResponse = await this.elasticsearchService.search({
          index: this.historyIndexName,
          body: {
            query: {
              bool: {
                must: [
                  { term: { userId } },
                  {
                    bool: {
                      should: [
                        {
                          prefix: {
                            content: {
                              value: normalizedQuery,
                              boost: 8.0,
                            },
                          },
                        },
                        {
                          match_phrase_prefix: {
                            content: {
                              query: normalizedQuery,
                              boost: 4.0,
                            },
                          },
                        },
                        {
                          wildcard: {
                            content: `*${normalizedQuery}*`,
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
              },
            },
          },
          sort: [
            { searchCount: { order: 'desc' } },
            { _score: { order: 'desc' } },
          ],
          size: limit,
        });

        userHistoryResponse.hits.hits.forEach((hit) => {
          const source = hit._source as SearchHistoryDocument;
          const score = hit._score || 0;

          if (source.content) {
            suggestions.set(source.content.toLowerCase(), {
              content: source.content,
              type: 'history',
              score: score + (source.searchCount || 0) * 0.5,
            });
          }
        });
      }

      if (suggestions.size < limit * 2) {
        const statsResponse = await this.elasticsearchService.search({
          index: this.statsIndexName,
          body: {
            query: {
              bool: {
                should: [
                  {
                    prefix: {
                      content: {
                        value: normalizedQuery,
                        boost: 6.0,
                      },
                    },
                  },
                  {
                    match_phrase_prefix: {
                      content: {
                        query: normalizedQuery,
                        boost: 3.0,
                      },
                    },
                  },
                  { wildcard: { content: `*${normalizedQuery}*` } },
                ],
                minimum_should_match: 1,
              },
            },
            sort: [{ totalSearchCount: { order: 'desc' } }],
            size: limit,
          },
        });

        statsResponse.hits.hits.forEach((hit) => {
          const source = hit._source as SearchStatsDocument;
          const score = hit._score || 0;

          if (source.content) {
            suggestions.set(source.content.toLowerCase(), {
              content: source.content,
              type: 'popular',
              score: score + (source.totalSearchCount || 0) * 0.3,
            });
          }
        });
      }

      if (suggestions.size === 0) {
        const popularCoursesResponse = await this.elasticsearchService.search({
          index: this.indexName,
          body: {
            query: { match_all: {} },
            sort: [{ rating: { order: 'desc' } }],
            _source: ['title'],
            size: limit,
          },
        });

        popularCoursesResponse.hits.hits.forEach((hit) => {
          const source = hit._source as any;
          if (source.title) {
            suggestions.set(source.title.toLowerCase(), {
              content: source.title,
              type: 'popular_course',
              score: 1,
            });
          }
        });
      }

      let resultArray = Array.from(suggestions.values());

      resultArray.sort((a, b) => {
        const aStartsWithQuery = a.content
          .toLowerCase()
          .startsWith(normalizedQuery)
          ? 1
          : 0;
        const bStartsWithQuery = b.content
          .toLowerCase()
          .startsWith(normalizedQuery)
          ? 1
          : 0;

        if (aStartsWithQuery !== bStartsWithQuery) {
          return bStartsWithQuery - aStartsWithQuery;
        }

        // order base on score
        return b.score - a.score;
      });

      const results = resultArray.slice(0, limit).map((item) => ({
        content: item.content,
        type: item.type,
      }));

      return { suggestions: results };
    } catch (error) {
      this.logger.error('Failed to get search suggestions:', error);
      throw error;
    }
  }

  async getPopularSearches(limit: number = 10) {
    try {
      const response = await this.elasticsearchService.search({
        index: this.statsIndexName,
        body: {
          query: {
            match_all: {},
          },
          sort: [{ totalSearchCount: { order: 'desc' } }],
          size: limit,
        },
      });

      const popularSearches = response.hits.hits.map((hit) => {
        const source = hit._source as SearchStatsDocument;
        return {
          id: hit._id,
          content: source.content,
          searchCount: source.totalSearchCount,
          personal: false,
        };
      });

      return { popularSearches };
    } catch (error) {
      this.logger.error('Failed to get popular searches:', error);
      throw error;
    }
  }

  async createSearchHistoryIndex() {
    const exists = await this.elasticsearchService.indices.exists({
      index: this.historyIndexName,
    });

    if (!exists) {
      await this.elasticsearchService.indices.create({
        index: this.historyIndexName,
        body: {
          mappings: {
            properties: {
              userId: { type: 'keyword' },
              content: {
                type: 'text',
                analyzer: 'flexible_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              searchCount: { type: 'integer' },
              updatedAt: { type: 'date' },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                flexible_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'word_delimiter_graph', 'asciifolding'],
                  char_filter: ['whitespace_remover'],
                },
              },
              char_filter: {
                whitespace_remover: {
                  type: 'pattern_replace',
                  pattern: '([a-zA-Z0-9])(\\s+)([a-zA-Z0-9])',
                  replacement: '$1$3',
                },
              },
            },
          },
        },
      });
      this.logger.log(`Index ${this.historyIndexName} created`);
    }
  }

  async createSearchStatsIndex() {
    const exists = await this.elasticsearchService.indices.exists({
      index: this.statsIndexName,
    });

    if (!exists) {
      await this.elasticsearchService.indices.create({
        index: this.statsIndexName,
        body: {
          mappings: {
            properties: {
              content: {
                type: 'text',
                analyzer: 'flexible_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              totalSearchCount: { type: 'integer' },
              updatedAt: { type: 'date' },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                flexible_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'word_delimiter_graph', 'asciifolding'],
                  char_filter: ['whitespace_remover'],
                },
              },
              char_filter: {
                whitespace_remover: {
                  type: 'pattern_replace',
                  pattern: '([a-zA-Z0-9])(\\s+)([a-zA-Z0-9])',
                  replacement: '$1$3',
                },
              },
            },
          },
        },
      });
      this.logger.log(`Index ${this.statsIndexName} created`);
    }
  }
}
