import pdfplumber
from PIL import Image
import io
from openai import OpenAI
from fastapi import FastAPI
import base64
from llm_service import client
from prompt_builder import build_prompt
from dotenv import load_dotenv
load_dotenv()

def extract_text(file_bytes: bytes, filename) -> str:
    extracted_text = ""

    #PDF handeling
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted_text += page.extract_text() or ""

    #Image handeling
    else:
        base64_image = base64.b64decode(file_bytes).decode("utf-8")

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [{
                    "type": "text",
                    "text":f"extract text"
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{base64_image}"}
                }]
            }],
            max_tokens=1500,
            temperature=0.3
        )

    return{
        "input_type": "image",
        "solution": response.choices[0].message.content
    }