import { Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER NEW USER
  @MessagePattern('NEW_USER_REGISTRATION')
  registerNewUser(data: any) {
    return this.authService.signUpMService(data);
  }
  //SIGN IN
  @MessagePattern('USER_SIGN_IN')
  signIn() {
    return 'user Sign In';
  }
}
