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
import { getVideoDurationInSeconds } from 'get-video-duration';
import { LectureService } from '../services/lecture.service';
import { spawn } from 'child_process';

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

  constructor(private readonly lectureService: LectureService) {
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(this.tempPath))
      fs.mkdirSync(this.tempPath, { recursive: true });
    if (!fs.existsSync(this.finalPath))
      fs.mkdirSync(this.finalPath, { recursive: true });
  }

  // Phương thức mới để tính thời lượng video bằng ffprobe
  private getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      console.log('===== TÍNH THỜI LƯỢNG VIDEO BẰNG FFPROBE =====');
      console.log('Đường dẫn file:', filePath);

      // Kiểm tra file có tồn tại không
      if (!fs.existsSync(filePath)) {
        console.error('File không tồn tại:', filePath);
        return reject(new Error(`File không tồn tại: ${filePath}`));
      }

      try {
        // Sử dụng thư viện get-video-duration
        getVideoDurationInSeconds(filePath)
          .then(duration => {
            console.log(`Thời lượng từ get-video-duration: ${duration} giây`);
            const roundedDuration = Math.round(duration);
            console.log(`Thời lượng sau khi làm tròn: ${roundedDuration} giây`);

            // Kiểm tra giá trị hợp lệ
            if (isNaN(roundedDuration) || roundedDuration <= 0 || roundedDuration > 86400) {
              console.error(`Thời lượng không hợp lệ: ${roundedDuration}`);
              throw new Error(`Thời lượng không hợp lệ: ${roundedDuration}`);
            }

            // Kiểm tra xem giá trị có bất thường không (quá lớn)
            if (roundedDuration > 7200) { // Nếu lớn hơn 2 giờ, coi là bất thường
              console.error(`Thời lượng có vẻ bất thường (${roundedDuration} giây), thử lại với ffprobe`);
              throw new Error('Thời lượng bất thường, chuyển sang phương pháp khác');
            }

            resolve(roundedDuration);
          })
          .catch(err => {
            console.error('Lỗi khi sử dụng get-video-duration:', err);

            // Nếu get-video-duration thất bại, thử dùng ffprobe trực tiếp
            try {
              const ffprobe = spawn('ffprobe', [
                '-v',
                'error',
                '-show_entries',
                'format=duration',
                '-of',
                'default=noprint_wrappers=1:nokey=1',
                filePath,
              ]);

              let output = '';
              ffprobe.stdout.on('data', (data) => {
                output += data.toString();
              });

              ffprobe.stderr.on('data', (data) => {
                console.error(`ffprobe stderr: ${data}`);
              });

              ffprobe.on('close', (code) => {
                if (code !== 0) {
                  console.error(`ffprobe process exited with code ${code}`);
                  return reject(new Error(`ffprobe process exited with code ${code}`));
                }

                const duration = parseFloat(output.trim());
                console.log(`Thời lượng từ ffprobe: ${duration} giây`);
                const roundedDuration = Math.round(duration);
                console.log(`Thời lượng sau khi làm tròn: ${roundedDuration} giây`);

                // Kiểm tra giá trị hợp lệ
                if (isNaN(roundedDuration) || roundedDuration <= 0 || roundedDuration > 86400) {
                  console.error(`Thời lượng không hợp lệ: ${roundedDuration}`);
                  return reject(new Error(`Thời lượng không hợp lệ: ${roundedDuration}`));
                }

                // Kiểm tra giá trị bất thường
                if (roundedDuration > 7200) { // Nếu lớn hơn 2 giờ, có thể bất thường
                  console.error(`Thời lượng ffprobe có vẻ bất thường: ${roundedDuration} giây`);
                  // Sử dụng một giá trị mặc định an toàn hoặc từ chối
                  return reject(new Error(`Thời lượng bất thường: ${roundedDuration} giây`));
                }

                resolve(roundedDuration);
              });
            } catch (ffprobeError) {
              console.error('Lỗi khi sử dụng ffprobe:', ffprobeError);
              reject(ffprobeError);
            }
          });
      } catch (error) {
        console.error('Lỗi khi tính thời lượng video:', error);
        reject(error);
      }
    });
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

  // Hàm chuyển đổi giây thành định dạng thời gian dễ đọc (HH:MM:SS)
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedHours = hours > 0 ? `${hours}:` : '';
    const formattedMinutes = minutes < 10 && hours > 0 ? `0${minutes}` : minutes;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
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

    // Tính toán thời lượng video
    let duration = 0;
    let formattedDuration = '00:00';
    let finalDuration = 0; // Khai báo biến finalDuration ở phạm vi rộng hơn

    try {
      console.log('===== TÍNH TOÁN THỜI LƯỢNG VIDEO =====');
      console.log('Đang tính toán thời lượng video...');
      console.log('Đường dẫn file video:', finalFilePath);

      // Kiểm tra file có tồn tại không
      if (!fs.existsSync(finalFilePath)) {
        console.error('File không tồn tại:', finalFilePath);
        throw new Error(`File không tồn tại: ${finalFilePath}`);
      }

      // Kiểm tra kích thước file
      const stats = fs.statSync(finalFilePath);
      console.log(`Kích thước file: ${stats.size} bytes`);

      if (stats.size === 0) {
        console.error('File có kích thước 0 bytes');
        throw new Error('File có kích thước 0 bytes');
      }

      // Sử dụng phương thức để tính thời lượng video
      duration = await this.getVideoDuration(finalFilePath);
      console.log(`Thời lượng video thực tế: ${duration} giây`);

      // Chuyển đổi thành định dạng dễ đọc
      formattedDuration = this.formatDuration(duration);
      console.log(`Thời lượng video định dạng: ${formattedDuration}`);

      // Kiểm tra giá trị hợp lệ
      if (isNaN(duration) || duration <= 0 || duration > 86400) { // 86400 giây = 24 giờ
        console.error(`Thời lượng không hợp lệ: ${duration}`);
        throw new Error(`Thời lượng không hợp lệ: ${duration}`);
      }

      // Đảm bảo duration là số nguyên
      finalDuration = Math.round(duration);
      console.log(`Thời lượng cuối cùng (đã làm tròn): ${finalDuration} giây`);

      // Kiểm tra và đảm bảo giá trị hợp lý trước khi cập nhật
      if (finalDuration > 7200) { // > 2 giờ
        console.error(`Phát hiện thời lượng bất thường: ${finalDuration} giây`);
        throw new Error(`Thời lượng bất thường: ${finalDuration} giây`);
      }

      // Lấy thông tin lecture hiện tại
      const currentLecture = await this.lectureService.getLectureById(lectureId);
      console.log('Lecture hiện tại trước khi cập nhật:', JSON.stringify(currentLecture));

      // Kiểm tra nếu đã có duration lớn hơn 0 và có sự chênh lệch lớn
      if (currentLecture.duration && currentLecture.duration > 0) {
        const durationDiff = Math.abs(currentLecture.duration - finalDuration);
        // Nếu chênh lệch trên 50%, ghi log cảnh báo
        if (durationDiff / currentLecture.duration > 0.5) {
          console.log(`CẢNH BÁO: Chênh lệch lớn giữa duration hiện tại (${currentLecture.duration}) và mới tính (${finalDuration})`);
        }
      }

      // Cập nhật thông tin vào database
      console.log('Đang cập nhật lecture với ID:', lectureId);
      console.log('Dữ liệu cập nhật: videoUrl =', relativePath, 'duration =', finalDuration);

      // Kiểm tra và hiển thị giá trị cuối cùng trước khi cập nhật
      console.log('Giá trị duration cuối cùng trước khi gửi đến service:', finalDuration);

      const updateLectureData = {
        videoUrl: relativePath,
        duration: finalDuration, // Lưu thời lượng thực tế theo giây
      };

      console.log('Dữ liệu gửi đến service:', JSON.stringify(updateLectureData));

      const updatedLecture = await this.lectureService.updateLecture(lectureId, updateLectureData);
      console.log('Kết quả cập nhật:', JSON.stringify(updatedLecture));

      console.log(`Đã cập nhật thông tin video và thời lượng (${finalDuration} giây) vào database cho bài giảng ${lectureId}`);
      console.log('===== KẾT THÚC TÍNH TOÁN THỜI LƯỢNG VIDEO =====');
    } catch (error) {
      console.error('===== LỖI KHI TÍNH TOÁN THỜI LƯỢNG VIDEO =====');
      console.error('Chi tiết lỗi:', error);
      console.error('===== KẾT THÚC LỖI =====');
    }

    console.log('===== END MERGE CHUNKS =====');

    // Đảm bảo log response trước khi trả về
    const response = {
      message: 'Video bài giảng đã được tải lên thành công!',
      filePath: relativePath,
      courseId: courseId,
      lectureId: lectureId,
      duration: finalDuration || duration, // Sử dụng finalDuration nếu có, ngược lại sử dụng duration
      formattedDuration: formattedDuration, // Định dạng dễ đọc
    };

    console.log('Response trả về cho client:', response);

    return response;
  }
}