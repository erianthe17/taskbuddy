import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WalletService } from './wallet.service';
import { CreateWalletTxnDto } from './dto/wallet.dto';
import type { Profile } from '../common/types';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  overview(@CurrentUser() user: Profile) {
    return this.walletService.overview(user);
  }

  @Post('transactions')
  create(@CurrentUser() user: Profile, @Body() dto: CreateWalletTxnDto) {
    return this.walletService.create(user, dto);
  }
}
