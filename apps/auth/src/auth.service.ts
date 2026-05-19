import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  UserEntity,
  UserSessionEntity,
} from 'libs/database/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';
import { SignInDtoMS, SignUpDto } from 'libs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSessionEntity)
    private readonly userSessionRepository: Repository<UserSessionEntity>,
    private readonly configService: ConfigService,
  ) {}

  //SIGN UP
  async signUpMService(data: SignUpDto) {
    // Check duplicate email or username
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: data.email },
        { userName: data.userName },
        { phone: data.phone },
      ],
    });
    if (existingUser) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'email, userName or phone already exist',
      });
    }

    const bcryptSalt = await this.configService.get('BCRYPT_SALT');
    const hashedPassword = await bcrypt.hash(
      data.password,
      parseInt(bcryptSalt),
    );

    const user = this.userRepository.create({
      userName: data.userName,
      birthday: data.birthDay,
      email: data.email,
      lastName: data.lastName,
      password: hashedPassword,
      phone: data.phone,
      firstName: data.firstName,
      verified: false,
    });
    try {
      const savedUser = await this.userRepository.save(user);
      return savedUser;
    } catch (error) {
      throw new RpcException('Failed to register user');
    }
  }

  //SIGN-IN
  async signInUser(data: SignInDtoMS) {
    const findUser = await this.userRepository.findOne({
      where: {
        userName: data.userName,
      },
    });
    if (!findUser) {
      throw new RpcException({
        message: 'Invalid user creadentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
    const compareUserPassword = await bcrypt.compare(
      data.password,
      findUser.password,
    );
    if (!compareUserPassword) {
      throw new RpcException({
        message: 'Invalid user creadentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
    try {
      const generateSessionId = randomBytes(32).toString('hex');
      await this.saveUserSession({
        token: generateSessionId,
        userId: findUser.id,
        ip: data.ip || '',
      });
      return {
        token: generateSessionId,
      };
    } catch (error) {
      throw new RpcException({
        message: 'server error duaring user authorization',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  /////////////////////////////////////////////////////////////////////////

  //SAVE USER SESSION
  private async saveUserSession(data: {
    token: string;
    userId: string;
    ip: string;
  }) {
    try {
      const envExpireHours =
        this.configService.get('AUTH_TOKEN_EXPIRE_TIME') || '24';
      const expireHours = parseInt(envExpireHours, 10);
      const currentTime = new Date();
      const expireTime = new Date(
        currentTime.getTime() + expireHours * 60 * 60 * 1000,
      ); // milliseconds

      const saveUserSession = await this.userSessionRepository.save({
        userId: data.userId,
        token: data.token,
        ip: data.ip || '',
        expiresAt: expireTime,
      });

      return {
        status: 200,
        token: saveUserSession.token,
      };
    } catch (error) {
      console.error('Error saving session:', error); // log actual error
      throw new RpcException({
        message: 'server error during user authorization',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
  //SAVE USER SESSION

  //VALIDATE USER SESSION
  private validateUserSession() {}
  //VALIDATE USER SESSION
  /////////////////////////////////////////////////////////////////////////
}
