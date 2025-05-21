import { approve_enum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Interface định nghĩa kiểu dữ liệu cho course từ Prisma
export interface HomepageCourse {
  courseId: string;
  title?: string | null;
  description?: string | null;
  overview?: string | null;
  durationTime?: number | null;
  price?: Decimal | null;
  approved?: approve_enum | null;
  rating?: Decimal | null;
  comment?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  thumbnail?: string | null;
  isBestSeller?: boolean | null;
  isRecommended?: boolean | null;
  tbl_course_reviews?: {
    rating: Decimal;
    comment?: string | null;
  }[];
  tbl_instructors?: {
    instructorId: string;
    bio?: string | null;
    profilePicture?: string | null;
    experience?: string | null;
    average_rating?: Decimal | null;
    isVerified?: boolean | null;
    tbl_users?: {
      userId: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      avatar?: string | null;
      role?: string | null;
    } | null;
  } | null;
  tbl_course_categories?: {
    courseCategoryId: string;
    tbl_categories?: {
      categoryId: string;
      categoryType?: string | null;
    } | null;
  }[];
}
