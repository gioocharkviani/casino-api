import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  // WALLET AUTH
  async walletAuth(data: any) {
    return data;
  }
  // END WALLET AUTH
}
