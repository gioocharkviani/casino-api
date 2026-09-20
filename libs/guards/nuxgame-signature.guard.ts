import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Verifies NuxGame's `Hash-Authorization` header on callback requests
 * (Nuxgame -> us: /playerDetails, /sessionCheck, /getBalance, /moveFunds).
 *
 * Per apidoc.fungamess.games/nuxgame-aggregation/general-info/request-signature:
 * the reference PHP implementation does, in order —
 *   1. take GET or POST params (whichever the request used)
 *   2. drop `extraData` if present
 *   3. ksort() the remaining keys
 *   4. array_map('strval', ...) — stringify every value
 *   5. json_encode() the sorted, stringified map
 *   6. sha256(json + secretKey)
 * and compares that against the `Hash-Authorization` header.
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

    const receivedSign = request.headers['hash-authorization'];
    if (!receivedSign) {
      response.status(200).json({
        status: false,
        errors: { code: 1004, error: 'Missing Hash-Authorization header' },
      });
      return false;
    }

    const source = request.method === 'GET' ? request.query : request.body;
    const sorted: Record<string, string> = {};
    for (const key of Object.keys(source ?? {}).sort()) {
      if (key === 'extraData') continue;
      const value = source[key];
      if (value === undefined || value === null) continue;
      sorted[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    const json = JSON.stringify(sorted);
    const calculatedSign = crypto
      .createHash('sha256')
      .update(json + this.secretKey)
      .digest('hex');

    if (calculatedSign !== receivedSign) {
      console.error('NuxGame signature validation failed', {
        expected: calculatedSign,
        received: receivedSign,
      });
      response.status(200).json({
        status: false,
        errors: { code: 1004, error: 'Invalid hash' },
      });
      return false;
    }

    return true;
  }
}
