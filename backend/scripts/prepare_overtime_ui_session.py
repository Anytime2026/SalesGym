"""フロントのオーバータイマー表示を検証する（backend + frontend 起動済み前提）。"""

from __future__ import annotations

import subprocess
import sys

import httpx

API_BASE = "http://127.0.0.1:8000"
FRONT_BASE = "http://127.0.0.1:5173"


def main() -> None:
    with httpx.Client(base_url=API_BASE, timeout=30) as client:
        program = client.post(
            "/api/programs",
            json={"field": "金融", "total_sessions": 1, "evaluator_ids": ["ui-overtime"]},
        )
        program.raise_for_status()
        program_id = program.json()["id"]

        session = client.post(
            f"/api/programs/{program_id}/sessions",
            json={"goal": "UIオーバーテスト", "time_limit_minutes": 1},
        )
        session.raise_for_status()
        session_id = session.json()["id"]
        client.post(f"/api/sessions/{session_id}/start").raise_for_status()

    sql = (
        f"UPDATE hearing_sessions SET started_at = NOW() - INTERVAL '2 minutes' "
        f"WHERE id = '{session_id}';"
    )
    proc = subprocess.run(
        [
            "docker",
            "exec",
            "backend-postgres-1",
            "psql",
            "-U",
            "syodan",
            "-d",
            "syodan",
            "-c",
            sql,
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        sys.exit(1)

    print(session_id)


if __name__ == "__main__":
    main()
