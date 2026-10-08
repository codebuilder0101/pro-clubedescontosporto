-- Brazilian Portuguese (pt-BR) is replaced by French (fr).
-- Drop pt-BR content, move members who chose pt-BR to pt-PT, and allow fr.

ALTER TABLE "User" DROP CONSTRAINT "User_preferredLocale_check";
ALTER TABLE "CategoryTranslation" DROP CONSTRAINT "CategoryTranslation_locale_check";
ALTER TABLE "ZoneTranslation" DROP CONSTRAINT "ZoneTranslation_locale_check";
ALTER TABLE "OfferTranslation" DROP CONSTRAINT "OfferTranslation_locale_check";

DELETE FROM "CategoryTranslation" WHERE "locale" = 'pt-BR';
DELETE FROM "ZoneTranslation" WHERE "locale" = 'pt-BR';
DELETE FROM "OfferTranslation" WHERE "locale" = 'pt-BR';
UPDATE "User" SET "preferredLocale" = 'pt-PT' WHERE "preferredLocale" = 'pt-BR';

ALTER TABLE "User" ADD CONSTRAINT "User_preferredLocale_check" CHECK ("preferredLocale" IN ('pt-PT', 'fr', 'es', 'en'));
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_locale_check" CHECK ("locale" IN ('pt-PT', 'fr', 'es', 'en'));
ALTER TABLE "ZoneTranslation" ADD CONSTRAINT "ZoneTranslation_locale_check" CHECK ("locale" IN ('pt-PT', 'fr', 'es', 'en'));
ALTER TABLE "OfferTranslation" ADD CONSTRAINT "OfferTranslation_locale_check" CHECK ("locale" IN ('pt-PT', 'fr', 'es', 'en'));
