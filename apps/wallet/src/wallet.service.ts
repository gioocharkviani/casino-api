import { Injectable } from '@nestjs/common';
import { WalletAuthDto } from 'libs/common/dto/wallet.dto';

@Injectable()
export class WalletService {
  // WALLET AUTH
  async walletAuth(data: WalletAuthDto) {
    return data;
  }
  // END WALLET AUTH
}
