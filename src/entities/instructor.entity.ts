import { Type } from 'class-transformer';

export class InstructorCourseEntity {
  courseId: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  price: number;
  rating: number;
  durationTime: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  enrollmentCount: number;
  reviewCount: number;
 
  constructor(partial: Partial<InstructorCourseEntity>) {
    Object.assign(this, partial);
  }
}

export class InstructorUserEntity {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatar: string | null;
  role: string | null;
  facebookLink: string | null;
  linkedinLink: string | null;
  websiteLink: string | null;
  youtubeLink: string | null;
  description: string | null;
  title: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(partial: Partial<InstructorUserEntity>) {
    Object.assign(this, partial);
  }
}

export class InstructorStatisticsEntity {
  totalCourses: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;

  constructor(partial: Partial<InstructorStatisticsEntity>) {
    Object.assign(this, partial);
  }
}

export class InstructorDetailEntity {
  instructorId: string;
  userId: string | null;
  instructorName: string | null;
  bio: string | null;
  profilePicture: string | null;
  experience: string | null;
  averageRating: number;
  isVerified: boolean | null;
  paypalEmail: string | null;
  isPaypalVerified: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  @Type(() => InstructorUserEntity)
  user: InstructorUserEntity | null;

  @Type(() => InstructorCourseEntity)
  courses: InstructorCourseEntity[];

  @Type(() => InstructorStatisticsEntity)
  statistics: InstructorStatisticsEntity;

  constructor(partial: Partial<InstructorDetailEntity>) {
    Object.assign(this, partial);
  }
}
