import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782663114123 implements MigrationInterface {
    name = 'InitialSchema1782663114123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`admins\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(100) NOT NULL, \`password\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(100) NULL, \`lastName\` varchar(100) NULL, \`role\` enum ('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'moderator', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_4ba6d0c734d53f8e1b2e24b6c5\` (\`username\`), UNIQUE INDEX \`IDX_051db7d37d478a69a7432df147\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin_sessions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`token\` varchar(255) NULL, \`ip\` varchar(255) NULL, \`adminId\` varchar(255) NOT NULL, \`adminRole\` enum ('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'moderator', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` datetime NOT NULL, UNIQUE INDEX \`IDX_9412db96e8933fd0c58fdbf0b2\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user-levels\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`minPoints\` int NOT NULL, \`maxPoints\` int NOT NULL, \`order\` int NOT NULL DEFAULT '0', \`description\` varchar(255) NULL, \`badgeUrl\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`favorite-games\` (\`id\` int NOT NULL AUTO_INCREMENT, \`playerId\` varchar(255) NOT NULL, \`gameUUID\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotions\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` varchar(500) NULL, \`type\` enum ('welcome', 'no_deposit', 'free_spins', 'reload', 'cashback', 'high_roller', 'loyalty', 'tournament', 'birthday', 'referral', 'no_wager') NOT NULL, \`status\` enum ('draft', 'active', 'paused', 'archived') NOT NULL DEFAULT 'draft', \`rewardType\` enum ('bonus_balance', 'real_balance', 'free_spins') NOT NULL, \`rewardValue\` json NULL, \`wageringMultiplier\` int NOT NULL DEFAULT '0', \`gameWeights\` json NULL, \`triggerCondition\` json NULL, \`targetAudience\` json NULL, \`maxWithdrawal\` bigint NULL, \`maxUsagePerUser\` int NOT NULL DEFAULT '1', \`validityHours\` int NOT NULL DEFAULT '72', \`startDate\` timestamp NULL, \`endDate\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_promo_status_type\` (\`status\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_promotions\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, \`promotionId\` varchar(36) NOT NULL, \`status\` enum ('assigned', 'active', 'completed', 'expired', 'cancelled') NOT NULL DEFAULT 'assigned', \`bonusBalance\` bigint NOT NULL DEFAULT '0', \`wageringRequired\` bigint NOT NULL DEFAULT '0', \`wageringCompleted\` bigint NOT NULL DEFAULT '0', \`activatedAt\` timestamp NULL, \`expiresAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_user_promo_pair\` (\`userId\`, \`promotionId\`), INDEX \`idx_user_promo_user_status\` (\`userId\`, \`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotion_audit_log\` (\`id\` varchar(36) NOT NULL, \`action\` enum ('created', 'updated', 'assigned', 'activated', 'credited', 'completed', 'expired', 'cancelled') NOT NULL, \`promotionId\` varchar(36) NULL, \`userId\` varchar(36) NULL, \`performedBy\` varchar(255) NULL, \`metadata\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_audit_user\` (\`userId\`), INDEX \`idx_audit_promo\` (\`promotionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`bonus-wallet\` ADD \`bonus\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`xp\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`personalId\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_9acd140c7131c76a02981b4138\` (\`personalId\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`isBlocked\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`blockReason\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`status\` enum ('pending', 'approved', 'processing', 'succeeded', 'faild') NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`paymentId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalDeposits\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalDeposits\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalWithdrawals\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalWithdrawals\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalDebit\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalDebit\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalCredit\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalCredit\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalWagered\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`netProfit\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`netProfit\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`bonusWinnings\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`bonusWinnings\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`todayWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`todayWagered\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`weeklyWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`weeklyWagered\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`monthlyWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`monthlyWagered\` bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`lastResetDate\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`lastResetDate\` timestamp NULL`);
        await queryRunner.query(`CREATE INDEX \`idx_game_id\` ON \`transactions\` (\`game_id\`)`);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` ADD CONSTRAINT \`FK_68a613538ff1bf4e70143b6b60e\` FOREIGN KEY (\`gameUUID\`) REFERENCES \`games\`(\`gameUUID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` ADD CONSTRAINT \`FK_97451e00599a75f4d278179c8e0\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` ADD CONSTRAINT \`FK_9013afb6178e900584cbcfb24f8\` FOREIGN KEY (\`promotionId\`) REFERENCES \`promotions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_20492232b7f3acb3ef924fa92a7\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`gameUUID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_20492232b7f3acb3ef924fa92a7\``);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` DROP FOREIGN KEY \`FK_9013afb6178e900584cbcfb24f8\``);
        await queryRunner.query(`ALTER TABLE \`user_promotions\` DROP FOREIGN KEY \`FK_97451e00599a75f4d278179c8e0\``);
        await queryRunner.query(`ALTER TABLE \`favorite-games\` DROP FOREIGN KEY \`FK_68a613538ff1bf4e70143b6b60e\``);
        await queryRunner.query(`DROP INDEX \`idx_game_id\` ON \`transactions\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`lastResetDate\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`lastResetDate\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`monthlyWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`monthlyWagered\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`weeklyWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`weeklyWagered\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`todayWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`todayWagered\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`bonusWinnings\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`bonusWinnings\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`netProfit\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`netProfit\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalWagered\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalWagered\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalCredit\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalCredit\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalDebit\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalDebit\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalWithdrawals\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalWithdrawals\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP COLUMN \`totalDeposits\``);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD \`totalDeposits\` decimal(15,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`paymentId\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`blockReason\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`isBlocked\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_9acd140c7131c76a02981b4138\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`personalId\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`xp\``);
        await queryRunner.query(`ALTER TABLE \`bonus-wallet\` DROP COLUMN \`bonus\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_promo\` ON \`promotion_audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_user\` ON \`promotion_audit_log\``);
        await queryRunner.query(`DROP TABLE \`promotion_audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_user_promo_user_status\` ON \`user_promotions\``);
        await queryRunner.query(`DROP INDEX \`idx_user_promo_pair\` ON \`user_promotions\``);
        await queryRunner.query(`DROP TABLE \`user_promotions\``);
        await queryRunner.query(`DROP INDEX \`idx_promo_status_type\` ON \`promotions\``);
        await queryRunner.query(`DROP TABLE \`promotions\``);
        await queryRunner.query(`DROP TABLE \`favorite-games\``);
        await queryRunner.query(`DROP TABLE \`user-levels\``);
        await queryRunner.query(`DROP INDEX \`IDX_9412db96e8933fd0c58fdbf0b2\` ON \`admin_sessions\``);
        await queryRunner.query(`DROP TABLE \`admin_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_051db7d37d478a69a7432df147\` ON \`admins\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ba6d0c734d53f8e1b2e24b6c5\` ON \`admins\``);
        await queryRunner.query(`DROP TABLE \`admins\``);
    }

}
