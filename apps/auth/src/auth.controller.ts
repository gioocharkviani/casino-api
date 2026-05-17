import { Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER NEW USER
  @MessagePattern('NEW_USER_REGISTRATION')
  registerNewUser() {
    return 'user register succesfully';
  }
  //SIGN IN
  @MessagePattern('NEW_USER_REGISTRATION')
  signIn() {
    return 'user Sign In';
  }
  //TODO verification with email OR phone
  //TODO getUserInfoService
  //TODO block user with description
  //TODO user KYC verification if its important
}
