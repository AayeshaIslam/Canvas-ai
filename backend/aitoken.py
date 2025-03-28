from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from openai import OpenAI
import subprocess
import shutil
import os
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv

# === Flask App Initialization ===
app = Flask(__name__)
CORS(app)

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

# === Define Path to Public Folder for Firebase Hosting ===
PUBLIC_FOLDER = "public"
QUIZZES_FOLDER = os.path.join(PUBLIC_FOLDER, "quizzes")

# Create the public and quizzes folders if they don't exist
if not os.path.exists(QUIZZES_FOLDER):
    os.makedirs(QUIZZES_FOLDER)

# === Helper Function: Save File to Public Folder ===
def save_file_to_public(local_path, dest_name):
    """Saves a file to public/quizzes/ for Firebase Hosting."""
    dest_path = os.path.join(QUIZZES_FOLDER, dest_name)
    shutil.copy(local_path, dest_path)

    # Generate the correct URL format
    file_url = f"https://canvas-ai-2f5b6.web.app/quizzes/{dest_name}"
    print(f"✅ File uploaded to: {file_url}")
    return file_url


# === Helper Function: Upload to Firebase (Not in Use Now) ===
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


# === Helper Function: Detect and Run Firebase Deploy ===
def run_firebase_deploy():
    """Runs firebase deploy using the correct path."""
    try:
        print("🚀 Running firebase deploy...")

        # Automatically detect the path to firebase CLI
        firebase_path = shutil.which("firebase")

        if firebase_path is None:
            raise FileNotFoundError("❌ Firebase CLI not found. Make sure it's installed and added to PATH.")

        # Run firebase deploy using the detected path
        result = subprocess.run(
            [firebase_path, "deploy", "--only", "hosting"],
            check=True,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"❌ Firebase deploy failed: {result.stderr}")
            return False

        print("✅ Firebase deploy output:")
        print(result.stdout)
        return True

    except FileNotFoundError as e:
        print(f"❌ Error: {str(e)}")
        return False
    except subprocess.CalledProcessError as e:
        print("❌ Firebase deploy failed with error:")
        print(e.stdout)
        print(e.stderr)
        return False


# === Main Route: Generate Quiz, Convert to QTI, and Deploy ===
@app.route("/generate-quiz", methods=["POST"], strict_slashes=False)
def generate_quiz():
    try:
        # === Step 1: Extract text from PDF ===
        pdf_path = os.path.join(PUBLIC_FOLDER, "spanish.pdf")
        if not os.path.exists(pdf_path):
            return jsonify({"error": f"PDF file not found at {pdf_path}"}), 400

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

        # === Step 3: Save Quiz to File in Public Folder ===
        txt_filename = os.path.join(PUBLIC_FOLDER, "output.txt")
        with open(txt_filename, "w", encoding="utf-8") as file:
            file.write(quiz_text)

        # === Step 4: Convert to QTI using text2qti ===
        if check_text2qti():
            try:
                # Run text2qti without the -o flag
                subprocess.run(["text2qti", txt_filename], check=True)
                print("✅ QTI package successfully created.")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error running text2qti: {e}")
                qti_zip = None
        else:
            print("⚠️  text2qti not installed or not in PATH. Run 'pip install text2qti'.")
            qti_zip = None

        # Correct file path for the generated zip
        qti_zip = os.path.join(PUBLIC_FOLDER, "output.zip")
        print(qti_zip)

        # Check if the output.zip was created correctly
        if not os.path.exists(qti_zip):
            print(f"⚠️  QTI package {qti_zip} not generated. Skipping upload.")
            qti_zip = None

        # === Step 5: Move Generated Files to quizzes/ for Firebase Hosting ===
        txt_url = None
        qti_url = None

        if os.path.exists(txt_filename):
            txt_url = save_file_to_public(txt_filename, "output.txt")
        else:
            print(f"⚠️  {txt_filename} not found. Skipping upload.")

        if qti_zip and os.path.exists(qti_zip):
            qti_url = save_file_to_public(qti_zip, "output.zip")
        else:
            print(f"⚠️  {qti_zip} not found. Skipping upload.")

        # === Step 6: Deploy to Firebase Hosting Automatically ===
        if run_firebase_deploy():
            print("✅ Firebase Hosting updated successfully.")
        else:
            return jsonify({"error": "Failed to deploy to Firebase."}), 500

        # === Step 7: Return File URLs to Frontend ===
        return jsonify({
            "quizTextURL": txt_url if txt_url else "output.txt not found.",
            "qtiZipURL": qti_url if qti_url else "output.zip not found or QTI conversion failed."
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# === Run Flask App ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
