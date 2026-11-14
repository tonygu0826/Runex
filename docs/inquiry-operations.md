# Website inquiry capture and release

## Meaning of each signal

- `ok` is an HTTP/form acknowledgement. Honeypot submissions receive a neutral acknowledgement but never create a record, email or conversion.
- `accepted` with `receiptId` means the inquiry was saved to D1. A saved inquiry is initially `unreviewed`, not a qualified business opportunity.
- `email_accepted` means the email provider accepted the notification. It is not proof that Gmail delivered it to the inbox. Only inspect the received message to establish delivery and authentication.
- `classification` separates `unreviewed`, `qualified`, `unqualified`, `spam` and `test`. Classification requires an operator's assessment; browser-supplied classifications are ignored.
- The existing `lead_created` Pixel event represents a newly saved, non-test inquiry. It fires only on a server-authorized first response, keeps `opt_out: true`, and receives no inquiry fields, user matching data or attribution. It can undercount if a successful response is lost. D1 is the source of truth for accepted/qualified counts. No CAPI, page-view event, credentials or extra analytics sharing are added.

## Storage, privacy and abuse limits

`LEADS_DB` points at the approved `runex-leads` database. `migrations/0001_contact_inquiries.sql` is its schema source of truth; the optional starter Drizzle schema remains unused by the contact endpoint. Apply this migration before releasing code that requires it. Production must never point at a local placeholder database.

Contact fields already requested by the form are saved before notification. Source context contains only recognized public route paths, a general referrer category and bounded `utm_source`, `utm_medium`, `utm_campaign` labels. It excludes arbitrary URL parameters, fragments, click IDs, IP addresses, user agents and device fingerprints. Labels are untrusted descriptive input, not verified ad attribution. The first/last context is tab-scoped; it resets on the next page visit after 30 minutes of inactivity and is transmitted only with the submitted inquiry.

`review_after` defaults to 90 days after creation; `LEAD_REVIEW_AFTER_DAYS` accepts 7–365. This is an operator review date, not automatic expiry. No cron, automatic deletion or public record-list endpoint is installed. The owner must decide the retention/archiving policy before introducing permanent deletion. The public privacy disclosure does not promise a deletion deadline. Email copies follow the existing mailbox's retention.

Requests are capped at 20,000 actual body bytes. An atomic SQL insert permits at most 60 new inquiries per hour globally and 5 per submitted email per hour, including test records. Same-key retries can recover an existing receipt even at the limit and do not consume another slot. Rejected requests save no row and send no notification. This is a coarse storage/email abuse ceiling, not per-client bot identification: rotating senders can exhaust the global hourly allowance and temporarily block genuine new inquiries. The form retains their fields and offers the existing direct email fallback. Monitor sustained 429 responses before tuning these limits. No IP fingerprint is stored.

## Notification recovery

1. A saved `pending` record with `notification_attempts = 0` has no claimed send. A same-key client retry can atomically claim it once. Concurrent retries cannot claim the same notification twice.
2. `sending` means a provider attempt may be in progress or its final database update was interrupted. Reconcile against the provider/inbox reference before any resend.
3. `email_failed` retains the full inquiry. Provider rejection can be ambiguous, so there is no blind automatic resend.
4. `email_accepted` is provider acceptance only. It does not mark the inquiry qualified.
5. Notification logs contain event names and inquiry IDs, not raw provider errors or inquiry/contact content.

Use the existing authenticated Cloudflare account to review records; do not expose database reads as a public API. Alert promptly on `email_failed` and on `pending` or `sending` older than 10 minutes. Exclude marked test records from business alerts. Investigate the record and inbox before deciding a recovery action. Sending/re-sending an inquiry or replying to a prospect requires the appropriate owner authorization.

Read-only unresolved summary (UTC timestamps):

```sql
SELECT notification_status, count(*) AS inquiries,
       min(created_at) AS oldest_created_at,
       min(updated_at) AS oldest_updated_at
FROM contact_inquiries
WHERE classification <> 'test'
  AND (notification_status = 'email_failed'
    OR (notification_status IN ('pending', 'sending')
      AND updated_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 minutes')))
GROUP BY notification_status;
```

Read-only receipt-level recovery list, without contact fields:

```sql
SELECT id, created_at, updated_at, service, classification,
       notification_status, notification_attempts, provider_message_id
FROM contact_inquiries
WHERE classification <> 'test'
  AND notification_status IN ('pending', 'sending', 'email_failed')
ORDER BY created_at;
```

Read-only 28-day status counts (report in the owner's local time when presenting dates):

```sql
SELECT classification, notification_status, count(*) AS inquiries
FROM contact_inquiries
WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-28 days')
GROUP BY classification, notification_status;
```

For conversion analysis, exclude `test` and `spam`; report `qualified` separately from unreviewed inquiries. Keep the pre-rollout baseline separate because legacy email-only submissions were not stored and legacy Pixel events included blocked acknowledgements. Do not infer a business result from a request count or a ranking change alone.

## Test and deployment gates

1. Run `npm run typecheck`, `npm run lint`, `npm test`. Contact tests use in-memory SQLite and mocked email. They never submit production forms.
2. Read back the production database schema/indexes and the empty/new database state before deployment. Verify `LEADS_DB` in the version's actual binding metadata. Preserve the existing restricted `CONTACT_EMAIL` sender/recipient.
3. Non-production Cloudflare builds must use `npx wrangler versions upload --config wrangler.jsonc`, not `wrangler deploy`. A version URL shares the version's bindings/resources. Use read-only navigation/client validation for preview QA; do not send preview forms to production bindings.
4. Independently review the exact candidate, verify CI for that commit, then merge and verify the new production version and public pages. Preserve all existing article publishing/refill workflows.
5. The one approved production delivery test is a direct, clearly marked API submission to the existing owner-only destination. Do not use a browser Pixel. Immediately mark only its exact returned receipt as `test` through the authenticated database account, then verify no qualified/real-inquiry count includes it. Verify received message headers and inbox outcome independently of `email_accepted`. Do not send a second message to compensate for an uncertain result.
6. `LEAD_TEST_MODE=true` is for an isolated test environment only: it stores test records but does not email or count conversions. Never enable it globally on production for the owner delivery test.

## Rollback

Record the active production version before release. If a code rollback is necessary, roll back the Worker version; retain the D1 database and additive migration. Never delete saved inquiries or undo the email-authentication repair as part of a code rollback. An old Worker ignores the new form fields and returns only a neutral acknowledgement, so the new client will not falsely count it as a saved inquiry. Visitors with an old form tab may be asked to refresh because their request lacks a submission UUID. Confirm the form and the actual binding metadata again after rollback.

## Content scope

The carton/pallet guide was revised at its existing URL after AI-assisted primary-source and semantic review, with the reusable editorial field/wording/duplicate checks. It corrects carton geometry and distinguishes FedEx guidance from the UPS Canada 2026 service-specific guide; no human review is claimed. Its indexing gate is enabled only for this revised article. The two older cross-dock/returns guides receive targeted unsupported-claim corrections but keep their prior indexing gates. Canonicals and legacy redirect relationships are unchanged.
