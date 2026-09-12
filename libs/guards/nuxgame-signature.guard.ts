import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * PLACEHOLDER — mirrors RevolverSignatureGuard's shape but the actual
 * NuxGame signature algorithm/header is unknown until their API docs are
 * read (via the nuxgame-aggregation MCP server) or keys/spec are provided.
 * TODO: replace signString construction + hash algorithm with NuxGame's
 * real formula, and confirm whether the signature travels in the body
 * (like Revolver's `sign`) or in a request header.
 */
@Injectable()
export class NuxgameSignatureGuard implements CanActivate {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('NUXGAME_HASH') || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const body = request.body;

    if (!body.sign) {
      response.status(200).json({
        code: 1403,
        data: null,
        message: 'Missing signature',
      });
      return false;
    }

    const receivedSign = body.sign;
    const { sign, ...params } = body;

    const flatParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'object' || value === null) {
        flatParams[key] = value;
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
      console.error('NuxGame signature validation failed', {
        expected: calculatedSign,
        received: receivedSign,
      });
      response.status(200).json({
        code: 1403,
        data: null,
        message: 'Wrong Signature',
      });
      return false;
    }

    return true;
  }
}
