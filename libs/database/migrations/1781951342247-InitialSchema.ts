import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781951342247 implements MigrationInterface {
    name = 'InitialSchema1781951342247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`idx_game_id\` ON \`transactions\` (\`game_id\`)`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_20492232b7f3acb3ef924fa92a7\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`gameUUID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_20492232b7f3acb3ef924fa92a7\``);
        await queryRunner.query(`DROP INDEX \`idx_game_id\` ON \`transactions\``);
    }

}
