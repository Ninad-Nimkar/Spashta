import pdfplumber
import io
import os
from openai import OpenAI
import base64
from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_text(file_bytes: bytes, filename) -> str:
    extracted_text = ""

    #PDF handeling
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted_text += page.extract_text() or ""
        return extracted_text

    #Image handeling
    else:
        base64_image = base64.b64decode(file_bytes).decode("utf-8")

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all text from this image. Return only the text."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=1500,
        )
        extracted_text = response.choices[0].message.content
        return extracted_text