import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781171073945 implements MigrationInterface {
    name = 'InitialSchema1781171073945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user-levels\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`xp\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`user-levels\``);
    }

}
