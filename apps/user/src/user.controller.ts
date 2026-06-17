import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  changeUserInfoDto,
  SignInDtoMS,
  SignUpDto,
  verifyDto,
} from 'libs/common';

@Controller()
export class UserController {
  constructor(private readonly UserService: UserService) {}

  // REGISTER NEW USER
  @MessagePattern('NEW_USER_REGISTRATION')
  registerNewUser(data: SignUpDto) {
    return this.UserService.signUpMService(data);
  }
  //SIGN IN
  @MessagePattern('USER_SIGN_IN')
  signIn(data: SignInDtoMS) {
    return this.UserService.signInUser(data);
  }
  //SIGN OUT
  @MessagePattern('USER_SIGN_OUT')
  signOut(token?: string | null) {
    return this.UserService.signOutUser(token);
  }

  //GET USER INFO
  @MessagePattern('GET_USER')
  getUserInfo(token?: string) {
    return this.UserService.getUserInfo(token);
  }
  //GET USER INFO
  @MessagePattern('TOKEN_VALIDATION')
  tokenValidation(token?: string) {
    return this.UserService.validateUserSession(token);
  }
  //USER VERIFICATION
  @MessagePattern('USER_VERIFICATION')
  verifyUser(data: verifyDto) {
    return this.UserService.userVerficiation(data);
  }
  //CHANGE USER XP
  @EventPattern('USER_XP')
  changeUserXp(@Payload() userId?: string) {
    return this.UserService.changeUserLevel(userId);
  }
  //CHANGE USER INFO
  @MessagePattern('CHANGE_USER_INFO')
  changeUserInfo(@Payload() data: changeUserInfoDto) {
    console.log(data);
    return this.UserService.changeUserInfo(data);
  }
}
