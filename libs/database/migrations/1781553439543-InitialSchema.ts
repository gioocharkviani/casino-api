import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781553439543 implements MigrationInterface {
    name = 'InitialSchema1781553439543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`favorite-games\` (\`id\` int NOT NULL AUTO_INCREMENT, \`playerId\` varchar(255) NOT NULL, \`gameId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`favorite-games\``);
    }

}
