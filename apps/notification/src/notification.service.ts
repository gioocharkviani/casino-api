import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { emailDto, verifyDto, verifyDtoNotification } from 'libs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserEntity,
  userVerificationEntity,
} from 'libs/database/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private configService: ConfigService,
    @InjectRepository(userVerificationEntity)
    private readonly verifyRepository: Repository<userVerificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
  ) {}

  //VERIFICATION USER
  async verifiation(data: verifyDtoNotification) {
    const OTP = this.generateOTP();
    const time = this.configService.get('OTP_TIME');
    const expiresAtDate = new Date();
    expiresAtDate.setMinutes(expiresAtDate.getMinutes() + parseInt(time));
    const user = await this.userEntity.findOne({
      where: { email: data.userEmail },
    });
    const createOpt = this.verifyRepository.create({
      userId: user?.id,
      otp: OTP,
      expiresAt: expiresAtDate,
    });
    const saveOtp = this.verifyRepository.save(createOpt);
    const template: any = await this.emailService.renderTemplate(
      'verification-template',
      {
        code: (await saveOtp).otp,
        casinoTitle: 'WolfWin.Bet',
        userFirstName: data.firstName,
      },
    );
    const dummyData = {
      recipients: [data.userEmail],
      subject: 'VERFICICATION',
      html: template,
    };
    try {
      const res = await this.emailService.sendEmail(dummyData);
      return res;
    } catch (error) {
      console.error('Verification email failed:', error);
    }
  }
  //END VERIFICATION USER

  //OPT GENERATOR
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  //OPT GENERATOR
}
