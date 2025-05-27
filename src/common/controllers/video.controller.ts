import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { VideoService } from 'src/common/services/video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get(':courseId/:fileName')
  async getVideo(
    @Param('courseId') courseId: string,
    @Param('fileName') fileName: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const range = req.headers.range;
    if (!range) {
      return res.status(400).send('Requires Range header');
    }

    const video = this.videoService.getVideo(courseId, fileName, range);

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const { stream, fileSize, start, end } = video;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'video/mp4',
    });

    stream.pipe(res);
  }
}
