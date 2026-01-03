-- Minimal version without comments to save space
CREATE TABLE IF NOT EXISTS paper_birthday_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    paper_id VARCHAR(100) NOT NULL,
    paper_title TEXT NOT NULL,
    publication_month_day VARCHAR(5) NOT NULL,
    verification_token VARCHAR(100) UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    unsubscribe_token VARCHAR(100) UNIQUE NOT NULL,
    unsubscribed BOOLEAN DEFAULT FALSE,
    unsubscribed_at TIMESTAMP,
    last_sent_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, paper_id)
);

CREATE INDEX idx_email ON paper_birthday_subscriptions(email);
CREATE INDEX idx_publication_month_day ON paper_birthday_subscriptions(publication_month_day);
CREATE INDEX idx_verification_token ON paper_birthday_subscriptions(verification_token);
CREATE INDEX idx_verified ON paper_birthday_subscriptions(verified);
CREATE INDEX idx_daily_send ON paper_birthday_subscriptions(publication_month_day, verified, unsubscribed);
