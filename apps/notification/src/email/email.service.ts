import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { emailDto } from 'libs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  //--------------------------------------------------- SEND EMAIL
  async sendEmail(data: emailDto) {
    const { recipients, subject, html } = data;
    const transport = this.emailTransport();
    const options: nodemailer.SendMailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: recipients,
      subject: subject,
      html: html,
    };
    try {
      await transport.sendMail(options);
      return 'email sent seccessfully';
    } catch (error) {
      console.log('Error sending mail: ', error);
    }
  }
  //------------------------------------------------ END EMAIL SEND

  //EMAIL TRANPORT HELPER
  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
    return transporter;
  }
  // END EMAIL TRANPORT HELPER

  //-----------------------------------------------RENDER EMAIL TEMPLATE
  async renderTemplate(templateName: string, data: any): Promise<string> {
    const possiblePaths = [
      path.join(
        process.cwd(),
        'apps',
        'notification',
        'src',
        'email',
        'templates',
        `${templateName}.html`,
      ),
      path.join(
        process.cwd(),
        'apps',
        'notification',
        'dist',
        'email',
        'templates',
        `${templateName}.html`,
      ),

      path.join(
        process.cwd(),
        'notification',
        'src',
        'email',
        'templates',
        `${templateName}.html`,
      ),
      path.join(
        process.cwd(),
        'notification',
        'dist',
        'email',
        'templates',
        `${templateName}.html`,
      ),

      path.join(
        process.cwd(),
        'src',
        'email',
        'templates',
        `${templateName}.html`,
      ),
      path.join(
        process.cwd(),
        'dist',
        'email',
        'templates',
        `${templateName}.html`,
      ),
      path.join(__dirname, 'templates', `${templateName}.html`),
      path.join(__dirname, '..', 'email', 'templates', `${templateName}.html`),
    ];

    let templatePath: string | null = null;

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        templatePath = possiblePath;
        break;
      }
    }

    if (!templatePath) {
      throw new Error(
        `Template ${templateName} not found. Tried paths: ${possiblePaths.join(', ')}`,
      );
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = Handlebars.compile(template);
    const defaultData = {
      year: new Date().getFullYear(),
      companyName: this.configService.get('COMPANY_NAME') || 'Our Company',
      footerText:
        this.configService.get('COMPANY_NAME') || 'Thank you for choosing us',
      headerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      buttonColor: '#667eea',
      closingMessage: 'Best regards,<br/>The Team',
      ...data,
    };

    return compiledTemplate(defaultData);
  }

  //----------------------------------------------END RENDER TEMPLATE
}
