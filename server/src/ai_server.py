from flask import Flask, request, jsonify
from llama_cpp import Llama

app = Flask(__name__)

# Increased context window to 4096 and set up the model
llm = Llama(
    model_path="./models/qwen.gguf",
    n_ctx=4096, 
    n_threads=4
)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt", "")

    output = llm(
        prompt,
        max_tokens=4096,
        temperature=0.0,  # CRITICAL: 0.0 forces the most logical/boring path (JSON)
        stop=["<|endoftext|>", "Instruct:", "Input:", "A:"]
    )

    text = output["choices"][0]["text"]
    return jsonify({ "response": text.strip() })

if __name__ == "__main__":
    app.run(port=5001)