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

export interface SearchHistoryDocument {
  userId: string;
  content: string;
  searchCount: number;
  updatedAt: Date;
  courseId?: string;
}

export interface SearchStatsDocument {
  content: string;
  totalSearchCount: number;
  updatedAt: Date;
}
