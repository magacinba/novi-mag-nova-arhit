import os
import sqlite3
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
USERS_DB = DATA_DIR / "users.db"
LOGS_DB = DATA_DIR / "logs.db"


def _ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_users_conn():
    _ensure_data_dir()
    conn = sqlite3.connect(str(USERS_DB))
    conn.row_factory = sqlite3.Row
    return conn


def get_logs_conn():
    _ensure_data_dir()
    conn = sqlite3.connect(str(LOGS_DB))
    conn.row_factory = sqlite3.Row
    return conn


def init_users_db():
    with get_users_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def init_logs_db():
    with get_logs_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts TEXT NOT NULL,
                event TEXT NOT NULL,
                username TEXT,
                role TEXT,
                meta TEXT
            )
            """
        )
        conn.commit()


def init_admin_user(create_user_fn):
    init_users_db()
    with get_users_conn() as conn:
        row = conn.execute("SELECT COUNT(*) AS cnt FROM users").fetchone()
        if row and row["cnt"] > 0:
            return

    default_user = os.getenv("ADMIN_USER", "admin")
    default_pass = os.getenv("ADMIN_PASS", "admin")
    create_user_fn(default_user, default_pass, "admin")
