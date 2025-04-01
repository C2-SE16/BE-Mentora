import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
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

  @Post('lecture-video')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadLectureChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body('chunkIndex') chunkIndex: number,
    @Body('totalChunks') totalChunks: number,
    @Body('fileName') fileName: string,
    @Body('courseId') courseId: string,
    @Body('lectureId') lectureId: string,
  ) {
    if (!courseId || !lectureId) {
      throw new BadRequestException('courseId và lectureId là bắt buộc');
    }

    console.log('===== UPLOAD CHUNK =====');
    console.log('Tên file gốc:', fileName);
    console.log('Course ID:', courseId);
    console.log('Lecture ID:', lectureId);
    console.log('Chunk Index:', chunkIndex);
    console.log('Total Chunks:', totalChunks);

    // Tạo tên file dựa trên lectureId
    const fileExtension = path.extname(fileName);
    const newFileName = `${lectureId}${fileExtension}`;
    
    console.log('Phần mở rộng file:', fileExtension);
    console.log('Tên file mới:', newFileName);
    
    // Tạo đường dẫn tạm thời cho chunk
    const chunkPath = path.join(this.tempPath, `${newFileName}.part${chunkIndex}`);
    console.log('Đường dẫn chunk tạm thời:', chunkPath);

    // Lưu từng chunk vào thư mục tạm thời
    fs.writeFileSync(chunkPath, file.buffer);

    console.log(
      `Received chunk ${chunkIndex + 1}/${totalChunks} for lecture ${lectureId} in course ${courseId}`,
    );
    console.log('===== END UPLOAD CHUNK =====');

    return { 
      message: `Chunk ${chunkIndex + 1} uploaded successfully!`,
      fileName: newFileName,
    };
  }

  @Post('merge-lecture-video')
  async mergeLectureChunks(
    @Body('fileName') fileName: string,
    @Body('totalChunks') totalChunks: number,
    @Body('courseId') courseId: string,
    @Body('lectureId') lectureId: string,
  ) {
    if (!courseId || !lectureId) {
      throw new BadRequestException('courseId và lectureId là bắt buộc');
    }

    console.log('===== MERGE CHUNKS =====');
    console.log('Tên file nhận được:', fileName);
    console.log('Course ID:', courseId);
    console.log('Lecture ID:', lectureId);
    console.log('Total Chunks:', totalChunks);

    // Tạo tên file dựa trên lectureId (để đảm bảo nhất quán)
    const fileExtension = path.extname(fileName);
    const newFileName = `${lectureId}${fileExtension}`;
    console.log('Tên file mới (dựa trên lectureId):', newFileName);

    // Tạo thư mục cho khóa học nếu chưa tồn tại
    const courseFolderPath = path.join(this.finalPath, courseId);
    console.log('Đường dẫn thư mục khóa học:', courseFolderPath);
    
    if (!fs.existsSync(courseFolderPath)) {
      console.log('Thư mục khóa học chưa tồn tại, đang tạo mới...');
      fs.mkdirSync(courseFolderPath, { recursive: true });
    }

    // Đường dẫn đến file cuối cùng - sử dụng tên file mới
    const finalFilePath = path.join(courseFolderPath, newFileName);
    console.log('Đường dẫn file cuối cùng:', finalFilePath);
    
    const writeStream = fs.createWriteStream(finalFilePath);

    console.log('Bắt đầu ghép các phần...');
    for (let i = 0; i < totalChunks; i++) {
      // Thử tìm chunk với tên file mới trước
      let chunkPath = path.join(this.tempPath, `${newFileName}.part${i}`);
      console.log(`Đang tìm phần ${i + 1}/${totalChunks} tại: ${chunkPath}`);
      
      // Nếu không tìm thấy, thử tìm với tên file gốc
      if (!fs.existsSync(chunkPath)) {
        console.log(`Không tìm thấy phần với tên file mới, thử tìm với tên file gốc...`);
        chunkPath = path.join(this.tempPath, `${fileName}.part${i}`);
        console.log(`Đang tìm phần ${i + 1}/${totalChunks} tại: ${chunkPath}`);
        
        if (!fs.existsSync(chunkPath)) {
          console.log(`CẢNH BÁO: Không tìm thấy phần ${i + 1}!`);
          return { message: `Chunk ${i} is missing!` };
        }
      }

      console.log(`Đã tìm thấy phần ${i + 1} tại: ${chunkPath}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      console.log(`Đã ghép phần ${i + 1} vào file cuối cùng`);
      
      fs.unlinkSync(chunkPath); // Xóa chunk sau khi merge
      console.log(`Đã xóa phần tạm thời ${i + 1}`);
    }

    writeStream.end();
    console.log(`File ${newFileName} đã được ghép thành công trong khóa học ${courseId}!`);

    // Đường dẫn tương đối để lưu vào database
    const relativePath = `/uploads/videos/${courseId}/${newFileName}`;
    console.log('Đường dẫn tương đối để lưu vào database:', relativePath);
    console.log('===== END MERGE CHUNKS =====');

    // Đảm bảo log response trước khi trả về
    const response = {
      message: 'Video bài giảng đã được tải lên thành công!',
      filePath: relativePath,
      courseId: courseId,
      lectureId: lectureId,
    };
    
    console.log('Response trả về cho client:', response);
    
    return response;
  }
}
