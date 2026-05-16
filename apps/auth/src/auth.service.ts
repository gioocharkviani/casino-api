import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async getHello() {
    return 'Hello World!';
  }
}
