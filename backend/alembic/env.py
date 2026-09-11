from logging.config import fileConfig
from alembic import context
from app.config import get_settings

config=context.config
config.set_main_option("sqlalchemy.url",get_settings().direct_database_url or get_settings().database_url)
if config.config_file_name:fileConfig(config.config_file_name)
target_metadata=None

def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"),literal_binds=True,dialect_opts={"paramstyle":"named"})
    with context.begin_transaction():context.run_migrations()

def run_migrations_online():
    from sqlalchemy import create_engine
    with create_engine(config.get_main_option("sqlalchemy.url"),pool_pre_ping=True).connect() as connection:
        context.configure(connection=connection,target_metadata=target_metadata)
        with context.begin_transaction():context.run_migrations()

run_migrations_offline() if context.is_offline_mode() else run_migrations_online()
