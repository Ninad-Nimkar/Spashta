from fastapi import FastAPI, Form
#streaming response lets us send text chunk by chunk as its generated
#JSONResponse sends regular one-time JSON response
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import base64

from Services.llm_service import explain
from Services.tts_service import generate_audio

#This gives us the folder where main.py lives
#We need it to tell fastapi where the frontend files are
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI()

#Cors lets the frontend communicate with the backend\
#allow_origins = [*] meanjhs any domain can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

#This is generator function that calls explain() and yields each chunk
#FastAPI's StreamingResponse will call this and send each chunk to the frontend
#as soon as it arrives from OpenAI, nothing is held back
def stream_explanation(topic: str, style: str, language: str):
    for chunk in explain(topic, style, language):
        yield chunk
        

#Endpoint 1, streams the explanation text word by word
@app.post("/stream-explain")
async def stream_explain(
    text: str = Form(...),
    style: str = Form("Simple"),
    language: str = Form("English")
):
    topic = text.strip()

    if not topic:
        return JSONResponse(
            content={"error": "Np text provided"},
            status_code=400
        )

    #StreamingResponse takes out generator and each chunk and sends each chunk immediatly
    #media_type="text/plain" tells the browser to expect plain streaming text
    return StreamingResponse(
        stream_explanation(topic, style, language),
        media_type="text/plain"
    )


#Endpoint 2, generates audio from the full explanation text
#Frontend calls this separately after streaming is complete
@app.post("/get-audio")
async def get_audio(
    text: str = Form(...),
    language: str = Form("English")
):
    #generate_audio returns raw audio bytes
    audio_bytes = generate_audio(text, language)

    #encode bytes to base64 string so it can be sent as JSON
    audio_b64 = base64.b64decode(audio_bytes).decode("utf-8")

    return JSONResponse(content={"audio": audio_b64})

#Serve thge frontend files
app.mount("/", StaticFiles(directory=str(BASE_DIR / "static"), html=True), name="static")