export interface CourseSearchResult {
    courseId: string;
    title?: string;
    description?: string;
    overview?: string;
    price?: number;
    rating?: number;
    categories?: string[];
    instructor?: string;
    isBestSeller?: boolean;
    isRecommended?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    score?: number;
  }