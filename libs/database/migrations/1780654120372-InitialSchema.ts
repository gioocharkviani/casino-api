import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780654120372 implements MigrationInterface {
    name = 'InitialSchema1780654120372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_verification_entity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` varchar(255) NOT NULL, \`otp\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`game_categories\` DROP COLUMN \`categories\``);
        await queryRunner.query(`ALTER TABLE \`game_categories\` ADD \`categories\` enum ('NEW', 'TOP') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`type\` \`type\` enum ('credit', 'debit&credit', 'deposit', 'debit', 'withdrawal', 'bonus', 'rollback', 'adjustment') NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`amount\` \`amount\` bigint NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`amount\` \`amount\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`type\` \`type\` enum ('bet', 'credit', 'deposit', 'debit', 'withdrawal', 'bonus', 'rollback', 'adjustment') NULL`);
        await queryRunner.query(`ALTER TABLE \`game_categories\` DROP COLUMN \`categories\``);
        await queryRunner.query(`ALTER TABLE \`game_categories\` ADD \`categories\` varchar(255) NOT NULL`);
        await queryRunner.query(`DROP TABLE \`user_verification_entity\``);
    }

}
