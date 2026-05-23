// src/seed/seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryEntity } from '../entities/country.entity';
import { country } from 'libs/common';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(CountryEntity)
    private countryRepository: Repository<CountryEntity>,
  ) {}

  async run() {
    await this.countrySeeder();
    console.log('🌱 Database seeding completed!');
  }

  //COUNTRY SEEDER
  private async countrySeeder() {
    await this.countryRepository.deleteAll();
    const data: country[] = [];

    const req = await fetch(`https://www.apicountries.com/countries`);
    const res = await req.json();
    for (let i = 0; i <= res.length; i++) {
      data.push({
        countryCode: res[i]?.alpha2Code,
        name: res[i]?.name,
        license: '',
      });
    }
    await this.countryRepository.save(data);
  }
  //COUNTRY SEEDER
}
