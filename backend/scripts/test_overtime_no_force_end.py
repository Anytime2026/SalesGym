"""予定時間超過後も WebSocket が強制終了しないことを検証する。

使い方 (backend ディレクトリで):
  python scripts/test_overtime_no_force_end.py
"""

from __future__ import annotations

import asyncio
import json
import subprocess
import sys

import httpx
import websockets

API_BASE = "http://127.0.0.1:8000"
WS_BASE = "ws://127.0.0.1:8000"


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    sys.exit(1)


def ok(msg: str) -> None:
    print(f"OK: {msg}")


def backdate_session_started_at(session_id: str, minutes_ago: int = 2) -> None:
    sql = (
        f"UPDATE hearing_sessions SET started_at = NOW() - INTERVAL '{minutes_ago} minutes' "
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
        fail(f"failed to backdate started_at: {proc.stderr or proc.stdout}")


async def main() -> None:
    print(f"API: {API_BASE}")

    with httpx.Client(base_url=API_BASE, timeout=30) as client:
        health = client.get("/health")
        if health.status_code != 200:
            fail(f"backend not healthy: {health.status_code}")

        program = client.post(
            "/api/programs",
            json={"field": "金融", "total_sessions": 1, "evaluator_ids": ["overtime-test"]},
        )
        if program.status_code != 201:
            fail(f"create program: {program.status_code} {program.text}")
        program_id = program.json()["id"]

        session = client.post(
            f"/api/programs/{program_id}/sessions",
            json={"goal": "オーバーテスト", "time_limit_minutes": 1},
        )
        if session.status_code != 201:
            fail(f"create session: {session.status_code}")
        session_id = session.json()["id"]

        started = client.post(f"/api/sessions/{session_id}/start")
        if started.status_code != 200:
            fail(f"start session: {started.status_code}")

    backdate_session_started_at(session_id, minutes_ago=2)
    ok(f"session {session_id} started_at backdated by 2 minutes")

    uri = f"{WS_BASE}/ws/sessions/{session_id}/hearing"
    print(f"Connecting: {uri}")

    async with websockets.connect(uri, open_timeout=10) as ws:
        received: list[dict] = []
        for i in range(5):
            await ws.send(json.dumps({"type": "ping"}))
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=2)
            except TimeoutError:
                continue
            if isinstance(msg, bytes):
                continue
            data = json.loads(msg)
            received.append(data)
            print(f"  ping {i + 1} -> {data.get('type')}")

        if any(m.get("type") == "session_ended" for m in received):
            fail("received session_ended after time limit exceeded")

        await ws.send(json.dumps({"type": "ping"}))
        ok("WebSocket still accepts pings after overtime")

    ok("no forced session end on overtime")
    print(f"Manual UI test URL: http://127.0.0.1:5173/roleplay/{session_id}")
    print("Overtime no-force-end check passed.")


if __name__ == "__main__":
    asyncio.run(main())
