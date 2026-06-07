import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780674887110 implements MigrationInterface {
    name = 'InitialSchema1780674887110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`REL_5cb2b3e0419a73a360d327d497\` ON \`user\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_5cb2b3e0419a73a360d327d497\` ON \`user\` (\`country\`)`);
    }

}
