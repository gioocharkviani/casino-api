import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781869287489 implements MigrationInterface {
    name = 'InitialSchema1781869287489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`promotions\` (\`id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transactions\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`type\` enum ('credit', 'debit&credit', 'deposit', 'debit', 'withdrawal', 'bonus', 'rollback', 'adjustment') NULL, \`amount\` bigint NULL, \`status\` enum ('pending', 'approved', 'processing', 'succeeded', 'faild') NULL, \`paymentId\` varchar(255) NULL, \`balance_before\` bigint NOT NULL, \`balance_after\` bigint NOT NULL, \`game_id\` varchar(255) NULL, \`round_id\` varchar(255) NULL, \`reason\` varchar(255) NOT NULL, \`transaction_id\` varchar(255) NULL, \`game_session_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_round_id\` (\`round_id\`), UNIQUE INDEX \`idx_transaction_id\` (\`transaction_id\`), INDEX \`idx_user_created\` (\`user_id\`, \`created_at\`), UNIQUE INDEX \`IDX_9162bf9ab4e31961a8f7932974\` (\`transaction_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_e9acc6efa76de013e8c1553ed2b\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_e9acc6efa76de013e8c1553ed2b\``);
        await queryRunner.query(`DROP INDEX \`IDX_9162bf9ab4e31961a8f7932974\` ON \`transactions\``);
        await queryRunner.query(`DROP INDEX \`idx_user_created\` ON \`transactions\``);
        await queryRunner.query(`DROP INDEX \`idx_transaction_id\` ON \`transactions\``);
        await queryRunner.query(`DROP INDEX \`idx_round_id\` ON \`transactions\``);
        await queryRunner.query(`DROP TABLE \`transactions\``);
        await queryRunner.query(`DROP TABLE \`promotions\``);
    }

}
