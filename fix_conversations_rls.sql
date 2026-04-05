DROP POLICY IF EXISTS "chat_conv_select" ON chat_conversations;

CREATE POLICY "chat_conv_select"
  ON chat_conversations FOR SELECT
  USING (auth.uid() IS NOT NULL);
