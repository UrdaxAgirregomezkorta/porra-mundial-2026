-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_fixture_id INTEGER UNIQUE,
  stage TEXT NOT NULL, -- e.g., 'group_A', 'group_B', ..., 'round_32', 'round_16', 'quarterfinal', 'semifinal', 'final'
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'PENDING', -- PENDING, IN_PLAY, FINISHED
  kickoff_time TIMESTAMP WITH TIME ZONE
);

-- Table: predictions_groups
CREATE TABLE predictions_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(participant_id, match_id)
);

-- Table: predictions_brackets
CREATE TABLE predictions_brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'round_32', 'round_16', 'quarterfinal', 'semifinal', 'final'
  predicted_team TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0
);

-- Table: predictions_awards
CREATE TABLE predictions_awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'winner', 'top_scorer_1', 'top_scorer_2', 'top_scorer_award', 'mvp', 'young_player'
  predicted_value TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0
);
