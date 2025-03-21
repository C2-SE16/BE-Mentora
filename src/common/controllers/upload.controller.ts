import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  private readonly tempPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'uploads',
    'temp',
  );
  private readonly finalPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'uploads',
    'videos',
  );

  constructor() {
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(this.tempPath))
      fs.mkdirSync(this.tempPath, { recursive: true });
    if (!fs.existsSync(this.finalPath))
      fs.mkdirSync(this.finalPath, { recursive: true });
  }

  @Post('chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body('chunkIndex') chunkIndex: number,
    @Body('totalChunks') totalChunks: number,
    @Body('fileName') fileName: string,
  ) {
    const chunkPath = path.join(this.tempPath, `${fileName}.part${chunkIndex}`);

    // Lưu từng chunk vào thư mục tạm thời
    fs.writeFileSync(chunkPath, file.buffer);

    console.log(
      `Received chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`,
    );

    return { message: `Chunk ${chunkIndex + 1} uploaded successfully!` };
  }

  @Post('merge')
  async mergeChunks(
    @Body('fileName') fileName: string,
    @Body('totalChunks') totalChunks: number,
  ) {
    const finalFilePath = path.join(this.finalPath, fileName);
    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(this.tempPath, `${fileName}.part${i}`);
      if (!fs.existsSync(chunkPath)) {
        return { message: `Chunk ${i} is missing!` };
      }

      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      fs.unlinkSync(chunkPath); // Xóa chunk sau khi merge
    }

    writeStream.end();
    console.log(`File ${fileName} merged successfully!`);

    return {
      message: 'File uploaded successfully!',
      filePath: `/uploads/videos/${fileName}`,
    };
  }
}
