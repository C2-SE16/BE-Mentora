import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ProgressService } from '../services/progress.service';

@Injectable()
export class LectureProgressGuard implements CanActivate {
    constructor(private readonly progressService: ProgressService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        if (!request.user) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        const userId = request.user['userId'];

        // Lấy thông tin từ request
        const currentLectureId = request.params.lectureId || request.body.currentLectureId;
        const nextLectureId = request.params.nextLectureId || request.body.nextLectureId;
        const currentCurriculumId = request.params.curriculumId || request.body.currentCurriculumId;
        const nextCurriculumId = request.params.nextCurriculumId || request.body.nextCurriculumId;

        // Nếu có thông tin curriculum, ưu tiên kiểm tra theo curriculum
        if (currentCurriculumId) {
            try {
                // Kiểm tra xem người dùng đã hoàn thành curriculum chưa
                const result = await this.progressService.canProceedToNextCurriculum(
                    userId,
                    currentCurriculumId,
                    nextCurriculumId,
                );

                if (!result.canProceed) {
                    throw new HttpException({
                        status: HttpStatus.FORBIDDEN,
                        error: result.message,
                        progress: this.extractProgressInfo(result)
                    }, HttpStatus.FORBIDDEN);
                }

                return true;
            } catch (error) {
                // Xử lý lỗi
                if (error instanceof HttpException) {
                    throw error;
                }

                throw new HttpException(
                    'Error checking curriculum progress',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }

        // Nếu không có thông tin curriculum nhưng có thông tin bài giảng
        else if (currentLectureId) {
            try {
                // Kiểm tra xem người dùng đã hoàn thành đủ 2/3 thời lượng bài học chưa
                const result = await this.progressService.canProceedToNextLecture(
                    userId,
                    currentLectureId,
                    nextLectureId,
                );

                if (!result.canProceed) {
                    throw new HttpException({
                        status: HttpStatus.FORBIDDEN,
                        error: result.message,
                        progress: this.extractProgressInfo(result)
                    }, HttpStatus.FORBIDDEN);
                }

                return true;
            } catch (error) {
                // Nếu lỗi là do HttpException (đã được xử lý), ném lại lỗi
                if (error instanceof HttpException) {
                    throw error;
                }

                // Nếu lỗi khác, trả về lỗi chung
                throw new HttpException(
                    'Error checking lecture progress',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }

        // Nếu không có thông tin bài học, cho phép truy cập
        return true;
    }

    /**
     * Trích xuất thông tin tiến độ từ kết quả kiểm tra
     */
    private extractProgressInfo(result: any) {
        // Nếu có currentProgress, sử dụng thông tin từ đó
        if (result.currentProgress) {
            return {
                currentDuration: result.currentProgress.currentDuration,
                requiredDuration: result.currentProgress.requiredDuration,
                completionRatio: result.currentProgress.completionRatio,
                progress: result.currentProgress.progress
            };
        }

        // Nếu có thông tin trực tiếp
        return {
            currentDuration: result.currentDuration,
            requiredDuration: result.requiredDuration,
            completionRatio: result.completionRatio,
            progress: result.progress,
            isPassed: result.isPassed,
            attempts: result.attempts
        };
    }
} 