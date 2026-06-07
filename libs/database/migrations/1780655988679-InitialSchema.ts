import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780655988679 implements MigrationInterface {
    name = 'InitialSchema1780655988679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` ADD \`expiresAt\` datetime NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` DROP COLUMN \`expiresAt\``);
    }

}
