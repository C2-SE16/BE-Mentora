import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ModuleService } from '../services/module.service';
import { CreateModuleDto, UpdateModuleDto } from '../dto/module.dto';

@Controller('modules')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  async createModule(@Body() createModuleDto: CreateModuleDto) {
    try {
      const module = await this.moduleService.createModule(createModuleDto);
      return {
        success: true,
        data: module,
        message: 'Module created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create module',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':moduleId')
  async getModuleById(@Param('moduleId') moduleId: string) {
    try {
      const module = await this.moduleService.getModuleById(moduleId);
      return {
        success: true,
        data: module,
        message: 'Module retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve module',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('course/:courseId')
  async getModulesByCourseId(@Param('courseId') courseId: string) {
    try {
      const modules = await this.moduleService.getModulesByCourseId(courseId);
      return {
        success: true,
        data: modules,
        message: 'Modules retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve modules',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':moduleId')
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    try {
      const module = await this.moduleService.updateModule(
        moduleId,
        updateModuleDto,
      );
      return {
        success: true,
        data: module,
        message: 'Module updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update module',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':moduleId')
  @HttpCode(HttpStatus.OK)
  async deleteModule(@Param('moduleId') moduleId: string) {
    try {
      await this.moduleService.deleteModule(moduleId);
      return {
        success: true,
        message: 'Module deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete module',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reorder')
  async reorderModules(
    @Body('courseId') courseId: string,
    @Body('moduleIds') moduleIds: string[],
  ) {
    try {
      const modules = await this.moduleService.reorderModules(courseId, moduleIds);
      return {
        success: true,
        data: modules,
        message: 'Modules reordered successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to reorder modules',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 