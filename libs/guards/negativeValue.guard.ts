// negative-value.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class NegativeValueGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const data = request.body;
    console.log(data);

    if (data.amount !== undefined && data.amount < 0) {
      request.negativeValueError = {
        code: 1503,
        data: null,
        message: 'amount cannot be negative',
      };
      return false;
    }

    if (data.debitAmount !== undefined && data.debitAmount < 0) {
      request.negativeValueError = {
        code: 1503,
        data: null,
        message: 'debitAmount cannot be negative',
      };
      return false;
    }

    if (data.creditAmount !== undefined && data.creditAmount < 0) {
      request.negativeValueError = {
        code: 1503,
        data: null,
        message: 'creditAmount cannot be negative',
      };
      return false;
    }

    return true;
  }
}
