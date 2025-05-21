import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VideoService {
  private readonly videoBasePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'uploads',
    'videos',
  );

  getVideo(courseId: string, fileName: string, range?: string) {
    const filePath = path.join(this.videoBasePath, courseId, fileName);
    console.log('Đang đọc file:', filePath);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileSize = fs.statSync(filePath).size;

    if (!range) {
      return {
        filePath,
        stream: fs.createReadStream(filePath),
        fileSize,
        start: 0,
        end: fileSize - 1,
      };
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const stream = fs.createReadStream(filePath, { start, end });

    return { filePath, stream, fileSize, start, end };
  }
}
