from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    sports_api_key: str = ""
    sports_api_base_url: str = "https://api.sportradar.com"
    database_url: str = "sqlite:///./data/sports.db"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
