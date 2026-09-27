"""SQLite persistence for Lingo user progress."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Iterator


SKILL_COUNT = 7
GAME_SKILLS = {
    "stress-sort": (0, 4, 5),
    "stress-twins": (0, 4),
    "what-do-they-mean": (1, 3, 4),
    "rhythm-match": (2, 6),
    "say-it-right": (0, 1, 3, 5, 6),
    "shape-your-sound": (0, 1, 2, 3, 5, 6),
}


class Database:
    """Small data-access layer with short transactions and one connection per call."""

    def __init__(self, path: str | None = None):
        self.path = Path(path or os.getenv("DATABASE_PATH", "data/lingo.db"))
        self._initialized = False
        self._init_lock = Lock()

    def initialize(self) -> None:
        if self._initialized:
            return
        with self._init_lock:
            if self._initialized:
                return
            self.path.parent.mkdir(parents=True, exist_ok=True)
            connection = self._connect_raw()
            try:
                connection.executescript(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        subject TEXT PRIMARY KEY,
                        xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
                        answers INTEGER NOT NULL DEFAULT 0 CHECK (answers >= 0),
                        correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0),
                        placed INTEGER NOT NULL DEFAULT 0 CHECK (placed IN (0, 1)),
                        level TEXT NOT NULL DEFAULT 'Explorer',
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS completions (
                        user_subject TEXT NOT NULL REFERENCES users(subject) ON DELETE CASCADE,
                        game TEXT NOT NULL,
                        completed_at TEXT NOT NULL,
                        PRIMARY KEY (user_subject, game)
                    );
                    CREATE TABLE IF NOT EXISTS sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_subject TEXT NOT NULL REFERENCES users(subject) ON DELETE CASCADE,
                        attempt_id TEXT NOT NULL,
                        game TEXT NOT NULL,
                        name TEXT NOT NULL,
                        accuracy INTEGER NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
                        xp INTEGER NOT NULL CHECK (xp >= 0),
                        answers INTEGER NOT NULL CHECK (answers >= 0),
                        correct INTEGER NOT NULL CHECK (correct >= 0),
                        created_at TEXT NOT NULL,
                        UNIQUE (user_subject, attempt_id)
                    );
                    CREATE INDEX IF NOT EXISTS sessions_user_recent
                    ON sessions(user_subject, id DESC);
                    """
                )
                # Remove the former demo XP baseline and repair cached totals from
                # the authoritative session history for existing databases.
                connection.execute(
                    """UPDATE users SET
                       xp = COALESCE((SELECT SUM(xp) FROM sessions WHERE user_subject = users.subject), 0),
                       answers = COALESCE((SELECT SUM(answers) FROM sessions WHERE user_subject = users.subject), 0),
                       correct = COALESCE((SELECT SUM(correct) FROM sessions WHERE user_subject = users.subject), 0)"""
                )
                connection.execute("PRAGMA optimize")
            finally:
                connection.close()
            self._initialized = True

    def _connect_raw(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 10000")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = NORMAL")
        return connection

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        self.initialize()
        connection = self._connect_raw()
        try:
            yield connection
        finally:
            connection.close()

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds")

    def _ensure_user(self, connection: sqlite3.Connection, subject: str) -> None:
        now = self._now()
        connection.execute(
            """INSERT INTO users(subject, xp, answers, correct, created_at, updated_at)
               VALUES (?, 0, 0, 0, ?, ?) ON CONFLICT(subject) DO NOTHING""",
            (subject, now, now),
        )

    @staticmethod
    def _skill_scores(rows: list[sqlite3.Row]) -> list[int]:
        values: list[list[int]] = [[] for _ in range(SKILL_COUNT)]
        for row in rows:
            for index in GAME_SKILLS.get(row["game"], ()):
                values[index].append(row["accuracy"])
        return [round(sum(items) / len(items)) if items else 0 for items in values]

    def progress(self, subject: str, connection: sqlite3.Connection | None = None) -> dict:
        if connection is None:
            with self.connect() as own_connection:
                return self.progress(subject, own_connection)
        self._ensure_user(connection, subject)
        user = connection.execute(
            "SELECT xp, answers, correct, placed, level FROM users WHERE subject = ?",
            (subject,),
        ).fetchone()
        completed = [
            row["game"]
            for row in connection.execute(
                "SELECT game FROM completions WHERE user_subject = ? ORDER BY completed_at, game",
                (subject,),
            )
        ]
        session_rows = list(
            connection.execute(
                """SELECT game, name, accuracy, xp, created_at FROM sessions
                   WHERE user_subject = ? ORDER BY id""",
                (subject,),
            )
        )
        sessions = []
        for row in reversed(session_rows[-8:]):
            created = datetime.fromisoformat(row["created_at"])
            sessions.append(
                {
                    "name": row["name"],
                    "accuracy": row["accuracy"],
                    "date": created.strftime("%b %d, %Y").replace(" 0", " "),
                }
            )
        today = datetime.now(timezone.utc).date()
        activity_dates = {
            datetime.fromisoformat(row["created_at"]).date() for row in session_rows
        }
        streak = 0
        cursor = today if today in activity_dates else today - timedelta(days=1)
        while cursor in activity_dates:
            streak += 1
            cursor -= timedelta(days=1)
        week_start = today - timedelta(days=6)
        current_scores = self._skill_scores(session_rows)
        previous_scores = self._skill_scores(session_rows[:-1])
        return {
            "xp": user["xp"],
            "completed": completed,
            "answers": user["answers"],
            "correct": user["correct"],
            "placed": bool(user["placed"]),
            "level": user["level"],
            "sessions": sessions,
            "streak": streak,
            "todayXp": sum(
                row["xp"]
                for row in session_rows
                if datetime.fromisoformat(row["created_at"]).date() == today
            ),
            "weeklyXp": sum(
                row["xp"]
                for row in session_rows
                if datetime.fromisoformat(row["created_at"]).date() >= week_start
            ),
            "activityDays": sorted(day.isoformat() for day in activity_dates),
            "lessonCount": sum(
                row["game"] != "shape-your-sound" for row in session_rows
            ),
            "skillScores": current_scores,
            "previousSkillScores": previous_scores,
        }

    def save_placement(self, subject: str, level: str) -> dict:
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                self._ensure_user(connection, subject)
                connection.execute(
                    "UPDATE users SET placed = 1, level = ?, updated_at = ? WHERE subject = ?",
                    (level, self._now(), subject),
                )
                result = self.progress(subject, connection)
                connection.commit()
                return result
            except Exception:
                connection.rollback()
                raise

    def save_session(
        self,
        subject: str,
        *,
        attempt_id: str,
        game: str,
        name: str,
        correct: int,
        total: int,
        xp: int,
        accuracy: int | None = None,
    ) -> tuple[dict, bool]:
        accuracy = accuracy if accuracy is not None else round(correct / total * 100)
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                self._ensure_user(connection, subject)
                existing = connection.execute(
                    "SELECT 1 FROM sessions WHERE user_subject = ? AND attempt_id = ?",
                    (subject, attempt_id),
                ).fetchone()
                created = existing is None
                if created:
                    now = self._now()
                    connection.execute(
                        """INSERT INTO sessions
                           (user_subject, attempt_id, game, name, accuracy, xp, answers, correct, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (subject, attempt_id, game, name, accuracy, xp, total, correct, now),
                    )
                    connection.execute(
                        """INSERT INTO completions(user_subject, game, completed_at)
                           VALUES (?, ?, ?) ON CONFLICT(user_subject, game) DO NOTHING""",
                        (subject, game, now),
                    )
                    connection.execute(
                        """UPDATE users SET xp = xp + ?, answers = answers + ?,
                           correct = correct + ?, updated_at = ? WHERE subject = ?""",
                        (xp, total, correct, now, subject),
                    )
                result = self.progress(subject, connection)
                connection.commit()
                return result, created
            except Exception:
                connection.rollback()
                raise

    def reset(self, subject: str) -> dict:
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                connection.execute("DELETE FROM users WHERE subject = ?", (subject,))
                result = self.progress(subject, connection)
                connection.commit()
                return result
            except Exception:
                connection.rollback()
                raise

    def check(self) -> None:
        with self.connect() as connection:
            connection.execute("SELECT 1").fetchone()


db = Database()
