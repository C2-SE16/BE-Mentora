import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleCheckService {
  constructor(private prisma: PrismaService) {}

  /**
   * Kiểm tra xem một userId có phải là instructor hay không
   * dựa trên sự tồn tại của userId trong bảng tbl_instructors
   */
  async isInstructor(userId: string): Promise<boolean> {
    try {
      const instructor = await this.prisma.tbl_instructors.findFirst({
        where: { userId },
      });
      
      return !!instructor; // Trả về true nếu tìm thấy, false nếu không
    } catch (error) {
      console.error('Lỗi khi kiểm tra vai trò instructor:', error);
      return false;
    }
  }

  /**
   * Lấy instructorId từ userId
   * Hữu ích khi cần biết instructor ID của một user
   */
  async getInstructorId(userId: string): Promise<string | null> {
    try {
      const instructor = await this.prisma.tbl_instructors.findFirst({
        where: { userId },
        select: { instructorId: true },
      });
      
      return instructor?.instructorId || null;
    } catch (error) {
      console.error('Lỗi khi lấy instructorId:', error);
      return null;
    }
  }
} 