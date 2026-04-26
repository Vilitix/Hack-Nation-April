-- CreateTable
CREATE TABLE "published_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_sats" INTEGER NOT NULL,
    "hosting_mode" TEXT NOT NULL,
    "hosting_plan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "api_path" TEXT,
    "token_hash" TEXT,
    "endpoint_url" TEXT,
    "port" INTEGER,
    "revenue_sats" INTEGER NOT NULL DEFAULT 0,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "published_agents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "published_agents_api_path_key" ON "published_agents"("api_path");
