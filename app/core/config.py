from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str
    JWT_EXPIRE_MINUTES: int

    SMTP_EMAIL: str
    SMTP_PASSWORD: str

    GOOGLE_CLIENT_ID: str

    FRONTEND_ORIGINS: str = "http://localhost:8080,http://localhost:5173"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 10

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
