import {
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  UserEntity,
  UserLevelsEntity,
  UserSessionEntity,
  userVerificationEntity,
} from 'libs/database/entities/user.entity';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';
import {
  changeUserInfoDto,
  SignInDtoMS,
  SignUpDto,
  verifyDto,
} from 'libs/common';
import * as crypto from 'crypto';
import { walletEntity } from 'libs/database/entities/wallet.entity';
import { CountryEntity } from 'libs/database/entities/country.entity';

import { NotificationService } from 'apps/notification/src/notification.service';
import { UserWageringStats } from 'libs/database/entities/user-wagering.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserLevelsEntity)
    private readonly levelRepo: Repository<UserLevelsEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryEntity: Repository<CountryEntity>,
    @InjectRepository(walletEntity)
    private readonly walletRepositroy: Repository<walletEntity>,
    @InjectRepository(userVerificationEntity)
    private readonly verifyRepo: Repository<userVerificationEntity>,
    @InjectRepository(UserSessionEntity)
    private readonly userSessionRepository: Repository<UserSessionEntity>,
    @InjectRepository(UserWageringStats)
    private readonly userWagerRepo: Repository<UserWageringStats>,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  //SIGN UP USER
  async signUpMService(data: SignUpDto) {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: data.email },
        { userName: data.userName },
        { phone: data.phone },
        ...(data.personalId ? [{ personalId: data.personalId }] : []),
      ],
    });
    if (existingUser) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'email, userName, phone, or personalId already exist',
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
      ...(data.personalId ? { personalId: data.personalId } : {}),
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
        relations: { wallet: true },
      });

      await this.notificationService.verifiation({
        userEmail: savedUser.email,
        userId: savedUser.id,
        firstName: savedUser.firstName,
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
    if (findUser.isBlocked) {
      throw new RpcException({
        message: findUser.blockReason
          ? `Account blocked: ${findUser.blockReason}`
          : 'Account is blocked. Contact support.',
        statusCode: HttpStatus.FORBIDDEN,
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
      const plainTextToken = crypto.randomBytes(32).toString('hex');

      const hashedToken = crypto
        .createHash('sha256')
        .update(plainTextToken)
        .digest('hex');
      await this.saveUserSession({
        token: hashedToken,
        userId: findUser.id,
        ip: data.ip || '',
      });
      return {
        token: hashedToken,
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
      let findUser = await this.userRepository.findOne({
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

      const level = await this.levelRepo.findOne({
        where: {
          isActive: true,
          minPoints: LessThanOrEqual(findUser.xp ?? 0),
          maxPoints: MoreThanOrEqual(findUser.xp ?? 0),
        },
        select: {
          minPoints: true,
          maxPoints: true,
          name: true,
          badgeUrl: true,
          createdAt: false,
          description: false,
          id: false,
          isActive: false,
          order: false,
          updatedAt: false,
        },
      });

      if (!level) {
        return userWithoutPassword;
      }

      return { ...userWithoutPassword, level: level ?? null };
    } catch (error) {
      throw new RpcException({
        message: 'UNAUTHORIZED',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
  }
  //GETUSER INFORAMTION

  //USER VERIFICATION
  async userVerficiation(data: verifyDto) {
    const findUser = await this.validateUserSession(data.token);
    if (!findUser) {
      return new UnauthorizedException('UNAUTHORIZED');
    }

    if (!data.otp) {
      return {
        code: 400,
        message: 'OTP is required',
      };
    }

    try {
      const findOtp = await this.verifyRepo.findOne({
        where: {
          otp: data.otp,
        },
      });

      if (findOtp && findOtp.expiresAt && findOtp.expiresAt < new Date()) {
        return {
          code: 401,
          message: 'expired creadentials',
        };
      }

      const verifyUser = await this.userRepository.findOne({
        where: { id: findOtp?.userId, verified: false },
      });
      if (!verifyUser) {
        return {
          code: 401,
          message: 'user not found or user already verifyd',
        };
      }

      verifyUser.verified = true;
      await this.userRepository.save(verifyUser);
      await this.verifyRepo.delete({
        id: findOtp?.id,
      });
      return {
        code: 201,
        mesasage: 'user verifyd successfully',
      };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        message: 'something when wrong during verification',
      };
    }
  }
  //USER VERIFICATION

  //CHANGE USER INFO

  async changeUserInfo(data: changeUserInfoDto) {
    const user = await this.getUserInfo(data.token);

    if (!user) {
      throw new RpcException({
        message: 'UNAUTHORIZED',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    if (!fullUser) {
      throw new RpcException({
        message: 'USER_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const updateData: any = { ...fullUser };

    if (data.email && data.email !== fullUser.email) {
      updateData.email = data.email;
      updateData.verified = false;
    }

    if (data.oldPassword && data.newPassword) {
      const bcryptSalt = await this.configService.get('BCRYPT_SALT');

      const isPasswordValid = await bcrypt.compare(
        data.oldPassword,
        fullUser.password,
      );

      if (!isPasswordValid) {
        throw new RpcException({
          message: 'INVALID_OLD_PASSWORD',
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const hashedPassword = await bcrypt.hash(
        data.newPassword,
        parseInt(bcryptSalt),
      );
      updateData.password = hashedPassword;
    }

    if (data.phone !== undefined) updateData.phone = data.phone;

    await this.userRepository.save(updateData);
    const newUserData = await this.getUserInfo(data.token);

    return {
      status: 201,
      data: newUserData,
      message: 'user inforamtion changed successfully',
    };
  }

  //CHANGE USER INFO

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
      await this.userSessionRepository.delete({ id: session.id });
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

  //CHANGE USER XP
  async changeUserLevel(playerId?: string) {
    const findUserWager = await this.userWagerRepo.findOne({
      where: { userId: playerId },
    });

    if (!findUserWager) {
      return 0;
    }

    const total =
      Number(findUserWager.totalDebit ?? 0) +
      Number(findUserWager.totalDeposits ?? 0);

    const calculateXp = Math.floor(total / 5000);

    await this.userRepository.update({ id: playerId }, { xp: calculateXp });

    return calculateXp;
  }
  //CHANGE USER XP
  /////////////////////////////////////////////////////////////////////////

  //ADMIN: BLOCK USER
  async adminBlockUser(data: { userId: string; reason?: string }) {
    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });
    if (!user) return { code: 404, data: null, message: 'User not found' };

    user.isBlocked = true;
    user.blockReason = data.reason ?? 'Blocked by admin';
    await this.userRepository.save(user);

    // invalidate all active sessions
    await this.userSessionRepository
      .createQueryBuilder()
      .update()
      .set({ token: null })
      .where('userId = :userId', { userId: data.userId })
      .execute();

    return { code: 200, data: null, message: 'User blocked' };
  }

  //ADMIN: UNBLOCK USER
  async adminUnblockUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { code: 404, data: null, message: 'User not found' };

    user.isBlocked = false;
    user.blockReason = undefined;
    await this.userRepository.save(user);

    return { code: 200, data: null, message: 'User unblocked' };
  }

  //ADMIN: FORCE ACTIVATE (verify) USER
  async adminActivateUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { code: 404, data: null, message: 'User not found' };

    user.verified = true;
    await this.userRepository.save(user);

    return { code: 200, data: null, message: 'User activated' };
  }

  //ADMIN: SET USER PERSONAL ID
  async adminSetPersonalId(data: { userId: string; personalId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });
    if (!user) return { code: 404, data: null, message: 'User not found' };

    const conflict = await this.userRepository.findOne({
      where: { personalId: data.personalId },
    });
    if (conflict && conflict.id !== data.userId) {
      return {
        code: 409,
        data: null,
        message: 'Personal ID already assigned to another user',
      };
    }

    user.personalId = data.personalId;
    await this.userRepository.save(user);

    return { code: 200, data: { personalId: data.personalId }, message: 'Personal ID updated' };
  }

  //ADMIN: GET ALL USERS (paginated + filterable)
  async adminGetAllUsers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    isBlocked?: boolean;
    verified?: boolean;
  }) {
    const page  = filters?.page  ?? 1;
    const limit = Math.min(filters?.limit ?? 50, 200);
    const skip  = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoin('u.wallet', 'wallet')
      .leftJoin('u.country', 'country')
      .select([
        'u.id', 'u.userName', 'u.email', 'u.firstName', 'u.lastName',
        'u.phone', 'u.verified', 'u.isBlocked', 'u.blockReason',
        'u.personalId', 'u.xp', 'u.createdAt',
        'wallet.balance', 'wallet.currency',
        'country.name', 'country.countryCode',
      ])
      .orderBy('u.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.search) {
      const q = `%${filters.search}%`;
      qb.andWhere(
        '(u.email LIKE :q OR u.userName LIKE :q OR u.firstName LIKE :q OR u.lastName LIKE :q)',
        { q },
      );
    }
    if (filters?.isBlocked !== undefined) {
      qb.andWhere('u.isBlocked = :isBlocked', { isBlocked: filters.isBlocked });
    }
    if (filters?.verified !== undefined) {
      qb.andWhere('u.verified = :verified', { verified: filters.verified });
    }

    const [data, total] = await qb.getManyAndCount();
    return { code: 200, data, total, page, totalPages: Math.ceil(total / limit), message: 'Success' };
  }

  //ADMIN: UPDATE USER PROFILE
  async adminUpdateUser(data: {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    userName?: string;
    birthday?: string;
  }) {
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (!user) return { code: 404, data: null, message: 'User not found' };

    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName  !== undefined) user.lastName  = data.lastName;
    if (data.email     !== undefined) user.email     = data.email;
    if (data.phone     !== undefined) user.phone     = data.phone;
    if (data.userName  !== undefined) user.userName  = data.userName;
    if (data.birthday  !== undefined) user.birthday  = new Date(data.birthday);

    const saved = await this.userRepository.save(user);
    const { password, ...safe } = saved as any;
    return { code: 200, data: safe, message: 'User updated' };
  }

  // FORGOT PASSWORD — generate token, send reset email
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user) return { code: 200, message: 'If that email exists, a reset link has been sent.' };

    const token    = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3_600_000); // 1 hour
    user.resetToken          = token;
    user.resetTokenExpiresAt = expiresAt;
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get('FRONTEND_URL') ?? 'http://localhost:3001';
    const resetLink   = `${frontendUrl}/reset-password?token=${token}`;

    await this.notificationService.sendPasswordResetEmail({
      email,
      firstName: user.firstName,
      resetLink,
    });

    return { code: 200, message: 'If that email exists, a reset link has been sent.' };
  }

  // RESET PASSWORD — validate token, set new password
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return { code: 400, message: 'Invalid or expired reset token.' };
    }

    const salt    = parseInt(this.configService.get('BCRYPT_SALT') ?? '10', 10);
    user.password          = await bcrypt.hash(newPassword, salt);
    user.resetToken        = null;
    user.resetTokenExpiresAt = null;
    await this.userRepository.save(user);

    return { code: 200, message: 'Password has been reset successfully.' };
  }

  // ADMIN: GET USER WAGERING STATS
  async adminGetUserWagering(userId: string) {
    const stats = await this.userWagerRepo.findOne({ where: { userId } });
    if (!stats) return { code: 404, data: null, message: 'No wagering record found' };
    return { code: 200, data: stats };
  }

  // ADMIN: GET ALL USERS WAGERING (paginated)
  async adminGetAllWagering(filters?: { page?: number; limit?: number; search?: string }) {
    const page  = filters?.page  ?? 1;
    const limit = Math.min(filters?.limit ?? 50, 200);
    const skip  = (page - 1) * limit;

    const qb = this.userWagerRepo
      .createQueryBuilder('w')
      .leftJoin('w.user', 'u')
      .addSelect(['u.id', 'u.userName', 'u.email', 'u.firstName', 'u.lastName'])
      .orderBy('w.totalWagered', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.search) {
      qb.andWhere(
        '(u.userName LIKE :s OR u.email LIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { code: 200, data, total, page, totalPages: Math.ceil(total / limit) };
  }

  //ADMIN: GET USER BY ID
  async adminGetUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        verified: true,
        isBlocked: true,
        blockReason: true,
        personalId: true,
        xp: true,
        birthday: true,
        createdAt: true,
        updatedAt: true,
        wallet: { balance: true, currency: true },
      },
      relations: { wallet: true, country: true },
    });
    if (!user) {
      return { code: 404, data: null, message: 'User not found' };
    }
    return { code: 200, data: user, message: 'Success' };
  }
}
