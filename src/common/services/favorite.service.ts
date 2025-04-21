import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CourseService } from 'src/common/services/course.service';

@Injectable()
export class FavoriteService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly courseService: CourseService,
  ) {}

  private getKey(userId: string): string {
    return `favorite:${userId}`;
  }

  async addCourseToFavorites(userId: string, courseId: string): Promise<void> {
    const key = this.getKey(userId);
    console.log('key: ' + key);
    const existing = (await this.cacheManager.get<string[]>(key)) || [];
    console.log('existing>>>>>>>' + existing);
    if (!existing.includes(courseId)) {
      existing.push(courseId);
      const cache = await this.cacheManager.set(key, existing);
      console.log('success?? ' + cache);
    }
  }

  async removeCourseFromFavorites(
    userId: string,
    courseId: string,
  ): Promise<void> {
    const key = this.getKey(userId);
    const existing = (await this.cacheManager.get<string[]>(key)) || [];

    const updated = existing.filter((id) => id !== courseId);
    await this.cacheManager.set(key, updated);
  }

  async getFavoriteCourses(userId: string): Promise<any[]> {
    const key = this.getKey(userId);
    console.log('key: ' + key);

    const courseIds = await this.cacheManager.get<string[]>(key);
    console.log('courseIds>>>>', courseIds);

    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    // Duyệt qua danh sách ID và get từng course từ DB
    const courses = await Promise.all(
      courseIds.map((id) => this.courseService.getCourseById(id)),
    );

    // Lọc bỏ các khóa học null (nếu id không tồn tại trong DB)
    return courses.filter((course) => course !== null);
  }

  async clearFavorites(userId: string): Promise<void> {
    const key = this.getKey(userId);
    await this.cacheManager.del(key);
  }
}
