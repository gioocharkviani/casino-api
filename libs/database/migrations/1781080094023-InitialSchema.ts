import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781080094023 implements MigrationInterface {
    name = 'InitialSchema1781080094023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`bonus-wallet\` (\`id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_wagering_stats\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`totalDeposits\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalWithdrawals\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalDebit\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalCredit\` decimal(15,2) NOT NULL DEFAULT '0.00', \`totalWagered\` decimal(15,2) NOT NULL DEFAULT '0.00', \`netProfit\` decimal(15,2) NOT NULL DEFAULT '0.00', \`rtp\` decimal(5,2) NOT NULL DEFAULT '0.00', \`bonusBetsCount\` int NOT NULL DEFAULT '0', \`bonusWinnings\` decimal(15,2) NOT NULL DEFAULT '0.00', \`todayWagered\` decimal(15,2) NOT NULL DEFAULT '0.00', \`weeklyWagered\` decimal(15,2) NOT NULL DEFAULT '0.00', \`monthlyWagered\` decimal(15,2) NOT NULL DEFAULT '0.00', \`lastActivityDate\` timestamp NULL, \`lastResetDate\` date NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_4021be3a815d16bcedeee3e0a5\` (\`userId\`), UNIQUE INDEX \`REL_4021be3a815d16bcedeee3e0a5\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` ADD CONSTRAINT \`FK_4021be3a815d16bcedeee3e0a51\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_wagering_stats\` DROP FOREIGN KEY \`FK_4021be3a815d16bcedeee3e0a51\``);
        await queryRunner.query(`DROP INDEX \`REL_4021be3a815d16bcedeee3e0a5\` ON \`user_wagering_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_4021be3a815d16bcedeee3e0a5\` ON \`user_wagering_stats\``);
        await queryRunner.query(`DROP TABLE \`user_wagering_stats\``);
        await queryRunner.query(`DROP TABLE \`bonus-wallet\``);
    }

}
