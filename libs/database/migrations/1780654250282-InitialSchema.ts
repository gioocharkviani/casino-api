import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780654250282 implements MigrationInterface {
    name = 'InitialSchema1780654250282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user-verify\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` varchar(255) NOT NULL, \`otp\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`user-verify\``);
    }

}
