from flask import Flask, request, jsonify
from PyPDF2 import PdfReader
from openai import OpenAI
import subprocess
import os
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv

# === Load API Key from .env ===
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

if not openai_api_key:
    raise ValueError("⚠️  OPENAI_API_KEY not found in .env file!")

# === Firebase Setup ===
cred = credentials.Certificate("firebase-adminsdk.json")  # Path to your Firebase private key
firebase_admin.initialize_app(cred, {
    'storageBucket': 'canvas-ai-2f5b6.appspot.com'  # Replace with your bucket name
})
bucket = storage.bucket()

# === Flask App ===
app = Flask(__name__)

# === Helper Function: Upload to Firebase ===
def upload_file_to_firebase(local_path, dest_name):
    """Uploads a file to Firebase and returns the public URL."""
    blob = bucket.blob(dest_name)
    blob.upload_from_filename(local_path)
    blob.make_public()
    return blob.public_url

# === Helper Function: Check if text2qti is installed ===
def check_text2qti():
    try:
        result = subprocess.run(["where", "text2qti"], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

# === Main Route: Generate Quiz ===
@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    try:
        # === Step 1: Extract text from PDF ===
        pdf_path = "spanish.pdf"  # Update if needed
        reader = PdfReader(pdf_path)
        page = reader.pages[0]
        text = page.extract_text()

        if not text:
            return jsonify({"error": "No text found in the PDF."}), 400

        # === Step 2: Generate Quiz with OpenAI ===
        prompt = (
                "You are a Spanish 1 university professor tasked with creating exams for students. "
                "Create 10 questions ranging from multiple choice and true or false from the following material: "
                + text +
                " When formatting the quiz, the question should be a number like 1. What is the capital of France? "
                "And the correct answer will have an asterisk before it like *a) Paris. "
                "After every question and the possible choices, there should be a line break. Only return the formatted questions as plain text with no introduction, explanations, or conclusion."
        )

        client = OpenAI(api_key=openai_api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o",
        )

        quiz_text = chat_completion.choices[0].message.content
        if not quiz_text:
            return jsonify({"error": "No quiz generated."}), 500

        # === Step 3: Save Quiz to File ===
        txt_filename = "output.txt"
        with open(txt_filename, "w", encoding="utf-8") as file:
            file.write(quiz_text)

        # === Step 4: Convert to QTI using text2qti ===
        if check_text2qti():
            try:
                subprocess.run(["text2qti", txt_filename], check=True)
                print("✅ QTI package successfully created.")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error running text2qti: {e}")
        else:
            print("⚠️  text2qti not installed or not in PATH. Run 'pip install text2qti'.")

        # === Step 5: Upload Files to Firebase ===
        txt_url = upload_file_to_firebase(txt_filename, "quizzes/output.txt")

        qti_zip = "output.qti.zip"
        qti_url = None
        if os.path.exists(qti_zip):
            qti_url = upload_file_to_firebase(qti_zip, "quizzes/output.qti.zip")

        # === Step 6: Return File URLs to Frontend ===
        return jsonify({
            "quizTextURL": txt_url,
            "qtiZipURL": qti_url if qti_url else "QTI conversion failed or not found."
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === Run Flask App ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
