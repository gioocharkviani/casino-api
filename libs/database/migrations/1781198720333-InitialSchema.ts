import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781198720333 implements MigrationInterface {
    name = 'InitialSchema1781198720333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`promotions\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`promotions\``);
    }

}
