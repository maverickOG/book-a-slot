from fastapi import FastAPI

app = FastAPI(title="Book a Slot")

@app.get("/")
def read_root() -> dict[str, str]:
    """Return a simple response confirming that the API is available."""
    return {"message": "Book a Slot API is running"}
