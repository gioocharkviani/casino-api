import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';
import { SignInDtoMS, SignUpDto, verifyDto } from 'libs/common';

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
  //SIGN OUT
  @MessagePattern('USER_SIGN_OUT')
  signOut(token?: string | null) {
    return this.authService.signOutUser(token);
  }

  //GET USER INFO
  @MessagePattern('GET_USER')
  getUserInfo(token?: string) {
    return this.authService.getUserInfo(token);
  }
  //GET USER INFO
  @MessagePattern('TOKEN_VALIDATION')
  tokenValidation(token?: string) {
    return this.authService.validateUserSession(token);
  }
  //USER VERIFICATION
  @MessagePattern('USER_VERIFICATION')
  verifyUser(data: verifyDto) {
    return this.authService.userVerficiation(data);
  }
}
