-- 002_systems.sql
-- IfaLode systems expansion: referrals, support tickets, notifications,
-- web push, and the payment columns the Flutterwave flow always needed.
-- Written defensively (IF NOT EXISTS / DROP POLICY IF EXISTS) because the
-- live database is ahead of migration 001 in places.
-- Every new table carries explicit GRANTs in the same file (Supabase stops
-- auto-granting Data API access to new public tables from 2026-10-30).

-- ============================================================
-- ORDERS: payment tracking columns the webhook already expects
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tx_ref TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_metadata JSONB;
CREATE INDEX IF NOT EXISTS idx_orders_tx_ref ON orders (tx_ref);

-- ============================================================
-- PROFILES: referral identity and earnings
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(12,2) NOT NULL DEFAULT 0;

-- ============================================================
-- REFERRALS: one row per referred signup
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'rewarded')),
  reward_amount DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rewarded_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);

-- ============================================================
-- SUPPORT TICKETS + MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_role TEXT NOT NULL DEFAULT 'user' CHECK (author_role IN ('user', 'admin', 'guest')),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages (ticket_id, created_at);

-- ============================================================
-- NOTIFICATIONS (in-app centre; push mirrors these)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read_at, created_at DESC);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions (user_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin test used by the new tables: the caller's own profile row.
-- (Migration 001 used auth.role() = 'admin', which never matches a real
-- profile role; new policies check the profile instead.)

DROP POLICY IF EXISTS "Referrals: owner or admin can view" ON referrals;
CREATE POLICY "Referrals: owner or admin can view" ON referrals FOR SELECT USING (
  auth.uid() = referrer_id OR auth.uid() = referred_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Tickets: owner or admin can view" ON support_tickets;
CREATE POLICY "Tickets: owner or admin can view" ON support_tickets FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
DROP POLICY IF EXISTS "Tickets: admin can update" ON support_tickets;
CREATE POLICY "Tickets: admin can update" ON support_tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Ticket messages: participants can view" ON support_messages;
CREATE POLICY "Ticket messages: participants can view" ON support_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  )
);

DROP POLICY IF EXISTS "Notifications: owner can view" ON notifications;
CREATE POLICY "Notifications: owner can view" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notifications: owner can update" ON notifications;
CREATE POLICY "Notifications: owner can update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Push: owner manages own subscriptions" ON push_subscriptions;
CREATE POLICY "Push: owner manages own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Writes for referrals, tickets, messages and notifications run through
-- server API routes with the service role (which bypasses RLS), so users
-- never write those tables directly from the browser.

-- ============================================================
-- MISSING INSERT POLICIES FROM 001
-- Signup creates the profile row, free enrolment inserts an enrolment,
-- and checkout inserts an order: none of these had an INSERT policy.
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON enrollments;
CREATE POLICY "Users can insert own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- GRANTS (explicit, per the standing rule)
-- ============================================================
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT ON public.support_messages TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;
