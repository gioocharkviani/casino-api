import { Body, Controller, Ip, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from 'libs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  //USER REGISTER API
  @Post('sign-up')
  signUp(@Body() data: SignUpDto) {
    return this.authService.signUp(data);
  }
  //USER SIGNIN API
  @Post('sign-in')
  async signIn(
    @Body() data: SignInDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const requestIpAddress = ip;
    console.log(requestIpAddress);
    const result = await this.authService.signIn({
      ...data,
      ip: requestIpAddress,
    });
    res.cookie('session_t', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return {
      meesage: 'Login successful',
    };
  }
}
