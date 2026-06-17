import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  changeUserInfoDto,
  SignInDto,
  SignInDtoMS,
  SignUpDto,
  verifyDto,
} from 'libs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_MS_SERVICE')
    private readonly client: ClientProxy,
  ) {}
  //USER REGISTER SERVICE
  async signUp(data: SignUpDto) {
    const result = await lastValueFrom(
      this.client.send('NEW_USER_REGISTRATION', data),
    );
    return result;
  }
  //USER SIGNIN SERVICE
  async signIn(data: SignInDtoMS) {
    const result = await lastValueFrom(this.client.send('USER_SIGN_IN', data));
    return result;
  }

  //USER SIGN-OUT
  async signOut(token?: string | null) {
    const result = await lastValueFrom(
      this.client.send('USER_SIGN_OUT', token),
    );
    return result;
  }

  //GET USER INFORMATION
  async getUserInfo(token?: string) {
    const result = await lastValueFrom(this.client.send('GET_USER', token));
    return result;
  }

  //CHANGE USER INFORMATION
  async changeUserInfo(data: changeUserInfoDto) {
    console.log('inside api service', data);
    const result = await lastValueFrom(
      this.client.send('CHANGE_USER_INFO', { data }),
    );
    return result;
  }

  //VALIDATE USER SESSION TOKEN
  async validateUserSessionToken(token?: string) {
    const result = await lastValueFrom(
      this.client.send('TOKEN_VALIDATION', token),
    );
    return result;
  }
  //VERIFY USER
  async verifyUser(data: verifyDto) {
    const result = await lastValueFrom(
      this.client.send('USER_VERIFICATION', data),
    );
    return result;
  }
}
