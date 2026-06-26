"""Slack 評価・総評リンク通知（HULFT 並列軸）"""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.services.slack_client import SlackClient
from tests.conftest import create_and_start_session, create_program


@pytest.mark.asyncio
async def test_slack_evaluation_sent_when_session_has_conversation(client: AsyncClient) -> None:
    with (
        patch.object(SlackClient, "send_evaluation_request", new_callable=AsyncMock) as mock_eval,
        patch.object(SlackClient, "send_overall_review_request", new_callable=AsyncMock) as mock_overall,
    ):
        program = await create_program(client, total_sessions=2)
        session = await create_and_start_session(client, program["id"])

        from app.api.routes import sessions as sessions_routes

        sessions_routes.append_conversation(str(session["id"]), "user", "本日はよろしくお願いします")
        sessions_routes.append_conversation(str(session["id"]), "ai", "こちらこそよろしくお願いします")

        ended = await client.post(f"/api/sessions/{session['id']}/end")
        assert ended.status_code == 200

        mock_eval.assert_called_once()
        call_kwargs = mock_eval.call_args.kwargs
        assert call_kwargs["field"] == "金融"
        assert call_kwargs["session_number"] == 1
        assert call_kwargs["goal"] == "予算感をヒアリング"
        assert "/reviewer/evaluations/" in call_kwargs["review_url"]
        mock_overall.assert_not_called()


@pytest.mark.asyncio
async def test_slack_evaluation_not_sent_for_empty_session(client: AsyncClient) -> None:
    with (
        patch.object(SlackClient, "send_evaluation_request", new_callable=AsyncMock) as mock_eval,
        patch.object(SlackClient, "send_overall_review_request", new_callable=AsyncMock) as mock_overall,
    ):
        program = await create_program(client, total_sessions=2)
        session = await create_and_start_session(client, program["id"])

        ended = await client.post(f"/api/sessions/{session['id']}/end")
        assert ended.status_code == 200

        mock_eval.assert_not_called()
        mock_overall.assert_not_called()


@pytest.mark.asyncio
async def test_slack_overall_review_sent_when_all_sessions_complete(client: AsyncClient) -> None:
    with (
        patch.object(SlackClient, "send_evaluation_request", new_callable=AsyncMock) as mock_eval,
        patch.object(SlackClient, "send_overall_review_request", new_callable=AsyncMock) as mock_overall,
    ):
        program = await create_program(client, total_sessions=1)
        session = await create_and_start_session(client, program["id"])

        from app.api.routes import sessions as sessions_routes

        sessions_routes.append_conversation(str(session["id"]), "user", "課題を深掘り")
        sessions_routes.append_conversation(str(session["id"]), "ai", "そうですね")

        ended = await client.post(f"/api/sessions/{session['id']}/end")
        assert ended.status_code == 200

        mock_eval.assert_called_once()
        mock_overall.assert_called_once()
        call_kwargs = mock_overall.call_args.kwargs
        assert call_kwargs["field"] == "金融"
        assert call_kwargs["total_sessions"] == 1
        assert "/reviewer/overall-review/" in call_kwargs["review_url"]


@pytest.mark.asyncio
async def test_slack_evaluation_stub_mode_does_not_raise() -> None:
    slack = SlackClient()
    await slack.send_evaluation_request(
        review_url="http://localhost:5173/reviewer/evaluations/abc",
        field="金融",
        session_number=1,
        goal="テスト目標",
    )
    await slack.send_overall_review_request(
        review_url="http://localhost:5173/reviewer/overall-review/xyz",
        field="金融",
        total_sessions=3,
    )
