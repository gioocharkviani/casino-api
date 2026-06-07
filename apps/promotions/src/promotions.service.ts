import { Injectable } from '@nestjs/common';

@Injectable()
export class PromotionsService {
  getHello(): string {
    return 'Hello World!';
  }
}
