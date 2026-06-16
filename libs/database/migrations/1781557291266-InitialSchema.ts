import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781557291266 implements MigrationInterface {
    name = 'InitialSchema1781557291266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_4202f6ac498778aaf52f01fe176\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_4202f6ac498778aaf52f01fe176\` FOREIGN KEY (\`gameUUID\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
