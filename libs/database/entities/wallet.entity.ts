import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wallet')
export class walletEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false, default: 0 })
  balance!: number;
  @Column({ default: 'USD' })
  currency!: string;
}

// {
//  "code": 200,
//  "data": {
//  "playerId": 7,
//  "currency": "GBP",
//  "language": "en",
//  "nickname": "Daniel",
//  "balance": 100006,
//  "license":"MT",
//  "countryCode":"HR"
//  "sessionState": {},
//  "brand": "website-1",
//  “additionalData”: {
//  “betLimit”: 2,
//  “age”: 26
//  }
//  },
//  "message": "Success"
// }
