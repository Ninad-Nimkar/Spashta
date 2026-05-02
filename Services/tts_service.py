from sarvamai import SarvamAI
import os
from dotenv import load_dotenv
import base64
from Services.prompt_builder import SPEAKER_BY_LANGAUGE

#Load the api
load_dotenv()

#create the client
client = SarvamAI(api_subscription_key = os.getenv("SARVAM_API_KEY"))

def generate_audio(text: str, language: str) -> bytes:

    #get speaker and language code for the selected language
    #falls back to english is languiage not found
    config = SPEAKER_BY_LANGAUGE.get(language, SPEAKER_BY_LANGAUGE["english"])


    audio = client.text_to_speech.convert(
        target_language_code = config["target_language_code"],
        text = text,
        model = "bulbul:v3",
        speaker = config["speaker"]
    )

    combined_audio = "".join(audio.audios)
    audio_bytes = base64.b64decode(combined_audio)

    return audio_bytes