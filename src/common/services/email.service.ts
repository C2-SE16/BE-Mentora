import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('APP_URL');
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"Mentora" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: email,
      subject: 'Xác nhận đăng ký tài khoản Mentora',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1dbe70;">Chào mừng bạn đến với Mentora!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi.</p>
          <p>Để hoàn tất quá trình đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #1dbe70; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Xác nhận email
            </a>
          </div>
          
          <p>Hoặc bạn có thể sao chép và dán liên kết này vào trình duyệt của mình:</p>
          <p style="word-break: break-all; color: #3A10E5;">${verificationUrl}</p>
          
          <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Mentora. Tất cả các quyền được bảo lưu.</p>
            <p>Đây là email tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `,
    });
  }
}
