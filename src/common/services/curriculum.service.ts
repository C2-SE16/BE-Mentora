import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumDto, UpdateCurriculumDto, CreateEmptyCurriculumDto } from '../dto/curriculum.dto';
import { v4 as uuidv4 } from 'uuid';
import { curriculum_enum } from '@prisma/client';

// Thêm export để interface có thể được sử dụng bên ngoài
export interface CurriculumWithContent {
  curriculumId: string;
  moduleId: string | null;
  type: curriculum_enum;
  orderIndex: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  title?: string | null;
  description?: string | null;
  content?: any;
  tbl_lectures?: any[];
  tbl_quizzes?: any[];
}

@Injectable()
export class CurriculumService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCurriculum(createCurriculumDto: CreateCurriculumDto) {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId: createCurriculumDto.moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${createCurriculumDto.moduleId} not found`);
    }

    // Tạo curriculum với thông tin tối thiểu
    const curriculum = await this.prismaService.tbl_curricula.create({
      data: {
        curriculumId: uuidv4(),
        moduleId: createCurriculumDto.moduleId,
        type: createCurriculumDto.type,
        orderIndex: createCurriculumDto.orderIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Tạo lecture hoặc quiz với thông tin đầy đủ
    if (curriculum.type === 'LECTURE') {
      await this.prismaService.tbl_lectures.create({
        data: {
          lectureId: uuidv4(),
          curriculumId: curriculum.curriculumId,
          title: createCurriculumDto.title,
          description: createCurriculumDto.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else if (curriculum.type === 'QUIZ') {
      await this.prismaService.tbl_quizzes.create({
        data: {
          quizId: uuidv4(),
          curriculumId: curriculum.curriculumId,
          title: createCurriculumDto.title,
          description: createCurriculumDto.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Trả về curriculum đã tạo kèm theo lecture hoặc quiz
    return this.getCurriculumWithContent(curriculum.curriculumId);
  }

  async getCurriculumById(curriculumId: string) {
    const curriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId },
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum with ID ${curriculumId} not found`);
    }

    return curriculum;
  }

  async getCurriculumWithContent(curriculumId: string): Promise<any> {
    const curriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId },
      include: {
        tbl_lectures: true,
        tbl_quizzes: true,
      },
    });

    if (!curriculum) {
      throw new NotFoundException(`Curriculum with ID ${curriculumId} not found`);
    }

    // Tạo đối tượng kết quả với thông tin từ lecture hoặc quiz
    let result: CurriculumWithContent = {
      curriculumId: curriculum.curriculumId,
      moduleId: curriculum.moduleId,
      type: curriculum.type,
      orderIndex: curriculum.orderIndex,
      createdAt: curriculum.createdAt,
      updatedAt: curriculum.updatedAt
    };
    
    if (curriculum.type === 'LECTURE' && curriculum.tbl_lectures.length > 0) {
      const lecture = curriculum.tbl_lectures[0];
      result = {
        curriculumId: curriculum.curriculumId,
        moduleId: curriculum.moduleId,
        type: curriculum.type,
        orderIndex: curriculum.orderIndex,
        createdAt: curriculum.createdAt,
        updatedAt: curriculum.updatedAt,
        title: lecture.title ?? '',
        description: lecture.description ?? '',
        content: { ...lecture }
      };
    } else if (curriculum.type === 'QUIZ' && curriculum.tbl_quizzes.length > 0) {
      const quiz = curriculum.tbl_quizzes[0];
      result.title = quiz.title;
      result.description = quiz.description;
      result.content = { ...quiz };
    }

    // Sử dụng type assertion
    const resultWithArrays = result as (CurriculumWithContent & { 
      tbl_lectures?: any[]; 
      tbl_quizzes?: any[] 
    });
    delete resultWithArrays.tbl_lectures;
    delete resultWithArrays.tbl_quizzes;

    return result;
  }

  async getCurriculaByModuleId(moduleId: string): Promise<any[]> {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const curricula = await this.prismaService.tbl_curricula.findMany({
      where: { moduleId },
      orderBy: {
        orderIndex: 'asc',
      },
      include: {
        tbl_lectures: true,
        tbl_quizzes: true,
      },
    });

    // Định dạng lại kết quả để lấy thông tin từ lecture/quiz
    return curricula.map(curriculum => {
      const baseResult: CurriculumWithContent = {
        curriculumId: curriculum.curriculumId,
        moduleId: curriculum.moduleId,
        type: curriculum.type,
        orderIndex: curriculum.orderIndex,
        createdAt: curriculum.createdAt,
        updatedAt: curriculum.updatedAt
      };
      
      if (curriculum.type === 'LECTURE' && curriculum.tbl_lectures.length > 0) {
        const lecture = curriculum.tbl_lectures[0];
        return {
          ...baseResult,
          title: lecture.title ?? '',
          description: lecture.description ?? '',
          content: { ...lecture }
        };
      } else if (curriculum.type === 'QUIZ' && curriculum.tbl_quizzes.length > 0) {
        const quiz = curriculum.tbl_quizzes[0];
        return {
          ...baseResult,
          title: quiz.title ?? '',
          description: quiz.description ?? '',
          content: { ...quiz }
        };
      }
      
      return baseResult;
    });
  }

  async updateCurriculum(curriculumId: string, updateCurriculumDto: UpdateCurriculumDto): Promise<any> {
    // Kiểm tra xem curriculum có tồn tại không
    const existingCurriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId },
      include: {
        tbl_lectures: true,
        tbl_quizzes: true,
      },
    });

    if (!existingCurriculum) {
      throw new NotFoundException(`Curriculum with ID ${curriculumId} not found`);
    }

    // Cập nhật curriculum (chỉ cập nhật orderIndex và type nếu có)
    const updatedCurriculum = await this.prismaService.tbl_curricula.update({
      where: { curriculumId },
      data: {
        type: updateCurriculumDto.type,
        orderIndex: updateCurriculumDto.orderIndex,
        updatedAt: new Date(),
      },
    });

    // Nếu type thay đổi, cần xử lý đặc biệt
    if (updateCurriculumDto.type && updateCurriculumDto.type !== existingCurriculum.type) {
      // Nếu chuyển từ LECTURE sang QUIZ
      if (existingCurriculum.type === 'LECTURE' && updateCurriculumDto.type === 'QUIZ') {
        // Lấy thông tin từ lecture hiện tại
        const lecture = existingCurriculum.tbl_lectures[0];
        const title = lecture?.title || '';
        const description = lecture?.description || '';
        
        // Xóa lecture hiện tại
        if (existingCurriculum.tbl_lectures.length > 0) {
          await this.prismaService.tbl_lecture_progress.deleteMany({
            where: { lectureId: existingCurriculum.tbl_lectures[0].lectureId },
          });
          await this.prismaService.tbl_lectures.deleteMany({
            where: { curriculumId },
          });
        }
        
        // Tạo quiz mới với thông tin từ lecture
        await this.prismaService.tbl_quizzes.create({
          data: {
            quizId: uuidv4(),
            curriculumId,
            title: updateCurriculumDto.title || title,
            description: updateCurriculumDto.description || description,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } 
      // Nếu chuyển từ QUIZ sang LECTURE
      else if (existingCurriculum.type === 'QUIZ' && updateCurriculumDto.type === 'LECTURE') {
        // Lấy thông tin từ quiz hiện tại
        const quiz = existingCurriculum.tbl_quizzes[0];
        const title = quiz?.title || '';
        const description = quiz?.description || '';
        
        // Xóa quiz hiện tại và các dữ liệu liên quan
        if (existingCurriculum.tbl_quizzes.length > 0) {
          const quizId = existingCurriculum.tbl_quizzes[0].quizId;
          
          // Xóa quiz attempts và answers
          const attempts = await this.prismaService.tbl_quiz_attempts.findMany({
            where: { quizId },
          });
          
          for (const attempt of attempts) {
            await this.prismaService.tbl_quiz_answers.deleteMany({
              where: { attemptId: attempt.attemptId },
            });
          }
          
          await this.prismaService.tbl_quiz_attempts.deleteMany({
            where: { quizId },
          });
          
          // Xóa questions và answers
          const questions = await this.prismaService.tbl_questions.findMany({
            where: { quizId },
          });
          
          for (const question of questions) {
            await this.prismaService.tbl_answers.deleteMany({
              where: { questionId: question.questionId },
            });
          }
          
          await this.prismaService.tbl_questions.deleteMany({
            where: { quizId },
          });
          
          // Xóa quiz
          await this.prismaService.tbl_quizzes.deleteMany({
            where: { curriculumId },
          });
        }
        
        // Tạo lecture mới với thông tin từ quiz
        await this.prismaService.tbl_lectures.create({
          data: {
            lectureId: uuidv4(),
            curriculumId,
            title: updateCurriculumDto.title || title,
            description: updateCurriculumDto.description || description,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } else {
      // Nếu type không thay đổi, cập nhật lecture hoặc quiz tương ứng
      if (updatedCurriculum.type === 'LECTURE') {
        if (existingCurriculum.tbl_lectures.length > 0) {
          await this.prismaService.tbl_lectures.update({
            where: { lectureId: existingCurriculum.tbl_lectures[0].lectureId },
            data: {
              title: updateCurriculumDto.title,
              description: updateCurriculumDto.description,
              updatedAt: new Date(),
            },
          });
        } else {
          // Nếu không có lecture, tạo mới
          await this.prismaService.tbl_lectures.create({
            data: {
              lectureId: uuidv4(),
              curriculumId,
              title: updateCurriculumDto.title || '',
              description: updateCurriculumDto.description || '',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      } else if (updatedCurriculum.type === 'QUIZ') {
        if (existingCurriculum.tbl_quizzes.length > 0) {
          await this.prismaService.tbl_quizzes.update({
            where: { quizId: existingCurriculum.tbl_quizzes[0].quizId },
            data: {
              title: updateCurriculumDto.title,
              description: updateCurriculumDto.description,
              updatedAt: new Date(),
            },
          });
        } else {
          // Nếu không có quiz, tạo mới
          await this.prismaService.tbl_quizzes.create({
            data: {
              quizId: uuidv4(),
              curriculumId,
              title: updateCurriculumDto.title || '',
              description: updateCurriculumDto.description || '',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Trả về curriculum đã cập nhật kèm theo lecture hoặc quiz
    return this.getCurriculumWithContent(curriculumId);
  }

  async deleteCurriculum(curriculumId: string) {
    // Kiểm tra xem curriculum có tồn tại không
    const existingCurriculum = await this.prismaService.tbl_curricula.findUnique({
      where: { curriculumId },
    });

    if (!existingCurriculum) {
      throw new NotFoundException(`Curriculum with ID ${curriculumId} not found`);
    }

    // Xóa tất cả các tiến trình học tập liên quan đến curriculum này
    await this.prismaService.tbl_curriculum_progress.deleteMany({
      where: { curriculumId },
    });

    // Xóa các lecture hoặc quiz liên quan dựa vào loại curriculum
    if (existingCurriculum.type === 'LECTURE') {
      // Xóa tất cả lecture progress
      const lectures = await this.prismaService.tbl_lectures.findMany({
        where: { curriculumId },
      });
      
      for (const lecture of lectures) {
        await this.prismaService.tbl_lecture_progress.deleteMany({
          where: { lectureId: lecture.lectureId },
        });
      }
      
      // Xóa tất cả lectures
      await this.prismaService.tbl_lectures.deleteMany({
        where: { curriculumId },
      });
    } else if (existingCurriculum.type === 'QUIZ') {
      // Xóa tất cả quiz attempts và answers
      const quizzes = await this.prismaService.tbl_quizzes.findMany({
        where: { curriculumId },
      });
      
      for (const quiz of quizzes) {
        const attempts = await this.prismaService.tbl_quiz_attempts.findMany({
          where: { quizId: quiz.quizId },
        });
        
        for (const attempt of attempts) {
          await this.prismaService.tbl_quiz_answers.deleteMany({
            where: { attemptId: attempt.attemptId },
          });
        }
        
        await this.prismaService.tbl_quiz_attempts.deleteMany({
          where: { quizId: quiz.quizId },
        });
        
        // Xóa tất cả questions và answers
        const questions = await this.prismaService.tbl_questions.findMany({
          where: { quizId: quiz.quizId },
        });
        
        for (const question of questions) {
          await this.prismaService.tbl_answers.deleteMany({
            where: { questionId: question.questionId },
          });
        }
        
        await this.prismaService.tbl_questions.deleteMany({
          where: { quizId: quiz.quizId },
        });
      }
      
      // Xóa tất cả quizzes
      await this.prismaService.tbl_quizzes.deleteMany({
        where: { curriculumId },
      });
    }

    // Sau đó xóa curriculum
    return this.prismaService.tbl_curricula.delete({
      where: { curriculumId },
    });
  }

  async reorderCurricula(moduleId: string, curriculumIds: string[]) {
    // Kiểm tra xem module có tồn tại không
    const module = await this.prismaService.tbl_modules.findUnique({
      where: { moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Cập nhật thứ tự của các curriculum
    const updatePromises = curriculumIds.map((curriculumId, index) => {
      return this.prismaService.tbl_curricula.update({
        where: { curriculumId },
        data: { orderIndex: index },
      });
    });

    await Promise.all(updatePromises);

    return this.getCurriculaByModuleId(moduleId);
  }

  async createEmptyCurriculum(createEmptyCurriculumDto: CreateEmptyCurriculumDto): Promise<any> {
    // Sử dụng phương thức createCurriculum để tạo curriculum và lecture/quiz tương ứng
    return this.createCurriculum(createEmptyCurriculumDto);
  }
} 