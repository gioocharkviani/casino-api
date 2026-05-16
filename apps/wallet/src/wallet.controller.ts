import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  //TODO create wallet endopint to getUser balanse
  //TODO create service for update user balanse for increese user balanse in db
  //TODO create service for update user balanse for decreeese user balanse in db
  //TODO create service for update user balanse for revoke user balanse in db
}
