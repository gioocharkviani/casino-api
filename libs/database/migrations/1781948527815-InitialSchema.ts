import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781948527815 implements MigrationInterface {
    name = 'InitialSchema1781948527815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`game_id\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`game_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_20492232b7f3acb3ef924fa92a7\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_20492232b7f3acb3ef924fa92a7\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`game_id\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`game_id\` varchar(255) NULL`);
    }

}
