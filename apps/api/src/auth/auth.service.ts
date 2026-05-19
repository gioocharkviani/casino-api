import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SignInDto, SignInDtoMS, SignUpDto } from 'libs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_MS_SERVICE')
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
}
