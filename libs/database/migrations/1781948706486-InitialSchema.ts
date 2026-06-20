import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781948706486 implements MigrationInterface {
    name = 'InitialSchema1781948706486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_68a613538ff1bf4e70143b6b60e\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD \`game_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_04a5d46e499eed58fa569472447\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_04a5d46e499eed58fa569472447\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP COLUMN \`game_id\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_68a613538ff1bf4e70143b6b60e\` FOREIGN KEY (\`gameUUID\`) REFERENCES \`games\`(\`gameUUID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
