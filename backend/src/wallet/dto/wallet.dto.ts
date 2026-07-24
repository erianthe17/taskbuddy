import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import type { WalletTxnDirection } from '../../common/types';

export class CreateWalletTxnDto {
  @IsIn(['credit', 'debit'])
  direction!: WalletTxnDirection;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsString()
  @Length(1, 120)
  title!: string;

  @IsOptional()
  @IsUUID()
  job_id?: string;
}
