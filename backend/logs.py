import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from database import get_logs_conn, init_logs_db


router = APIRouter(prefix="/logs", tags=["logs"])


def log_event(event: str, username: str = None, role: str = None, meta: dict = None):
    init_logs_db()
    ts = datetime.now(timezone.utc).isoformat()
    meta_str = json.dumps(meta or {}, ensure_ascii=False)
    with get_logs_conn() as conn:
        conn.execute(
            "INSERT INTO logs (ts, event, username, role, meta) VALUES (?, ?, ?, ?, ?)",
            (ts, event, username, role, meta_str),
        )
        conn.commit()


def require_admin_dep(request: Request):
    from auth import get_current_user, require_admin
    user = get_current_user(request)
    return require_admin(user)


@router.get("")
def list_logs(limit: int = 200, _: dict = Depends(require_admin_dep)):
    init_logs_db()
    with get_logs_conn() as conn:
        rows = conn.execute(
            "SELECT id, ts, event, username, role, meta FROM logs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return {"logs": [dict(r) for r in rows]}
