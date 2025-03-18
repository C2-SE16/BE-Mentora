import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'uploads',
            'videos',
          );
          console.log('Upload Path:', uploadPath);

          // Kiểm tra nếu thư mục chưa tồn tại thì tạo mới
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    console.log('File saved at:', file.path);

    return {
      message: 'Video uploaded successfully!',
      filePath: `/uploads/videos/${file.filename}`, // Đảm bảo frontend có thể truy cập
    };
  }
}
