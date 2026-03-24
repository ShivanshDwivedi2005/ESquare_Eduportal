from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str
    JWT_EXPIRE_MINUTES: int

    SMTP_EMAIL: str
    SMTP_PASSWORD: str

    GOOGLE_CLIENT_ID: str

    class Config:
        env_file = ".env"


settings = Settings()