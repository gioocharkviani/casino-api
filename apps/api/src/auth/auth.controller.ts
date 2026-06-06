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
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto, verifyDto } from 'libs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'libs/guards/auth.guard';

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
    const EXPIRE_DATE = this.configService.get('AUTH_TOKEN_EXPIRE_TIME');
    const requestIpAddress = ip;
    const result = await this.authService.signIn({
      ...data,
      ip: requestIpAddress,
    });
    res.cookie('session_token', result.token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: parseInt(EXPIRE_DATE) * 60 * 60 * 1000,
    });
    return {
      meesage: 'Login successful',
    };
  }

  //SIGN-OUT
  @Post('sign-out')
  @HttpCode(200)
  userSignOut(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const session_token = req.cookies?.session_token
      ? req.cookies?.session_token
      : '';
    const result = this.authService.signOut(session_token);
    res.clearCookie('session_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return result;
  }

  //GET USER INFO
  @Get('user')
  @UseGuards(AuthGuard)
  userInfo(@Req() req: Request) {
    const session_token = req.cookies?.session_token
      ? req.cookies?.session_token
      : '';
    return this.authService.getUserInfo(session_token);
  }

  //USER VERIFICATION
  @Post('verify')
  @UseGuards(AuthGuard)
  verifyUser(@Req() req: Request, @Body() body: verifyDto) {
    const session_token = req.cookies?.session_token
      ? req.cookies?.session_token
      : '';
    const data = {
      token: session_token,
      otp: body.otp,
    };
    return this.authService.verifyUser(data);
  }
}
