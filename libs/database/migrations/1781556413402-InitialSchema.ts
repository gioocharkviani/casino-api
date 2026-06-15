import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781556413402 implements MigrationInterface {
    name = 'InitialSchema1781556413402'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP COLUMN \`gameId\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD \`gameId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_4202f6ac498778aaf52f01fe176\` FOREIGN KEY (\`gameId\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_4202f6ac498778aaf52f01fe176\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP COLUMN \`gameId\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD \`gameId\` varchar(255) NOT NULL`);
    }

}
