
Spashta, AI Explanation Engine

Spashta is built to make learning easier and more personal.

Instead of reading long notes or watching long lectures, you can:

Enter any topic
Choose your explanation style
Choose your language

Get:
Clear explanation
Voice output
Transcript
Features

Style-based explanations:
Simple
Gamer
Cricket
Meme
Spiritual

Multi-language support (with voice)
Hindi
English
Hinglish
Marathi

Voice output using AI Text-to-Speech
Transcript displayed along with audio
Minimal dark-themed UI
FastAPI backend with modular architecture
How It Works (Pipeline)

Spashta uses a multi-step AI pipeline:
Topic Input
    ↓
Summarize Core Concepts
    ↓
Build Style + Language Prompt
    ↓
Generate Explanation
    ↓
Translate (if needed)
    ↓
Text-to-Speech
    ↓
Return Audio + Transcript
Tech Stack

Backend:
Python
FastAPI
OpenAI API (for explanation & vision when needed)
Sarvam AI (Text-to-Speech)

Frontend:
HTML / CSS / JavaScript
Minimal dark UI

Deployment
Render / Railway (Backend)
Vercel / Static Hosting (Frontend)
Project Structure
Spashta/
│
├── main.py
├── requirements.txt
│
├── Services/
│   ├── llm_service.py
│   ├── tts_service.py
│
├── Utils/
│   ├── prompt_builder.py
│   ├── text_cleaner.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js


Running Locally
1. Clone the repo
git clone https://github.com/yourusername/spashta.git
cd spashta
2. Create virtual environment
python -m venv venv
venv\Scripts\activate   (Windows)
source venv/bin/activate (Mac/Linux)
3. Install requirements
pip install -r requirements.txt
4. Create .env file
OPENAI_API_KEY=your_key_here
SARVAM_API_KEY=your_key_here
5. Run server
uvicorn main:app --reload

Open:
http://127.0.0.1:8000/docs
API Endpoint
POST /explain

Inputs:
topic
style
language

Returns:
explanation text
audio file
transcript
Why Spashta?

Most educational tools give the same explanation to everyone.

But people understand differently:

Some understand through games
Some through sports
Some through stories
Some through calm, spiritual analogies

Spashta adapts the explanation to the person, not the other way around.

Tagline
Spashta — Learn in the way you understand.

Author
Ninad Nimkar
Building in public. Learning by building.