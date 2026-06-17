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

@Controller('user')
export class UserController {
  constructor(
    private readonly UserService: UserService,
    private readonly configService: ConfigService,
  ) {}
  //USER REGISTER API
  @Post('sign-up')
  signUp(@Body() data: SignUpDto) {
    return this.UserService.signUp(data);
  }
  //USER SIGNIN API
  @Post('sign-in')
  async signIn(@Body() data: SignInDto, @Ip() ip: string) {
    const requestIpAddress = ip;
    const result = await this.UserService.signIn({
      ...data,
      ip: requestIpAddress,
    });

    return {
      meesage: 'Login successful',
      token: result.token,
    };
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
  //USER CHANGE INFO
  @Post('change')
  @UseGuards(AuthGuard)
  changeUserInfo(@Req() req: Request, @Body() body: changeUserInfoDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = {
      token: token,
      ...body,
    };
    console.log(data);
    return this.UserService.changeUserInfo(data);
  }
}
