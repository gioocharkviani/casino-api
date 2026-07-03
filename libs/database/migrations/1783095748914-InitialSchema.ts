import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783095748914 implements MigrationInterface {
    name = 'InitialSchema1783095748914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` CHANGE \`userId\` \`userId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user-verify\` CHANGE \`otp\` \`otp\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user-verify\` CHANGE \`otp\` \`otp\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user-verify\` CHANGE \`userId\` \`userId\` varchar(255) NOT NULL`);
    }

}
