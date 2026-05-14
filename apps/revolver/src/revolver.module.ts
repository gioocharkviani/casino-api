import { Module } from '@nestjs/common';
import { RevolverController } from './revolver.controller';
import { RevolverService } from './revolver.service';

@Module({
  imports: [],
  controllers: [RevolverController],
  providers: [RevolverService],
})
export class RevolverModule {}
