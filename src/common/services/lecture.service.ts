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

    // Kiểm tra nguồn gốc của cuộc gọi, xem có phải từ upload controller hay không
    const isFromUploadController = new Error().stack?.includes('upload.controller') || false;
    console.log('Cuộc gọi từ upload controller?', isFromUploadController);

    // Kiểm tra giá trị duration hợp lý
    if (updateLectureDto.duration !== undefined) {
      // Nếu đã có duration hợp lệ và cuộc gọi không phải từ upload controller, giữ nguyên giá trị cũ
      if (existingLecture.duration && existingLecture.duration > 0 && existingLecture.duration < 1000 && !isFromUploadController) {
        console.log(`Giữ nguyên giá trị duration cũ (${existingLecture.duration}) vì cuộc gọi không phải từ upload controller`);
        updateLectureDto.duration = existingLecture.duration;
      }
      // Nếu duration quá lớn (> 24 giờ = 86400 giây)
      else if (updateLectureDto.duration > 86400) {
        console.log(`Phát hiện duration không hợp lý: ${updateLectureDto.duration} giây, lớn hơn 24 giờ`);
        // Sử dụng giá trị cũ nếu có, nếu không thì đặt giá trị mặc định là 0
        if (existingLecture.duration && existingLecture.duration > 0 && existingLecture.duration < 86400) {
          console.log(`Giữ nguyên giá trị cũ: ${existingLecture.duration} giây`);
          updateLectureDto.duration = existingLecture.duration;
        } else {
          console.log('Bỏ qua cập nhật duration vì giá trị không hợp lý');
          delete updateLectureDto.duration;
        }
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
      // Trường hợp duration hợp lệ từ upload controller và khác với giá trị hiện tại
      else if (isFromUploadController && existingLecture.duration !== updateLectureDto.duration) {
        console.log(`Cập nhật duration từ ${existingLecture.duration} thành ${updateLectureDto.duration} từ upload controller`);
      }
      // Trường hợp duration quá lớn (> 1000 giây) và không phải từ upload controller
      else if (updateLectureDto.duration > 1000 && !isFromUploadController) {
        console.log(`Phát hiện duration khả nghi (${updateLectureDto.duration} giây) từ nguồn không phải upload controller`);
        if (existingLecture.duration && existingLecture.duration > 0 && existingLecture.duration < 1000) {
          console.log(`Giữ nguyên giá trị cũ: ${existingLecture.duration} giây`);
          updateLectureDto.duration = existingLecture.duration;
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