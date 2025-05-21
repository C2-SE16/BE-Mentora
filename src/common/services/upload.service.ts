import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
@Injectable()
export class UploadService {
  static getStorage() {
    return diskStorage({
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

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }
}
