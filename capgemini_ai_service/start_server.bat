@echo off
cd /d c:\dev\hackathon-capgemini-genai\ai-service
call venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
pause
