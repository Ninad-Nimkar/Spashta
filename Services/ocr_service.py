import pdfplumber

from PIL import Image
import io

def extract_text(file_bytes: bytes, filename) -> str:
    extracted_text = ""

    #PDF handeling
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted_text += page.extract_text() or ""

    #Image handeling
    else:
        pass

    return extracted_text