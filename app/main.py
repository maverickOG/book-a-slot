from fastapi import FastAPI

from app.routers.auth import router as auth_router

app = FastAPI(title="Book a Slot")

app.include_router(auth_router)

@app.get("/")
def read_root() -> dict[str, str]:
    """Return a simple response confirming that the API is available."""
    return {"message": "Book a Slot API is running"}
