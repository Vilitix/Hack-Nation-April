-- CreateEnum
CREATE TYPE "HostingMode" AS ENUM ('SELF_HOSTED', 'MARKET_HOSTED');

-- CreateEnum
CREATE TYPE "HostingPlan" AS ENUM ('VRAM_16', 'VRAM_32', 'VRAM_80', 'VRAM_200');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('DRAFT', 'WAITING_PAYMENT', 'ACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "published_agents" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_sats" INTEGER NOT NULL,
    "hosting_mode" "HostingMode" NOT NULL,
    "hosting_plan" "HostingPlan",
    "status" "AgentStatus" NOT NULL DEFAULT 'DRAFT',
    "api_path" TEXT,
    "token_hash" TEXT,
    "endpoint_url" TEXT,
    "port" INTEGER,
    "revenue_sats" INTEGER NOT NULL DEFAULT 0,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "published_agents_api_path_key" ON "published_agents"("api_path");

-- AddForeignKey
ALTER TABLE "published_agents" ADD CONSTRAINT "published_agents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
