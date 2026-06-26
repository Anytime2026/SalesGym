import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

_SLACK_API_BASE = "https://slack.com/api"


class SlackClient:
    async def send_feedback(self, message: str) -> None:
        settings = get_settings()
        text = f"【SalesGym フィードバック】\n{message}"
        await self._post_to_channels(
            text,
            settings.slack_feedback_channels,
            no_channels_hint=(
                "SLACK_FEEDBACK_CHANNELS を設定するか、"
                "Slackアプリに channels:read / groups:read を追加してください"
            ),
            stub_label="feedback",
        )

    async def send_evaluation_request(
        self,
        review_url: str,
        field: str,
        session_number: int,
        goal: str,
    ) -> None:
        settings = get_settings()
        text = (
            f"【SalesGym 評価依頼】第{session_number}回（{field}）\n"
            f"目標: {goal}\n"
            f"{review_url}"
        )
        await self._post_to_channels(
            text,
            settings.slack_evaluation_channels,
            no_channels_hint=(
                "SLACK_EVALUATION_CHANNELS を設定するか、"
                "Slackアプリに channels:read / groups:read を追加してください"
            ),
            stub_label="evaluation_request",
        )

    async def send_overall_review_request(
        self,
        review_url: str,
        field: str,
        total_sessions: int,
    ) -> None:
        settings = get_settings()
        text = (
            f"【SalesGym 総評依頼】{field}（全{total_sessions}回完了）\n"
            f"{review_url}"
        )
        await self._post_to_channels(
            text,
            settings.slack_evaluation_channels,
            no_channels_hint=(
                "SLACK_EVALUATION_CHANNELS を設定するか、"
                "Slackアプリに channels:read / groups:read を追加してください"
            ),
            stub_label="overall_review_request",
        )

    async def _post_to_channels(
        self,
        text: str,
        channel_config: str | None,
        *,
        no_channels_hint: str,
        stub_label: str,
    ) -> None:
        settings = get_settings()
        if settings.slack_stub_mode or not settings.slack_bot_token:
            logger.info("Slack stub %s: %s", stub_label, text)
            return

        channel_ids = self._parse_channels(channel_config) or await self._list_member_channels()
        if not channel_ids:
            raise RuntimeError(f"no_channels: {no_channels_hint}")

        async with httpx.AsyncClient(timeout=30) as client:
            headers = {"Authorization": f"Bearer {settings.slack_bot_token}"}
            for channel_id in channel_ids:
                resp = await client.post(
                    f"{_SLACK_API_BASE}/chat.postMessage",
                    headers=headers,
                    json={"channel": channel_id, "text": text},
                )
                resp.raise_for_status()
                data = resp.json()
                if not data.get("ok"):
                    error = data.get("error", "unknown_error")
                    logger.error("Slack chat.postMessage failed: %s (channel=%s)", error, channel_id)
                    raise RuntimeError(f"Slack API error: {error}")

    @staticmethod
    def _parse_channels(channel_config: str | None) -> list[str]:
        if not channel_config:
            return []
        return [c.strip() for c in channel_config.split(",") if c.strip()]

    async def _list_member_channels(self) -> list[str]:
        settings = get_settings()
        if not settings.slack_bot_token:
            return []

        channel_ids: list[str] = []
        cursor: str | None = None

        async with httpx.AsyncClient(timeout=30) as client:
            headers = {"Authorization": f"Bearer {settings.slack_bot_token}"}
            while True:
                params: dict[str, str] = {
                    "types": "public_channel,private_channel",
                    "exclude_archived": "true",
                    "limit": "200",
                }
                if cursor:
                    params["cursor"] = cursor

                resp = await client.get(
                    f"{_SLACK_API_BASE}/conversations.list",
                    headers=headers,
                    params=params,
                )
                resp.raise_for_status()
                data = resp.json()
                if not data.get("ok"):
                    error = data.get("error", "unknown_error")
                    logger.error("Slack conversations.list failed: %s", error)
                    raise RuntimeError(f"Slack API error: {error}")

                for ch in data.get("channels", []):
                    if ch.get("is_member"):
                        channel_ids.append(ch["id"])

                cursor = (data.get("response_metadata") or {}).get("next_cursor")
                if not cursor:
                    break

        return channel_ids
