import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import {
  changeUserInfoDto,
  SignInDto,
  SignUpDto,
  verifyDto,
} from 'libs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'libs/guards/auth.guard';
import { UserService } from './user.service';
import { PromotionsGatewayService } from '../promotions/promotions.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly UserService: UserService,
    private readonly configService: ConfigService,
    private readonly promoService: PromotionsGatewayService,
  ) {}

  //USER REGISTER API
  @Post('sign-up')
  async signUp(@Body() data: SignUpDto) {
    const result = await this.UserService.signUp(data);
    if (result?.id) {
      this.promoService.emitTrigger(result.id, 'registration');
    }
    return result;
  }

  //USER SIGNIN API
  @Post('sign-in')
  async signIn(@Body() data: SignInDto, @Ip() ip: string) {
    try {
      const result = await this.UserService.signIn({ ...data, ip });
      return {
        statusCode: 200,
        message: 'Login successful',
        token: result.token,
      };
    } catch (err: any) {
      const payload = err?.error ?? err;
      return {
        statusCode: payload?.statusCode ?? 401,
        message: payload?.message ?? 'Invalid credentials',
      };
    }
  }

  //SIGN-OUT
  @Post('sign-out')
  @HttpCode(200)
  userSignOut(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const result = this.UserService.signOut(token);
    res.clearCookie('Autorization', {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
      path: '/',
    });

    return result;
  }

  //GET USER INFO
  @Get('user')
  @UseGuards(AuthGuard)
  userInfo(@Req() req: Request) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    return this.UserService.getUserInfo(token);
  }

  //USER VERIFICATION
  @Post('verify')
  @UseGuards(AuthGuard)
  verifyUser(@Req() req: Request, @Body() body: verifyDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = {
      token: token,
      otp: body.otp,
    };
    return this.UserService.verifyUser(data);
  }

  // FORGOT PASSWORD
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() body: { email: string }) {
    return this.UserService.forgotPassword(body.email);
  }

  // RESET PASSWORD
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.UserService.resetPassword(body.token, body.newPassword);
  }

  //USER CHANGE INFO
  @Post('change')
  @UseGuards(AuthGuard)
  changeUserInfo(@Req() req: Request, @Body() body: changeUserInfoDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';

    const data = {
      ...body,
      token: token,
    };
    return this.UserService.changeUserInfo(data);
  }

  // GET ALL LEVELS
  @Get('levels')
  getLevels() {
    return this.UserService.getLevels();
  }

  // GET USER'S CURRENT LEVEL
  @Get('my-level')
  @UseGuards(AuthGuard)
  getUserLevel(@Req() req: Request) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    return this.UserService.getUserLevel(token);
  }
}
