import { Controller, Get } from '@nestjs/common';
import { RevolverService } from './revolver.service';

@Controller()
export class RevolverController {
  constructor(private readonly revolverService: RevolverService) {}

  @Get()
  getHello(): string {
    return this.revolverService.getHello();
  }
}
