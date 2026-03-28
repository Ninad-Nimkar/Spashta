from sarvamai import SarvamAI
from openai import OpenAI
import os
from dotenv import load_dotenv
from Services.prompt_builder import build_prompt
load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(API_KEY)

def summarize(text: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
            messages= [{"role": "user", 
                        "content": f'''
            extract the core concepts from this content.
            remove formatting, repetition and irrelevant text
            {text}'''}],
            max_tokens=1000,
        )

    return response.choices[0].message.content

def explain(summary: str, style: str, langauge: str) -> str:
    prompt = build_prompt(summary, style, langauge)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
            messages= [{"role": "user", "content": prompt}],
            max_tokens=1000,
        )

    return response.choices[0].message.content