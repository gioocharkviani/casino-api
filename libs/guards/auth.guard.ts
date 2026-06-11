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
    const session_token = request?.cookies?.session_token;
    // Debug logging
    console.log('Headers:', request.headers);
    console.log('Cookies from cookie-parser:', request.cookies);
    console.log('Raw Cookie header:', request.headers?.cookie);

    if (!session_token) {
      throw new UnauthorizedException('token not found');
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
