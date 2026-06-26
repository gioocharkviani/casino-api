import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminRole,
  AdminSessionEntity,
} from 'libs/database/entities/admin.entity';

export const ADMIN_ROLES_KEY = 'adminRoles';

export function RequireAdminRole(...roles: AdminRole[]) {
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(ADMIN_ROLES_KEY, roles, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(AdminSessionEntity)
    private readonly adminSessionRepo: Repository<AdminSessionEntity>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      throw new UnauthorizedException('Admin token not found');
    }

    const session = await this.adminSessionRepo.findOne({ where: { token } });

    if (!session || !session.token) {
      throw new UnauthorizedException('Invalid admin session');
    }

    if (session.expiresAt < new Date()) {
      await this.adminSessionRepo.delete({ id: session.id });
      throw new UnauthorizedException('Admin session expired');
    }

    const requiredRoles: AdminRole[] = this.reflector.get(
      ADMIN_ROLES_KEY,
      context.getHandler(),
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(session.adminRole)) {
        throw new ForbiddenException('Insufficient admin privileges');
      }
    }

    request.adminId = session.adminId;
    request.adminRole = session.adminRole;

    return true;
  }
}
