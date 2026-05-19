import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';
import { SignInDtoMS, SignUpDto } from 'libs/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER NEW USER
  @MessagePattern('NEW_USER_REGISTRATION')
  registerNewUser(data: SignUpDto) {
    return this.authService.signUpMService(data);
  }
  //SIGN IN
  @MessagePattern('USER_SIGN_IN')
  signIn(data: SignInDtoMS) {
    return this.authService.signInUser(data);
  }
}
