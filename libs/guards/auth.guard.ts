import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'apps/api/src/user/user.service';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly UserService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers?.authorization;
    const session_token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!session_token) {
      throw new UnauthorizedException('Token not found');
    }

    const validation =
      await this.UserService.validateUserSessionToken(session_token);

    if (!validation.valid) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.userId = validation.userId;
    return true;
  }
}
