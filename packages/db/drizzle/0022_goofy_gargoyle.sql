CREATE INDEX "passkeys_userId_idx" ON "passkeys" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "passkeys" DROP COLUMN "webauthn_user_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";