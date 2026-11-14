-- Apply to the approved LEADS_DB before deploying the contact handler.
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  review_after TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'unreviewed'
    CHECK (classification IN ('unreviewed', 'qualified', 'unqualified', 'spam', 'test')),
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_status IN ('pending', 'sending', 'email_accepted', 'email_failed', 'test')),
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  details TEXT NOT NULL,
  attribution_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS contact_inquiries_created ON contact_inquiries(created_at);
CREATE INDEX IF NOT EXISTS contact_inquiries_notification ON contact_inquiries(notification_status, created_at);
CREATE INDEX IF NOT EXISTS contact_inquiries_review ON contact_inquiries(review_after);
CREATE INDEX IF NOT EXISTS contact_inquiries_email_created ON contact_inquiries(email, created_at);
