import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781557629484 implements MigrationInterface {
    name = 'InitialSchema1781557629484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_68a613538ff1bf4e70143b6b60e\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP COLUMN \`gameUUID\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD \`gameUUID\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` CHANGE \`updatedAt\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_68a613538ff1bf4e70143b6b60e\` FOREIGN KEY (\`gameUUID\`) REFERENCES \`games\`(\`gameUUID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_68a613538ff1bf4e70143b6b60e\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` CHANGE \`updatedAt\` \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP COLUMN \`gameUUID\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD \`gameUUID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_68a613538ff1bf4e70143b6b60e\` FOREIGN KEY (\`gameUUID\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
