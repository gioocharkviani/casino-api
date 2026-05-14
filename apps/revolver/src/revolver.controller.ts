import { Controller } from '@nestjs/common';
import { RevolverService } from './revolver.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class RevolverController {
  constructor(private readonly revolverService: RevolverService) {}

  @MessagePattern('getAllGames')
  getAllGames(): string {
    return this.revolverService.getAllGames();
  }
}
