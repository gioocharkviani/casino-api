import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780656096444 implements MigrationInterface {
    name = 'InitialSchema1780656096444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` ADD \`expiresAt\` datetime NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` DROP COLUMN \`expiresAt\``);
    }

}
