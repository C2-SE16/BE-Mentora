import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { PublicInstructorGuard } from '../guards/public-instructor.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, PublicInstructorGuard],
  exports: [UserService],
})
export class UserModule {}
