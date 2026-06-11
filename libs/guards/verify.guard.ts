import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from 'apps/api/src/user/user.service';

@Injectable()
export class VerifyGuard implements CanActivate {
  constructor(private readonly UserService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    const session_token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!session_token) {
      throw new ForbiddenException(' token missing. Please authenticate.');
    }

    const userInfo = await this.UserService.getUserInfo(session_token);

    if (!userInfo || !userInfo.verified) {
      throw new ForbiddenException(
        'User account is not verified. Please complete verification before accessing this resource.',
      );
    }

    return true;
  }
}
