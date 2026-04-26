-- Add publisher-defined runtime parameter and upstream API secret storage.
ALTER TABLE "published_agents" ADD COLUMN "api_parameter_key" TEXT NOT NULL DEFAULT 'request';
ALTER TABLE "published_agents" ADD COLUMN "api_parameter_label" TEXT NOT NULL DEFAULT 'Request';
ALTER TABLE "published_agents" ADD COLUMN "api_parameter_placeholder" TEXT;
ALTER TABLE "published_agents" ADD COLUMN "upstream_auth_token_enc" TEXT;
