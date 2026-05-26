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
import { walletEntity } from 'libs/database/entities/wallet.entity';
import { CountryEntity } from 'libs/database/entities/country.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryEntity: Repository<CountryEntity>,
    @InjectRepository(walletEntity)
    private readonly walletRepositroy: Repository<walletEntity>,
    @InjectRepository(UserSessionEntity)
    private readonly userSessionRepository: Repository<UserSessionEntity>,
    private readonly configService: ConfigService,
  ) {}

  //SIGN UP USER
  async signUpMService(data: SignUpDto) {
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

    const country = await this.findExistingCountry(data.country);
    user.country = country;

    try {
      const savedUser = await this.userRepository.save(user);

      const wallet = new walletEntity();
      wallet.balance = 0;
      wallet.currency = 'USD';
      wallet.user = savedUser;
      await this.walletRepositroy.save(wallet);

      const userWithWallet = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['wallet'],
      });

      return userWithWallet;
    } catch (error) {
      throw new RpcException('Failed to register user');
    }
  }
  //SIGN UP USER

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

  //SIGN OUT USER
  async signOutUser(token?: string | null) {
    if (!token || token === null) {
      throw new RpcException({
        message: 'token not found',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    try {
      const removeToken = await this.removeTokenFromSession(token);
      return removeToken;
    } catch (error) {
      throw new RpcException({
        message: 'server error duaring user sign out',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  //GETUSER INFORAMTION
  async getUserInfo(token?: string) {
    try {
      const validation = await this.validateUserSession(token);
      if (!validation.valid) {
        throw new RpcException({
          message: 'UNAUTHORIZED',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      }
      const userId = validation.userId;
      const findUser = await this.userRepository.findOne({
        where: { id: userId },
        select: {
          wallet: {
            balance: true,
            currency: true,
          },
        },
        relations: { wallet: true },
      });
      if (!findUser) {
        throw new RpcException({
          message: 'User not found',
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
      const { password, ...userWithoutPassword } = findUser;
      return userWithoutPassword;
    } catch (error) {
      throw new RpcException({
        message: 'UNAUTHORIZED',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
  }
  //GETUSER INFORAMTION

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
      );

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
  async validateUserSession(token?: string) {
    if (!token) return { valid: false };

    const session = await this.userSessionRepository.findOne({
      where: { token: token },
    });

    if (!session || !session.token) {
      return { valid: false };
    }
    if (session.expiresAt < new Date()) {
      session.token = null;
      await this.userSessionRepository.save(session);
      return { valid: false };
    }
    const expireHours = parseInt(
      this.configService.get('AUTH_TOKEN_EXPIRE_TIME') || '24',
      10,
    );
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + expireHours);

    session.expiresAt = newExpiry;
    await this.userSessionRepository.save(session);
    return {
      valid: true,
      userId: session.userId,
    };
  }
  //VALIDATE USER SESSION

  //REMOVE TOKEN FROM USER SESSION
  private async removeTokenFromSession(token?: string) {
    if (!token) {
      return { message: 'User logged out successfully' };
    }
    const findToken = await this.userSessionRepository.findOne({
      where: { token: token },
    });
    if (!findToken) {
      return { message: 'User logged out successfully' };
    }
    findToken.token = null;

    await this.userSessionRepository.save(findToken);
    return { message: 'User logged out successfully' };
  }
  //REMOVE TOKEN FROM USER SESSION

  //FIND COUNTRY
  private async findExistingCountry(
    identifier: string,
  ): Promise<CountryEntity> {
    const country = await this.countryEntity.findOne({
      where: [{ name: identifier }, { countryCode: identifier }],
    });

    if (!country) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Country not found with name or code: ${identifier}`,
      });
    }
    return country;
  }
  //FIND COUNTRY
  /////////////////////////////////////////////////////////////////////////
}
