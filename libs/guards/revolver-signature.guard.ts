import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RevolverSignatureGuard implements CanActivate {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('REVOLVER_HASH') || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (!body.sign) {
      throw new UnauthorizedException('Missing signature');
    }

    const receivedSign = body.sign;
    const { sign, ...params } = body;

    const flatParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'object' || value === null) {
        flatParams[key] = value;
      } else if (key === 'additionalData' && value) {
        for (const [subKey, subValue] of Object.entries(value as object)) {
          if (typeof subValue !== 'object') {
            flatParams[`${key}.${subKey}`] = subValue;
          }
        }
      }
    }

    const sortedKeys = Object.keys(flatParams).sort();
    const signString =
      sortedKeys.map((key) => flatParams[key]).join('') + this.secretKey;
    const calculatedSign = crypto
      .createHash('sha1')
      .update(signString)
      .digest('hex');

    if (calculatedSign !== receivedSign) {
      console.error('Signature validation failed', {
        expected: calculatedSign,
        received: receivedSign,
        signString: signString,
        params: flatParams,
      });
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
