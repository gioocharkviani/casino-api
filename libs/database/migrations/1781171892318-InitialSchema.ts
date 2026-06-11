import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781171892318 implements MigrationInterface {
    name = 'InitialSchema1781171892318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`xp\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`minPoints\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`maxPoints\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`order\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`description\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`badgeUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`isActive\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`name\` varchar(100) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`isActive\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`badgeUrl\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`order\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`maxPoints\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` DROP COLUMN \`minPoints\``);
        await queryRunner.query(`ALTER TABLE \`user-levels\` ADD \`xp\` int NOT NULL`);
    }

}
