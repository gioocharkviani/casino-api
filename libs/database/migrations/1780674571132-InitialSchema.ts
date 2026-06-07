import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780674571132 implements MigrationInterface {
    name = 'InitialSchema1780674571132'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_5cb2b3e0419a73a360d327d497f\``);
        await queryRunner.query(`DROP INDEX \`REL_5cb2b3e0419a73a360d327d497\` ON \`user\``);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`country\` \`countryId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_4aaf6d02199282eb8d3931bff31\` FOREIGN KEY (\`countryId\`) REFERENCES \`country\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_4aaf6d02199282eb8d3931bff31\``);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`countryId\` \`country\` int NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_5cb2b3e0419a73a360d327d497\` ON \`user\` (\`country\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_5cb2b3e0419a73a360d327d497f\` FOREIGN KEY (\`country\`) REFERENCES \`country\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
