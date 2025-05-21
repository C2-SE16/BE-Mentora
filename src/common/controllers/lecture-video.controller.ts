import {
    Controller,
    Get,
    Param,
    Req,
    Res,
    Post,
    Body,
    UseGuards,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { VideoService } from 'src/common/services/video.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProgressService } from '../services/progress.service';
import { LectureProgressGuard } from '../guards/lecture-progress.guard';
import { v4 as uuidv4 } from 'uuid';
import { UpdateLectureProgressDto } from '../dto/progress.dto';
import { PrismaService } from '../prisma/prisma.service';

interface UpdateVideoProgressDto {
    lectureId: string;
    currentTime: number;
    status?: 'IN_PROGRESS' | 'COMPLETED';
}

@Controller('lecture-videos')
export class LectureVideoController {
    constructor(
        private readonly videoService: VideoService,
        private readonly progressService: ProgressService,
        private readonly prismaService: PrismaService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('update-progress')
    async updateVideoProgress(
        @Body() body: UpdateVideoProgressDto,
        @Req() req,
    ) {
        try {
            if (!req.user) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            const userId = req.user['userId'];
            const { lectureId, currentTime, status } = body;

            // Tìm bài giảng để lấy thông tin
            const lecture = await this.prismaService.tbl_lectures.findUnique({
                where: { lectureId },
            });

            if (!lecture) {
                throw new HttpException('Lecture not found', HttpStatus.NOT_FOUND);
            }

            // Kiểm tra tiến độ đã tồn tại chưa
            const existingProgress = await this.prismaService.tbl_lecture_progress.findFirst({
                where: {
                    userId,
                    lectureId,
                },
            });

            let progressId;
            let updateDto: UpdateLectureProgressDto;

            if (existingProgress) {
                // Cập nhật tiến độ nếu đã tồn tại
                progressId = existingProgress.progressId;
                updateDto = {
                    progressId,
                    lastPosition: currentTime,
                    status: status || 'IN_PROGRESS',
                };

                // Nếu người dùng đã xem hơn 2/3 video hoặc đã hoàn thành, cập nhật trạng thái
                if (lecture.duration && (currentTime / lecture.duration >= 2 / 3 || status === 'COMPLETED')) {
                    updateDto.status = 'COMPLETED';
                    updateDto.completedAt = new Date().toISOString();
                }

                return await this.progressService.updateLectureProgress(updateDto);
            } else {
                // Tạo mới tiến độ nếu chưa tồn tại
                const newProgress = await this.prismaService.tbl_lecture_progress.create({
                    data: {
                        progressId: uuidv4(),
                        userId,
                        lectureId,
                        status: status || 'IN_PROGRESS',
                        lastPosition: currentTime,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });

                return { progress: newProgress };
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error updating video progress',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @UseGuards(JwtAuthGuard, LectureProgressGuard)
    @Get(':lectureId/:nextLectureId')
    async canPlayNextLecture(
        @Param('lectureId') lectureId: string,
        @Param('nextLectureId') nextLectureId: string,
        @Req() req,
    ) {
        try {
            if (!req.user) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            const userId = req.user['userId'];
            const result = await this.progressService.canProceedToNextLecture(
                userId,
                lectureId,
                nextLectureId,
            );
            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error checking ability to proceed',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('play/:lectureId')
    async playVideo(
        @Param('lectureId') lectureId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        try {
            if (!req.user) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            const userId = req.user['userId'];

            // Tìm bài giảng
            const lecture = await this.prismaService.tbl_lectures.findUnique({
                where: { lectureId },
            });

            if (!lecture || !lecture.videoUrl) {
                throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
            }

            // Trích xuất courseId và fileName từ videoUrl
            // Giả sử videoUrl có dạng "uploads/videos/{courseId}/{fileName}"
            const parts = lecture.videoUrl.split('/');
            const courseId = parts[parts.length - 2];
            const fileName = parts[parts.length - 1];

            const range = req.headers.range;
            if (!range) {
                return res.status(400).send('Requires Range header');
            }

            const video = this.videoService.getVideo(courseId, fileName, range);

            if (!video) {
                throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
            }

            const { stream, fileSize, start, end } = video;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Content-Type': 'video/mp4',
            });

            stream.pipe(res);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error streaming video',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
} 