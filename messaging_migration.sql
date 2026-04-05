-- ============================================================
-- Global Messaging System Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. chat_conversations (group OR direct)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT,                          -- null for DMs
  type                 TEXT NOT NULL CHECK (type IN ('group','direct')),
  group_key            TEXT UNIQUE,                   -- stable key for auto-groups
  last_message_at      TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. chat_members (who belongs to each conversation)
CREATE TABLE IF NOT EXISTS chat_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ DEFAULT now(),
  joined_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- 3. chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_members_user       ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_conv       ON chat_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_time ON chat_messages(conversation_id, created_at);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;

-- chat_conversations: visible to members only
CREATE POLICY "chat_conv_select"
  ON chat_conversations FOR SELECT
  USING (id IN (SELECT conversation_id FROM chat_members WHERE user_id = auth.uid()));

CREATE POLICY "chat_conv_insert"
  ON chat_conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "chat_conv_update"
  ON chat_conversations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- chat_members
CREATE POLICY "chat_member_select"
  ON chat_members FOR SELECT
  USING (conversation_id IN (
    SELECT conversation_id FROM chat_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "chat_member_insert"
  ON chat_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "chat_member_update"
  ON chat_members FOR UPDATE
  USING (user_id = auth.uid());

-- chat_messages: only conversation members can read/write
CREATE POLICY "chat_msg_select"
  ON chat_messages FOR SELECT
  USING (conversation_id IN (
    SELECT conversation_id FROM chat_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "chat_msg_insert"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM chat_members WHERE user_id = auth.uid()
    )
  );

-- ── Realtime ─────────────────────────────────────────────────
-- Run these if realtime is not already enabled on these tables:
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
