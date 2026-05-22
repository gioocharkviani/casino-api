import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from 'apps/api/src/auth/auth.service';

@Injectable()
export class VerifyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session_token = request?.cookies?.session_token;
    if (!session_token) {
      return false;
    }
    const checkifUsreIsVerifyd =
      await this.authService.getUserInfo(session_token);
    if (!checkifUsreIsVerifyd.verified) {
      return false;
    }
    return true;
  }
}
