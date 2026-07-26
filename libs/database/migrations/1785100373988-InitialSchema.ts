import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1785100373988 implements MigrationInterface {
    name = 'InitialSchema1785100373988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` CHANGE \`otp\` \`otp\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` CHANGE \`otp\` \`otp\` varchar(255) NOT NULL`);
    }

}
