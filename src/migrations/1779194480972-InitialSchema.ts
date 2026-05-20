import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1779194480972 implements MigrationInterface {
    name = 'InitialSchema1779194480972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('BUY', 'SELL')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "holding_id" uuid NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "quantity" numeric(18,6) NOT NULL, "price" numeric(18,4) NOT NULL, "fees" numeric(18,4) NOT NULL DEFAULT '0', "executed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0eff51e2f51f4537354ddfe419" ON "transactions" ("holding_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fed042d6c37bfbbd31e6849e9" ON "transactions" ("executed_at") `);
        await queryRunner.query(`CREATE TYPE "public"."holdings_asset_type_enum" AS ENUM('STOCK', 'BOND', 'MUTUAL_FUND', 'ETF')`);
        await queryRunner.query(`CREATE TABLE "holdings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "portfolio_id" uuid NOT NULL, "symbol" character varying(20) NOT NULL, "name" character varying(200) NOT NULL, "asset_type" "public"."holdings_asset_type_enum" NOT NULL, "quantity" numeric(18,6) NOT NULL DEFAULT '0', "avg_cost" numeric(18,4) NOT NULL DEFAULT '0', "current_price" numeric(18,4) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_df4e42f95014be15a4ccc8547c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2f4f9915c4b755588d01fee50b" ON "holdings" ("portfolio_id") `);
        await queryRunner.query(`CREATE TABLE "portfolios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_488aa6e9b219d1d9087126871ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_57fba72db5ac40768b40f0ecfa" ON "portfolios" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_0eff51e2f51f4537354ddfe4194" FOREIGN KEY ("holding_id") REFERENCES "holdings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "holdings" ADD CONSTRAINT "FK_2f4f9915c4b755588d01fee50be" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolios" ADD CONSTRAINT "FK_57fba72db5ac40768b40f0ecfa1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "portfolios" DROP CONSTRAINT "FK_57fba72db5ac40768b40f0ecfa1"`);
        await queryRunner.query(`ALTER TABLE "holdings" DROP CONSTRAINT "FK_2f4f9915c4b755588d01fee50be"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0eff51e2f51f4537354ddfe4194"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57fba72db5ac40768b40f0ecfa"`);
        await queryRunner.query(`DROP TABLE "portfolios"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f4f9915c4b755588d01fee50b"`);
        await queryRunner.query(`DROP TABLE "holdings"`);
        await queryRunner.query(`DROP TYPE "public"."holdings_asset_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fed042d6c37bfbbd31e6849e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0eff51e2f51f4537354ddfe419"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    }

}
