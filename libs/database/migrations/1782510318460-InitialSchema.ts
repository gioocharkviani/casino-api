import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782510318460 implements MigrationInterface {
    name = 'InitialSchema1782510318460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`admins\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(100) NOT NULL, \`password\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(100) NULL, \`lastName\` varchar(100) NULL, \`role\` enum ('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'moderator', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_4ba6d0c734d53f8e1b2e24b6c5\` (\`username\`), UNIQUE INDEX \`IDX_051db7d37d478a69a7432df147\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin_sessions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`token\` varchar(255) NULL, \`ip\` varchar(255) NULL, \`adminId\` varchar(255) NOT NULL, \`adminRole\` enum ('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'moderator', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` datetime NOT NULL, UNIQUE INDEX \`IDX_9412db96e8933fd0c58fdbf0b2\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_promotions\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, \`promotionId\` varchar(36) NOT NULL, \`status\` enum ('assigned', 'active', 'completed', 'expired', 'cancelled') NOT NULL DEFAULT 'assigned', \`bonusBalance\` bigint NOT NULL DEFAULT '0', \`wageringRequired\` bigint NOT NULL DEFAULT '0', \`wageringCompleted\` bigint NOT NULL DEFAULT '0', \`activatedAt\` timestamp NULL, \`expiresAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_user_promo_pair\` (\`userId\`, \`promotionId\`), INDEX \`idx_user_promo_user_status\` (\`userId\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotion_audit_log\` (\`id\` varchar(36) NOT NULL, \`action\` enum ('created', 'updated', 'assigned', 'activated', 'credited', 'completed', 'expired', 'cancelled') NOT NULL, \`promotionId\` varchar(36) NULL, \`userId\` varchar(36) NULL, \`performedBy\` varchar(255) NULL, \`metadata\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_audit_user\` (\`userId\`), INDEX \`idx_audit_promo\` (\`promotionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`name\` varchar(150) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`description\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`type\` enum ('welcome', 'no_deposit', 'free_spins', 'reload', 'cashback', 'high_roller', 'loyalty', 'tournament', 'birthday', 'referral', 'no_wager') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`status\` enum ('draft', 'active', 'paused', 'archived') NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`rewardType\` enum ('bonus_balance', 'real_balance', 'free_spins') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`rewardValue\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`wageringMultiplier\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`gameWeights\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`triggerCondition\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`targetAudience\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`maxWithdrawal\` bigint NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`maxUsagePerUser\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`validityHours\` int NOT NULL DEFAULT '72'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`startDate\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`endDate\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE INDEX \`idx_promo_status_type\` ON \`promotions\` (\`status\`, \`type\`)`);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` ADD CONSTRAINT \`FK_97451e00599a75f4d278179c8e0\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` ADD CONSTRAINT \`FK_9013afb6178e900584cbcfb24f8\` FOREIGN KEY (\`promotionId\`) REFERENCES \`promotions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_promotions\` DROP FOREIGN KEY \`FK_9013afb6178e900584cbcfb24f8\``);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` DROP FOREIGN KEY \`FK_97451e00599a75f4d278179c8e0\``);
        await queryRunner.query(`DROP INDEX \`idx_promo_status_type\` ON \`promotions\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`endDate\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`startDate\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`validityHours\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`maxUsagePerUser\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`maxWithdrawal\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`targetAudience\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`triggerCondition\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`gameWeights\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`wageringMultiplier\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`rewardValue\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`rewardType\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`name\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_promo\` ON \`promotion_audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_user\` ON \`promotion_audit_log\``);
        await queryRunner.query(`DROP TABLE \`promotion_audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_user_promo_user_status\` ON \`user_promotions\``);
        await queryRunner.query(`DROP INDEX \`idx_user_promo_pair\` ON \`user_promotions\``);
        await queryRunner.query(`DROP TABLE \`user_promotions\``);
        await queryRunner.query(`DROP INDEX \`IDX_9412db96e8933fd0c58fdbf0b2\` ON \`admin_sessions\``);
        await queryRunner.query(`DROP TABLE \`admin_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_051db7d37d478a69a7432df147\` ON \`admins\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ba6d0c734d53f8e1b2e24b6c5\` ON \`admins\``);
        await queryRunner.query(`DROP TABLE \`admins\``);
    }

}
