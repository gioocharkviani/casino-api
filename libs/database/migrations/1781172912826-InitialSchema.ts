import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781172912826 implements MigrationInterface {
    name = 'InitialSchema1781172912826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`xp\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`xp\``);
    }

}
