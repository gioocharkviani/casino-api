import { Inject, Injectable } from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_M_SERVICE')
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
  async signIn(data: SignInDto) {
    return data;
  }
}
