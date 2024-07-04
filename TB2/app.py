import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

app = Flask(__name__)

history = []

def save_history(history):
    with open("History.txt", 'a', encoding='utf-8') as file:
        for entry in history:
            role = "User" if entry["role"] == "user" else "Bot"
            message = entry["parts"][0]
            file.write(f"{role}: {message}\n")
        file.write("\n")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    global history

    user_input = request.json.get("message", "")

    if not user_input.strip():
        return jsonify({"response": "Please enter a valid message."})

    chat_session = model.start_chat(
        history=history
    )

    response = chat_session.send_message(user_input)

    model_response = response.text

    history.append({"role": "user", "parts": [user_input]})
    history.append({"role": "model", "parts": [model_response]})

    save_history(history)

    return jsonify({"response": model_response})

if __name__ == '__main__':
    app.run(debug=True)
