import { Exclude, Type } from 'class-transformer';
export class HomepageCourseEntity {
  id: string;
  title: string;
  instructor: string;
  rating?: number = 0;
  reviews?: number = 0;
  currentPrice: string;
  originalPrice?: string;
  isBestSeller?: boolean = false;
  image: string;
  createdAt: Date;
  updatedDate: string;
  totalHours?: number = 0;
  description?: string = '';
  hasDiscount?: boolean;
  discountPercentage?: number;
  voucherCode?: string;
  appliedVoucher?: {
    code?: string | null;
    discountAmount: number;
    discountType?: string | null;
  };
  categories?: {
    id?: string;
    name?: string | null;
  }[] = [];

  @Exclude()
  updatedAt?: Date | null;

  constructor(partial: Partial<HomepageCourseEntity>) {
    Object.assign(this, partial);
  }
}

export class HomepageTopicEntity {
  id: string;
  name: string | null;
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

  @Type(() => HomepageCourseEntity)
  newCourses: HomepageCourseEntity[];

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
        newCourses: [],
        topics: [],
        mentors: [],
      },
      partial,
    );
  }
}
