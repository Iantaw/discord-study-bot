import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('stats.db');

db.exec(`CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    current_streak INTEGER,
    longest_streak INTEGER,
    last_active_date INTEGER
)`);

