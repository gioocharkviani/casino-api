import { Injectable } from '@nestjs/common';

@Injectable()
export class RevolverService {
  getHello(): string {
    return 'Hello World!';
  }
}
