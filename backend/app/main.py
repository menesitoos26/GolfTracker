
from fastapi import FastAPI

app = FastAPI(title="Golf Tracker API")

@app.get("/")
def root():
    return {"message": "Golf Tracker API funcionando"}

@app.get("/health")
def health():
    return {"status": "ok"}

import os
api_key = os.getenv("GOLF_COURSE_API_KEY")