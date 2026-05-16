import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //TODO register new user
  //TODO sign in functionally
  //TODO verification with email OR phone
  //TODO getUserInfoService
  //TODO block user with description
  //TODO user KYC verification if its important
}
