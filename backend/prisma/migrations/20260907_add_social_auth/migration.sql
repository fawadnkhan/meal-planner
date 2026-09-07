ALTER TABLE "users"
  ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'email',
  ADD COLUMN "provider_user_id" TEXT,
  ADD COLUMN "avatar_url" TEXT;

ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE UNIQUE INDEX "users_auth_provider_provider_user_id_key"
  ON "users" ("auth_provider", "provider_user_id");
