from fastapi import FastAPI
from app.db.session import engine
from sqlalchemy import text
from app.modules.auth.routes import router as auth_router
from app.modules.schools.routes import router as school_router
from app.db import base_class  # 🔥 VERY IMPORTANT
from app.modules.students.routes import router as student_router
from app.db.base_class import Base

# Import all models to register them
from app.modules.auth import models as auth_models
from app.modules.schools import models as schools_models
from app.modules.students import models as students_models

base_class.Base.metadata.create_all(bind=engine)


app = FastAPI()
app.include_router(auth_router)
app.include_router(school_router)
app.include_router(student_router)

@app.get("/db-test")
def db_test():

    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))

    return {"db": "connected"}

