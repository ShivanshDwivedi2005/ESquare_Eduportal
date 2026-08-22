import re


USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 50
USERNAME_PATTERN = re.compile(r"^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$")


def normalize_username(value: str) -> str:
    return value.strip().lower()


def validate_username(value: str) -> str:
    username = normalize_username(value)

    if not USERNAME_MIN_LENGTH <= len(username) <= USERNAME_MAX_LENGTH:
        raise ValueError("Username must be between 3 and 50 characters")
    if not USERNAME_PATTERN.fullmatch(username):
        raise ValueError(
            "Use only letters, numbers, underscores, and periods; "
            "a period cannot be first or last"
        )

    return username
