import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781374032936 implements MigrationInterface {
    name = 'InitialSchema1781374032936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`promotion_rules\` (\`id\` varchar(36) NOT NULL, \`promotionId\` varchar(255) NOT NULL, \`triggerCondition\` json NULL, \`rewardType\` enum ('bonus_balance', 'real_balance', 'free_spins', 'vip_points') NOT NULL, \`rewardValue\` json NOT NULL, \`wageringMultiplier\` decimal(10,2) NOT NULL DEFAULT '0.00', \`gameWeights\` json NULL, \`maxBetPerSpin\` decimal(10,2) NULL, \`maxWithdrawalFromBonus\` decimal(10,2) NULL, \`expiryDays\` int NOT NULL DEFAULT '30', \`minBetRequirement\` decimal(10,2) NULL, \`requiresKyc\` tinyint NOT NULL DEFAULT 0, \`cashbackConfig\` json NULL, \`tournamentConfig\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`isActive\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`promoType\` enum ('welcome', 'nodeposit', 'freespins', 'reload', 'cashback', 'highroller', 'loyalty', 'tournament', 'birthday', 'referral', 'nowager', 'drip', 'relocation', 'achievement') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`status\` enum ('draft', 'active', 'paused', 'expired', 'archived') NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`startDate\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`endDate\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`targetAudience\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`maxUsagePerUser\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`maxTotalUsage\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`currentTotalUsage\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`priority\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`isStackable\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`name\` varchar(100) NOT NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_287893151feea00a89d590e35d\` ON \`promotions\` (\`promoType\`, \`status\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_53632bc3a36b3969f1b262de51\` ON \`promotions\` (\`status\`, \`startDate\`, \`endDate\`)`);
        await queryRunner.query(`ALTER TABLE \`promotion_rules\` ADD CONSTRAINT \`FK_601560bbf10d70de1395cb5a5fb\` FOREIGN KEY (\`promotionId\`) REFERENCES \`promotions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`promotion_rules\` DROP FOREIGN KEY \`FK_601560bbf10d70de1395cb5a5fb\``);
        await queryRunner.query(`DROP INDEX \`IDX_53632bc3a36b3969f1b262de51\` ON \`promotions\``);
        await queryRunner.query(`DROP INDEX \`IDX_287893151feea00a89d590e35d\` ON \`promotions\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`isStackable\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`priority\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`currentTotalUsage\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`maxTotalUsage\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`maxUsagePerUser\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`targetAudience\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`endDate\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`startDate\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`promoType\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`isActive\` tinyint NOT NULL DEFAULT '1'`);
        await queryRunner.query(`DROP TABLE \`promotion_rules\``);
    }

}
