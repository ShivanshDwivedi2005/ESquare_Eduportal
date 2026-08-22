import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.db.session import SessionLocal
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.modules.auth.routes import router as auth_router
from app.modules.auth.service import initialize_username_index
from app.modules.schools.routes import router as school_router
from app.modules.students.routes import router as student_router
from app.core.config import settings

# Import all models to register them
from app.modules.auth import models as auth_models
from app.modules.schools import models as schools_models
from app.modules.students import models as students_models

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    db = SessionLocal()
    try:
        initialize_username_index(db)
    except SQLAlchemyError:
        logger.warning(
            "Username Bloom filter was not initialized; availability checks will use PostgreSQL",
            exc_info=True,
        )
    finally:
        db.close()
    yield


app = FastAPI(title="ESQUARE API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(school_router)
app.include_router(student_router)

@app.get("/db-test")
def db_test():

    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))

    return {"db": "connected"}

