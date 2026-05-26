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
  // COUNTRY SEEDER
  private async countrySeeder() {
    await this.countryRepository.deleteAll();

    const licenseByName: Record<string, string> = {};
    const licenseByCode: Record<string, string> = {};

    const dummyDataForLicenseCountry = [
      { country: 'Malta', countryCode: 'MT', license: 'MGA' },
      { country: 'United Kingdom', countryCode: 'GB', license: 'UKGC' },
      { country: 'Gibraltar', countryCode: 'GI', license: 'GRA' },
      { country: 'Isle of Man', countryCode: 'IM', license: 'GSC' },
      { country: 'Alderney', countryCode: 'GG', license: 'AGCC' },
      { country: 'Curaçao', countryCode: 'CW', license: 'CGA' },
      { country: 'Estonia', countryCode: 'EE', license: 'EMTA' },
      { country: 'Sweden', countryCode: 'SE', license: 'SGA' },
      { country: 'Denmark', countryCode: 'DK', license: 'DGA' },
      { country: 'Italy', countryCode: 'IT', license: 'ADM' },
      { country: 'Spain', countryCode: 'ES', license: 'DGOJ' },
      { country: 'France', countryCode: 'FR', license: 'ANJ' },
      { country: 'Netherlands', countryCode: 'NL', license: 'KSA' },
      { country: 'Germany', countryCode: 'DE', license: 'GGL' },
      { country: 'Belgium', countryCode: 'BE', license: 'BGC' },
      { country: 'Poland', countryCode: 'PL', license: 'MoF' },
      { country: 'Ireland', countryCode: 'IE', license: 'GRAI' },
      { country: 'Romania', countryCode: 'RO', license: 'ONJN' },
      { country: 'Czech Republic', countryCode: 'CZ', license: 'MF' },
      { country: 'Greece', countryCode: 'GR', license: 'HGC' },
      { country: 'Bulgaria', countryCode: 'BG', license: 'SCG' },
      { country: 'Portugal', countryCode: 'PT', license: 'SRIJ' },
      { country: 'Latvia', countryCode: 'LV', license: 'IAUI' },
      { country: 'Lithuania', countryCode: 'LT', license: 'GCTL' },
      { country: 'Switzerland', countryCode: 'CH', license: 'SFGB' },
      { country: 'Ukraine', countryCode: 'UA', license: 'KRAIL' },
      { country: 'Anjouan', countryCode: 'KM', license: 'AAG' },
      { country: 'Vanuatu', countryCode: 'VU', license: 'VFSC' },
      { country: 'Costa Rica', countryCode: 'CR', license: 'None' },
      { country: 'South Africa', countryCode: 'ZA', license: 'WCG' },
      { country: 'Canada', countryCode: 'CA', license: 'Provincial' },
      { country: 'Argentina', countryCode: 'AR', license: 'Provincial' },
      { country: 'Brazil', countryCode: 'BR', license: 'SPA/MF' },
    ];

    // Populate lookup maps
    for (const item of dummyDataForLicenseCountry) {
      licenseByName[item.country] = item.license;
      licenseByCode[item.countryCode] = item.license;
    }

    // Fetch countries from external API
    const req = await fetch(`https://www.apicountries.com/countries`);
    const res = await req.json();

    const data: country[] = [];

    for (let i = 0; i < res.length; i++) {
      const apiCountry = res[i];
      const countryName = apiCountry?.name;
      const countryCode = apiCountry?.alpha2Code;
      let license = '';
      if (countryName && licenseByName[countryName]) {
        license = licenseByName[countryName];
      } else if (countryCode && licenseByCode[countryCode]) {
        license = licenseByCode[countryCode];
      }

      data.push({
        countryCode: countryCode,
        name: countryName,
        license: license,
      });
    }

    await this.countryRepository.save(data);
  }
  // COUNTRY SEEDER
}
