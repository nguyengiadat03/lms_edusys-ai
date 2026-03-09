import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate>;

  constructor() {
    this.initializeTransporter();
    this.initializeTemplates();
  }

  private initializeTransporter() {
    // Configure email transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration (SMTP)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Development - use Ethereal Email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }
  }

  private initializeTemplates() {
    this.templates = new Map();

    // Password Reset Template
    this.templates.set('password-reset', {
      subject: 'Reset mật khẩu - EduSys AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset mật khẩu</h2>
          <p>Xin chào <strong>{{name}}</strong>,</p>
          <p>Bạn đã yêu cầu reset mật khẩu cho tài khoản EduSys AI của mình.</p>
          <p>Vui lòng click vào link bên dưới để reset mật khẩu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Mật Khẩu
            </a>
          </div>
          <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau {{expiryTime}}.</p>
          <p>Nếu bạn không yêu cầu reset mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Đây là email tự động, vui lòng không reply.<br>
            © 2024 EduSys AI. All rights reserved.
          </p>
        </div>
      `,
      text: `
        Xin chào {{name}},
        
        Bạn đã yêu cầu reset mật khẩu cho tài khoản EduSys AI của mình.
        
        Vui lòng truy cập link sau để reset mật khẩu: {{resetUrl}}
        
        Lưu ý: Link này sẽ hết hạn sau {{expiryTime}}.
        
        Nếu bạn không yêu cầu reset mật khẩu, vui lòng bỏ qua email này.
        
        © 2024 EduSys AI. All rights reserved.
      `
    });

    // Welcome User Template
    this.templates.set('welcome-user', {
      subject: 'Chào mừng đến với EduSys AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Chào mừng đến với EduSys AI!</h2>
          <p>Xin chào <strong>{{name}}</strong>,</p>
          <p>Tài khoản EduSys AI của bạn đã được tạo thành công!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Thông tin đăng nhập:</h3>
            <p><strong>Email:</strong> {{email}}</p>
            <p><strong>Mật khẩu tạm thời:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">{{tempPassword}}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Đăng Nhập Ngay
            </a>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Quan trọng:</strong> Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên để bảo mật tài khoản.
            </p>
          </div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Đây là email tự động, vui lòng không reply.<br>
            © 2024 EduSys AI. All rights reserved.
          </p>
        </div>
      `,
      text: `
        Chào mừng đến với EduSys AI!
        
        Xin chào {{name}},
        
        Tài khoản EduSys AI của bạn đã được tạo thành công!
        
        Thông tin đăng nhập:
        Email: {{email}}
        Mật khẩu tạm thời: {{tempPassword}}
        
        Đăng nhập tại: {{loginUrl}}
        
        QUAN TRỌNG: Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên để bảo mật tài khoản.
        
        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ.
        
        © 2024 EduSys AI. All rights reserved.
      `
    });

    // MFA Enabled Template
    this.templates.set('mfa-enabled', {
      subject: 'MFA đã được kích hoạt - EduSys AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">MFA đã được kích hoạt</h2>
          <p>Xin chào <strong>{{name}}</strong>,</p>
          <p>Multi-Factor Authentication (MFA) đã được kích hoạt thành công cho tài khoản EduSys AI của bạn.</p>
          
          <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              <strong>Tài khoản của bạn giờ đây an toàn hơn!</strong> Bạn sẽ cần nhập mã xác thực từ ứng dụng authenticator mỗi khi đăng nhập.
            </p>
          </div>
          
          <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với đội ngũ hỗ trợ ngay lập tức.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Đây là email tự động, vui lòng không reply.<br>
            © 2024 EduSys AI. All rights reserved.
          </p>
        </div>
      `,
      text: `
        MFA đã được kích hoạt
        
        Xin chào {{name}},
        
        Multi-Factor Authentication (MFA) đã được kích hoạt thành công cho tài khoản EduSys AI của bạn.
        
        Tài khoản của bạn giờ đây an toàn hơn! Bạn sẽ cần nhập mã xác thực từ ứng dụng authenticator mỗi khi đăng nhập.
        
        Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với đội ngũ hỗ trợ ngay lập tức.
        
        © 2024 EduSys AI. All rights reserved.
      `
    });

    // Security Alert Template
    this.templates.set('security-alert', {
      subject: 'Cảnh báo bảo mật - EduSys AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Cảnh báo bảo mật</h2>
          <p>Xin chào <strong>{{name}}</strong>,</p>
          <p>Chúng tôi phát hiện hoạt động bất thường trên tài khoản EduSys AI của bạn:</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>{{alertType}}:</strong> {{alertMessage}}
            </p>
            <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 14px;">
              Thời gian: {{timestamp}}<br>
              IP Address: {{ipAddress}}<br>
              Thiết bị: {{userAgent}}
            </p>
          </div>
          
          <p>Nếu đây là hoạt động của bạn, bạn có thể bỏ qua email này.</p>
          <p>Nếu bạn không thực hiện hoạt động này, vui lòng:</p>
          <ul>
            <li>Đổi mật khẩu ngay lập tức</li>
            <li>Kiểm tra các thiết bị đã đăng nhập</li>
            <li>Liên hệ với đội ngũ hỗ trợ</li>
          </ul>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Đây là email tự động, vui lòng không reply.<br>
            © 2024 EduSys AI. All rights reserved.
          </p>
        </div>
      `,
      text: `
        Cảnh báo bảo mật
        
        Xin chào {{name}},
        
        Chúng tôi phát hiện hoạt động bất thường trên tài khoản EduSys AI của bạn:
        
        {{alertType}}: {{alertMessage}}
        Thời gian: {{timestamp}}
        IP Address: {{ipAddress}}
        Thiết bị: {{userAgent}}
        
        Nếu đây là hoạt động của bạn, bạn có thể bỏ qua email này.
        
        Nếu bạn không thực hiện hoạt động này, vui lòng:
        - Đổi mật khẩu ngay lập tức
        - Kiểm tra các thiết bị đã đăng nhập
        - Liên hệ với đội ngũ hỗ trợ
        
        © 2024 EduSys AI. All rights reserved.
      `
    });
  }

  private renderTemplate(templateContent: string, data: any): string {
    let rendered = templateContent;
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, data[key] || '');
    });
    
    return rendered;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = this.templates.get(emailData.template);
      
      if (!template) {
        throw new Error(`Template '${emailData.template}' not found`);
      }

      // Render template with data
      const htmlContent = this.renderTemplate(template.html, emailData.data);
      const textContent = this.renderTemplate(template.text, emailData.data);
      const subject = this.renderTemplate(emailData.subject || template.subject, emailData.data);

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'EduSys AI <noreply@edusys.ai>',
        to: emailData.to,
        subject: subject,
        html: htmlContent,
        text: textContent
      });

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: emailData.to,
        template: emailData.template
      });

      // Log preview URL for development
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Email preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      logger.error('Email sending failed', {
        error: error.message,
        to: emailData.to,
        template: emailData.template
      });
      
      // Don't throw error to prevent breaking main operations
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Reset mật khẩu - EduSys AI',
      template: 'password-reset',
      data: {
        name,
        resetUrl,
        expiryTime: '1 giờ'
      }
    });
  }

  async sendWelcomeEmail(to: string, name: string, tempPassword: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Chào mừng đến với EduSys AI',
      template: 'welcome-user',
      data: {
        name,
        email: to,
        tempPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    });
  }

  async sendMFAEnabledEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'MFA đã được kích hoạt - EduSys AI',
      template: 'mfa-enabled',
      data: {
        name
      }
    });
  }

  async sendSecurityAlert(to: string, name: string, alertData: any): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Cảnh báo bảo mật - EduSys AI',
      template: 'security-alert',
      data: {
        name,
        ...alertData
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export function for backward compatibility
export const sendEmail = (emailData: EmailData) => emailService.sendEmail(emailData);

export default EmailService;