import { Exclude, Type } from 'class-transformer';
import { category_enum } from '@prisma/client';

export class HomepageCourseEntity {
  id: string;
  title: string;
  instructor: string;
  rating?: number = 0;
  reviews?: number = 0;
  currentPrice: string;
  originalPrice: string;
  isBestSeller?: boolean = false;
  image: string;
  updatedDate: string;
  totalHours?: number = 0;
  description?: string = '';
  categories?: {
    id?: string;
    name?: category_enum | string | null;
  }[] = [];

  @Exclude()
  updatedAt?: Date | null;

  constructor(partial: Partial<HomepageCourseEntity>) {
    Object.assign(this, partial);
  }
}

export class HomepageTopicEntity {
  id: string;
  name: category_enum | string | null;
  courseCount: number;

  constructor(partial: Partial<HomepageTopicEntity>) {
    Object.assign(this, partial);
  }
}

export class HomepageMentorEntity {
  id: string;
  name: string;
  role: string;
  avatar: string;
  courseCount: number;
  rating: number;

  constructor(partial: Partial<HomepageMentorEntity>) {
    Object.assign(this, partial);
  }
}

export class HomepageCoursesResponseEntity {
  @Type(() => HomepageCourseEntity)
  recommendedCourses: HomepageCourseEntity[];

  @Type(() => HomepageCourseEntity)
  bestSellerCourses: HomepageCourseEntity[];

  @Type(() => HomepageTopicEntity)
  topics: HomepageTopicEntity[];

  @Type(() => HomepageMentorEntity)
  mentors: HomepageMentorEntity[];

  constructor(partial: Partial<HomepageCoursesResponseEntity>) {
    Object.assign(
      this,
      {
        recommendedCourses: [],
        bestSellerCourses: [],
        topics: [],
        mentors: [],
      },
      partial,
    );
  }
}

