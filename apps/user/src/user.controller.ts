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
    return this.UserService.changeUserInfo(data);
  }

  // FORGOT PASSWORD
  @MessagePattern('USER_FORGOT_PASSWORD')
  forgotPassword(@Payload() email: string) {
    return this.UserService.forgotPassword(email);
  }

  // RESET PASSWORD
  @MessagePattern('USER_RESET_PASSWORD')
  resetPassword(@Payload() data: { token: string; newPassword: string }) {
    return this.UserService.resetPassword(data.token, data.newPassword);
  }

  // ADMIN: list all users (paginated)
  @MessagePattern('ADMIN_GET_USERS')
  adminGetUsers(@Payload() filters?: { page?: number; limit?: number; search?: string; isBlocked?: boolean; verified?: boolean }) {
    return this.UserService.adminGetAllUsers(filters);
  }

  // ADMIN: update user profile
  @MessagePattern('ADMIN_UPDATE_USER')
  adminUpdateUser(@Payload() data: { userId: string; firstName?: string; lastName?: string; email?: string; phone?: string; userName?: string; birthday?: string }) {
    return this.UserService.adminUpdateUser(data);
  }

  // ADMIN: get single user by id
  @MessagePattern('ADMIN_GET_USER_BY_ID')
  adminGetUserById(@Payload() userId: string) {
    return this.UserService.adminGetUserById(userId);
  }

  // ADMIN: block user
  @MessagePattern('ADMIN_BLOCK_USER')
  adminBlockUser(@Payload() data: { userId: string; reason?: string }) {
    return this.UserService.adminBlockUser(data);
  }

  // ADMIN: unblock user
  @MessagePattern('ADMIN_UNBLOCK_USER')
  adminUnblockUser(@Payload() userId: string) {
    return this.UserService.adminUnblockUser(userId);
  }

  // ADMIN: force activate/verify user
  @MessagePattern('ADMIN_ACTIVATE_USER')
  adminActivateUser(@Payload() userId: string) {
    return this.UserService.adminActivateUser(userId);
  }

  // ADMIN: set / update user personal ID
  @MessagePattern('ADMIN_SET_PERSONAL_ID')
  adminSetPersonalId(
    @Payload() data: { userId: string; personalId: string },
  ) {
    return this.UserService.adminSetPersonalId(data);
  }

  @MessagePattern('ADMIN_GET_USER_WAGERING')
  adminGetUserWagering(@Payload() userId: string) {
    return this.UserService.adminGetUserWagering(userId);
  }

  @MessagePattern('ADMIN_GET_ALL_WAGERING')
  adminGetAllWagering(@Payload() filters: { page?: number; limit?: number; search?: string }) {
    return this.UserService.adminGetAllWagering(filters);
  }

  // LEVELS
  @MessagePattern('GET_LEVELS')
  getLevels() {
    return this.UserService.getLevels();
  }

  @MessagePattern('GET_USER_LEVEL')
  getUserLevel(@Payload() token: string) {
    return this.UserService.getUserLevel(token);
  }

  @MessagePattern('ADMIN_CREATE_LEVEL')
  adminCreateLevel(@Payload() data: { name: string; minPoints: number; maxPoints: number; order?: number; description?: string; badgeUrl?: string }) {
    return this.UserService.adminCreateLevel(data);
  }

  @MessagePattern('ADMIN_UPDATE_LEVEL')
  adminUpdateLevel(@Payload() data: { id: number; name?: string; minPoints?: number; maxPoints?: number; order?: number; description?: string; badgeUrl?: string; isActive?: boolean }) {
    return this.UserService.adminUpdateLevel(data);
  }

  @MessagePattern('ADMIN_DELETE_LEVEL')
  adminDeleteLevel(@Payload() id: number) {
    return this.UserService.adminDeleteLevel(id);
  }
  // LEVELS
}
