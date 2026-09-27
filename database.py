"""SQLite persistence for Cadence user progress."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Iterator


class Database:
    """Small data-access layer with short transactions and one connection per call."""

    def __init__(self, path: str | None = None):
        self.path = Path(path or os.getenv("DATABASE_PATH", "data/cadence.db"))
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
                        xp INTEGER NOT NULL DEFAULT 360 CHECK (xp >= 0),
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
            """INSERT INTO users(subject, created_at, updated_at)
               VALUES (?, ?, ?) ON CONFLICT(subject) DO NOTHING""",
            (subject, now, now),
        )

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
        sessions = []
        for row in connection.execute(
            """SELECT name, accuracy, created_at FROM sessions
               WHERE user_subject = ? ORDER BY id DESC LIMIT 8""",
            (subject,),
        ):
            created = datetime.fromisoformat(row["created_at"])
            sessions.append(
                {
                    "name": row["name"],
                    "accuracy": row["accuracy"],
                    "date": created.strftime("%b %d, %Y").replace(" 0", " "),
                }
            )
        return {
            "xp": user["xp"],
            "completed": completed,
            "answers": user["answers"],
            "correct": user["correct"],
            "placed": bool(user["placed"]),
            "level": user["level"],
            "sessions": sessions,
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
