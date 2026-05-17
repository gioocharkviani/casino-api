import { Body, Controller, Post } from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  //USER REGISTER API
  @Post('sign-up')
  signUp(@Body() data: SignUpDto) {
    return this.authService.signUp(data);
  }
  //USER SIGNIN API
  @Post('sign-in')
  signIn(@Body() data: SignInDto) {
    return this.authService.signIn(data);
  }
}
