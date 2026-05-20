import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from 'apps/api/src/auth/auth.service';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session_token = request?.cookies?.session_token;
    if (!session_token) {
      return false;
    }
    const checkTokenValidation =
      await this.authService.validateUserSessionToken(session_token);
    if (!checkTokenValidation?.valid) {
      return true;
    }
    return true;
  }
}
