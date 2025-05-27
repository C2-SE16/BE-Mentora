import { Module } from '@nestjs/common';
import { CategoryController } from '../controllers/category.controller';
import { CategoryService } from '../services/category.service';
import { RoleCheckService } from '../services/role-check.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService,RoleCheckService],
  exports: [CategoryService],
})
export class CategoryModule {}
