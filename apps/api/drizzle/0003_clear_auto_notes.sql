-- Earlier versions stored auto-generated Bengali notes on loan, goal and recurring
-- transactions. The client now builds these labels in the user's language from the
-- loan person / goal name, so clear notes that are exactly the old auto-generated text.
-- User-written notes are left untouched. normalize(..., NFC) makes the comparison
-- independent of how য়/ড় were encoded.
UPDATE "transactions" t
SET "note" = NULL
FROM "loans" l
WHERE t."loan_id" = l."id"
  AND t."note" IS NOT NULL
  AND normalize(t."note", NFC) IN (
    normalize(l."person_name" || ' এর কাছ থেকে ধার গ্রহণ', NFC),
    normalize(l."person_name" || ' কে ধার প্রদান', NFC),
    normalize(l."person_name" || ' কে ধার পরিশোধ', NFC),
    normalize(l."person_name" || ' এর কাছ থেকে পাওনা আদায়', NFC)
  );--> statement-breakpoint
UPDATE "transactions" t
SET "note" = NULL
FROM "goals" g
WHERE t."goal_id" = g."id"
  AND t."note" IS NOT NULL
  AND normalize(t."note", NFC) = normalize('সঞ্চয়ের লক্ষ্যে জমা: ' || g."name", NFC);--> statement-breakpoint
UPDATE "transactions"
SET "note" = NULL
WHERE "recurring_rule_id" IS NOT NULL
  AND "note" IS NOT NULL
  AND normalize("note", NFC) IN (normalize('নিয়মিত খরচ পরিশোধ', NFC), normalize('নিয়মিত আয় জমা', NFC));
