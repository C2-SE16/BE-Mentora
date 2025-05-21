import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLectureDto, UpdateLectureDto } from '../dto/lecture.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LectureService {
  constructor(private readonly prismaService: PrismaService) { }

  async createLecture(createLectureDto: CreateLectureDto) {
    // Kiểm tra xem curriculum có tồn tại không
    const curriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId: createLectureDto.curriculumId },
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum with ID ${createLectureDto.curriculumId} not found`);
    }

    // Kiểm tra xem curriculum có phải loại LECTURE không
    if (curriculum.type !== 'LECTURE') {
      throw new Error(`Curriculum with ID ${createLectureDto.curriculumId} is not a lecture type`);
    }

    return this.prismaService.tbl_lectures.create({
      data: {
        lectureId: uuidv4(),
        curriculumId: createLectureDto.curriculumId,
        title: createLectureDto.title,
        description: createLectureDto.description,
        videoUrl: createLectureDto.videoUrl,
        articleContent: createLectureDto.articleContent,
        duration: createLectureDto.duration,
        isFree: createLectureDto.isFree,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getLectureById(lectureId: string) {
    const lecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!lecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    return lecture;
  }

  async updateLecture(lectureId: string, updateLectureDto: UpdateLectureDto) {
    console.log('===== UPDATE LECTURE SERVICE =====');
    console.log('Lecture ID:', lectureId);
    console.log('Update data:', JSON.stringify(updateLectureDto));
    
    // Log stack trace để xác định nguồn gốc cuộc gọi
    console.log('Stack trace:', new Error().stack);
    
    // Kiểm tra xem lecture có tồn tại không
    const existingLecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!existingLecture) {
      console.log('Lecture không tồn tại');
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    console.log('Lecture hiện tại:', JSON.stringify(existingLecture));

    // Kiểm tra giá trị duration hợp lý
    if (updateLectureDto.duration !== undefined) {
      // Kiểm tra các giá trị bất thường cụ thể
      if (updateLectureDto.duration === 14350) {
        console.log(`Phát hiện giá trị duration bất thường: 14350 giây`);
        if (existingLecture.duration && existingLecture.duration > 0 && existingLecture.duration < 3600) {
          console.log(`Giữ nguyên giá trị cũ: ${existingLecture.duration} giây`);
          updateLectureDto.duration = existingLecture.duration;
        } else {
          console.log('Bỏ qua cập nhật duration');
          delete updateLectureDto.duration;
        }
      }
      // Nếu duration quá lớn (> 10 giờ = 36000 giây) và đã có duration trước đó hợp lý
      else if (updateLectureDto.duration > 36000 && existingLecture.duration && existingLecture.duration < 36000) {
        console.log(`Phát hiện duration không hợp lý: ${updateLectureDto.duration} giây`);
        console.log(`Giữ nguyên giá trị cũ: ${existingLecture.duration} giây`);
        updateLectureDto.duration = existingLecture.duration;
      }
      
      // Nếu duration âm hoặc 0, coi như không hợp lệ
      else if (updateLectureDto.duration <= 0) {
        console.log(`Phát hiện duration không hợp lệ: ${updateLectureDto.duration} giây`);
        if (existingLecture.duration && existingLecture.duration > 0) {
          console.log(`Giữ nguyên giá trị cũ: ${existingLecture.duration} giây`);
          updateLectureDto.duration = existingLecture.duration;
        } else {
          console.log('Bỏ qua cập nhật duration');
          delete updateLectureDto.duration;
        }
      }
    }

    // Tạo dữ liệu cập nhật, chỉ lấy những trường có giá trị
    const updateData = {
      title: updateLectureDto.title,
      description: updateLectureDto.description,
      videoUrl: updateLectureDto.videoUrl,
      articleContent: updateLectureDto.articleContent,
      duration: updateLectureDto.duration,
      isFree: updateLectureDto.isFree,
      updatedAt: new Date(),
    };

    console.log('Dữ liệu cập nhật sau khi xử lý:', JSON.stringify(updateData));

    // Lọc bỏ các trường undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('Dữ liệu cập nhật sau khi lọc:', JSON.stringify(updateData));

    const result = await this.prismaService.tbl_lectures.update({
      where: { lectureId },
      data: updateData,
    });

    console.log('Kết quả cập nhật:', JSON.stringify(result));
    console.log('===== KẾT THÚC UPDATE LECTURE SERVICE =====');

    return result;
  }

  async deleteLecture(lectureId: string) {
    // Kiểm tra xem lecture có tồn tại không
    const existingLecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!existingLecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    // Xóa tất cả lecture progress liên quan
    await this.prismaService.tbl_lecture_progress.deleteMany({
      where: { lectureId },
    });

    // Sau đó xóa lecture
    return this.prismaService.tbl_lectures.delete({
      where: { lectureId },
    });
  }

  // Phương thức mới để đồng bộ thông tin từ lecture sang curriculum
  async syncCurriculumWithLecture(lectureId: string) {
    const lecture = await this.prismaService.tbl_lectures.findUnique({
      where: { lectureId },
    });

    if (!lecture) {
      throw new NotFoundException(`Lecture with ID ${lectureId} not found`);
    }

    if (!lecture.curriculumId) {
      throw new NotFoundException(`Lecture with ID ${lectureId} has no associated curriculum`);
    }

    // Chỉ cập nhật updatedAt để theo dõi thời gian thay đổi
    await this.prismaService.tbl_curricula.update({
      where: { curriculumId: lecture.curriculumId! },
      data: {
        updatedAt: new Date(),
      },
    });
  }
} 