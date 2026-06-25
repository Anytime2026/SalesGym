import enum


class ProgramStatus(str, enum.Enum):
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    ALL_SESSIONS_DONE = "all_sessions_done"
    OVERALL_REVIEW_REQUESTED = "overall_review_requested"
    CLOSED = "closed"


REVEAL_CHALLENGE_STATUSES = frozenset({
    ProgramStatus.ALL_SESSIONS_DONE.value,
    ProgramStatus.OVERALL_REVIEW_REQUESTED.value,
    ProgramStatus.CLOSED.value,
})


def should_reveal_true_challenge(status: str) -> bool:
    return status in REVEAL_CHALLENGE_STATUSES


class SessionStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EVALUATION_REQUESTED = "evaluation_requested"
    EVALUATED = "evaluated"
    ABANDONED = "abandoned"
