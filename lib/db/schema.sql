CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  preferences JSONB DEFAULT '{"personality": "default"}'::jsonb
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  emotion_state JSONB NOT NULL,
  context_summary TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  turn_number INTEGER NOT NULL,
  user_message TEXT NOT NULL,
  mollei_response TEXT NOT NULL,
  user_emotion JSONB NOT NULL,
  mollei_emotion JSONB NOT NULL,
  crisis_detected BOOLEAN DEFAULT FALSE,
  crisis_severity INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_turns_session_id ON conversation_turns(session_id);

CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  turn_id UUID REFERENCES conversation_turns(id),
  trigger_text TEXT NOT NULL,
  severity INTEGER NOT NULL,
  signal_type VARCHAR(50) NOT NULL,
  action_taken VARCHAR(50) NOT NULL,
  resources_shown JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crisis_events_session_id ON crisis_events(session_id);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
