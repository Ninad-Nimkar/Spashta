from openai import OpenAI
import os
from dotenv import load_dotenv 
from Services.prompt_builder import build_prompt

#load the .env file so ve can access the API
load_dotenv()

#create the openai client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#this funtion streams the explanation chunk by chunk 
#"yield" is what makes the generation, caller gets chunks one by one
def explain(topic: str, style: str, language: str):

    #build the full prompt using style and language
    prompt = build_prompt(topic, style, language)

    
    stream = client.chat.completions.create(
        model="gpt-40-mini",
        messages=[{"role": "user", "content": prompt}]
        max_tokens=1000,
        #stream=true tells openai to send the response in chuks
        stream=True
    )

    #loop thorugh each chunk as it arrives from openai
    for chunk in stream:
        #each chunk has a choice list, we want the first one
        #delta.content is the new text in this chunk
        text = chunk.choices[0].delta.content

        #only yield if there's actual text
        if text:
            yield text

