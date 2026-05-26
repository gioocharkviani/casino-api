import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from 'apps/api/src/auth/auth.service';

@Injectable()
export class VerifyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session_token = request?.cookies?.session_token;

    if (!session_token) {
      throw new ForbiddenException(
        'Session token missing. Please authenticate.',
      );
    }

    const userInfo = await this.authService.getUserInfo(session_token);

    if (!userInfo || !userInfo.verified) {
      throw new ForbiddenException(
        'User account is not verified. Please complete verification before accessing this resource.',
      );
    }

    return true;
  }
}
