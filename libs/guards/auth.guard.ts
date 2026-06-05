import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'apps/api/src/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session_token = request?.cookies?.session_token;

    if (!session_token) {
      throw new UnauthorizedException(' token not found');
    }

    const validation =
      await this.authService.validateUserSessionToken(session_token);

    if (!validation.valid) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.userId = validation.userId;

    return true;
  }
}
