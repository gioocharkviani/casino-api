import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781557045100 implements MigrationInterface {
    name = 'InitialSchema1781557045100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` CHANGE \`gameId\` \`gameUUID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_68a613538ff1bf4e70143b6b60e\` FOREIGN KEY (\`gameUUID\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_68a613538ff1bf4e70143b6b60e\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` CHANGE \`gameUUID\` \`gameId\` int NOT NULL`);
    }

}
