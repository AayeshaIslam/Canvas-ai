from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from openai import OpenAI
import subprocess
import shutil
import os
import firebase_admin
from firebase_admin import credentials, storage, firestore
from dotenv import load_dotenv
import uuid
from datetime import datetime
import base64
import re

# === Flask App Initialization ===
app = Flask(__name__)
CORS(app)

# === Load API Key from .env ===
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

if not openai_api_key:
    raise ValueError("⚠️  OPENAI_API_KEY not found in .env file!")

# === Firebase Setup ===
cred = credentials.Certificate("firebase-adminsdk.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'canvas-ai-2f5b6.appspot.com'
})
bucket = storage.bucket()
db = firestore.client()

# === Define Path to Public Folder for Firebase Hosting ===
PUBLIC_FOLDER = "public"
QUIZZES_FOLDER = os.path.join(PUBLIC_FOLDER, "quizzes")

# Create the public and quizzes folders if they don't exist
if not os.path.exists(QUIZZES_FOLDER):
    os.makedirs(QUIZZES_FOLDER)

# === Helper Functions ===
def save_file_to_public(local_path, dest_name):
    """Saves a file to public/quizzes/ for Firebase Hosting."""
    dest_path = os.path.join(QUIZZES_FOLDER, dest_name)
    shutil.copy(local_path, dest_path)
    file_url = f"https://canvas-ai-2f5b6.web.app/quizzes/{dest_name}"
    print(f"✅ File uploaded to: {file_url}")
    return file_url

def check_text2qti():
    try:
        result = subprocess.run(["where", "text2qti"], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def run_firebase_deploy():
    """Runs firebase deploy using the correct path."""
    try:
        print("🚀 Running firebase deploy...")
        firebase_path = shutil.which("firebase")
        if firebase_path is None:
            raise FileNotFoundError("❌ Firebase CLI not found.")
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
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def clean_quiz_text(quiz_text):
    # Split into lines and strip leading/trailing whitespaces
    lines = quiz_text.splitlines()
    stripped_lines = [line.lstrip() for line in lines]

    # Find the index of the first line that starts with a number
    start_index = None
    for i, line in enumerate(stripped_lines):
        if re.match(r'^\d+', line):
            start_index = i
            break

    # If a valid starting line is found, keep lines from that point on
    if start_index is not None:
        cleaned_lines = stripped_lines[start_index:]
    else:
        cleaned_lines = []

    # Join the cleaned lines back into a string
    cleaned_text = '\n'.join(cleaned_lines)
    return cleaned_text


def generate_quiz_from_text(text: str, question_counts: dict, courseId: str, instructions: str = "") -> str:
    """Generate quiz questions from the given text using OpenAI."""
    with open("quiz.txt", "r", encoding="utf-8") as file:
        sample_quiz = file.read()

    client = OpenAI(api_key=openai_api_key)
    
    # Format the question counts for the prompt
    question_types = []
    for q_type, count in question_counts.items():
        if count > 0:
            question_types.append(f"{count} {q_type} questions")
    
    question_types_str = ", ".join(question_types)
    
    # Create the prompt
    prompt = f"""Pretend you are a Professor of the course {courseId}. Generate a quiz based on the following text. Include {question_types_str}.
Format the quiz in a clear, readable way with proper numbering and spacing.
For multiple choice questions, include 4 options (A, B, C, D) with one correct answer.
For true/false questions, clearly mark the correct answer."""
    if instructions.strip():
        prompt += f"""
    Follow these additional instructions **as long as they do not change or break the formatting** used in the sample quiz:
    {instructions.strip()}"""
    prompt += f"""
The output should exactly match the formatting from the following quiz sample:
{sample_quiz}
In the output don't include any text other than the questions and the answer choices 
Text to generate quiz from:
{text}"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates educational quizzes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=5000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating quiz: {str(e)}")
        raise

# === New Route: Get Quiz Text ===
@app.route("/get-quiz-text", methods=["GET"])
def get_quiz_text_by_id():
    try:
        quiz_id = request.args.get("id")
        if not quiz_id:
            return jsonify({"error": "Quiz ID is required"}), 400

        quiz_ref = db.collection("quizzes").document(quiz_id)
        quiz_doc = quiz_ref.get()

        if not quiz_doc.exists:
            return jsonify({"error": "Quiz not found"}), 404

        quiz_data = quiz_doc.to_dict()
        return jsonify({"text": quiz_data.get("text", "")})

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# === Modified Main Route: Generate Quiz ===
@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    try:
        data = request.json
        print("Received request data:", {
            'courseId': data.get('courseId'),
            'materials': data.get('materials'),
            'questionCounts': data.get('questionCounts'),
            'fileName': data.get('fileName'),
            'instructions': data.get('instructions', ''),
            'hasFileData': bool(data.get('fileData')),
            'fileDataLength': len(data.get('fileData', '')) if data.get('fileData') else 0
        })
        
        # Get file data from request
        file_data = data.get('fileData')
        file_name = data.get('fileName')
        instructions = data.get('instructions', '')
        courseId = data.get('courseId')
        if not file_data:
            print("Error: No file data provided")
            return jsonify({"error": "No file data provided"}), 400
            
        # Save the file temporarily
        temp_file_path = f"temp_{file_name}"
        try:
            with open(temp_file_path, 'wb') as f:
                f.write(base64.b64decode(file_data))
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            return jsonify({"error": f"Error saving file: {str(e)}"}), 500
            
        # Extract text from PDF
        try:
            reader = PdfReader(temp_file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
        except Exception as e:
            print(f"Error reading PDF: {str(e)}")
            return jsonify({"error": f"Error reading PDF: {str(e)}"}), 500
            
        # Clean up temp file
        try:
            os.remove(temp_file_path)
        except Exception as e:
            print(f"Warning: Error removing temp file: {str(e)}")
        
        # Generate quiz using the extracted text
        try:
            quiz_text = generate_quiz_from_text(text, data.get('questionCounts', {}), instructions, courseId)
        except Exception as e:
            print(f"Error generating quiz text: {str(e)}")
            return jsonify({"error": f"Error generating quiz text: {str(e)}"}), 500

        quiz_text = clean_quiz_text(quiz_text)
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

        # Generate unique quiz ID
        quiz_id = str(uuid.uuid4())
        
        # Return quiz data directly without storing in Firestore
        return jsonify({
            'quizId': quiz_id,
            'quizText': quiz_text,
            'courseId': data.get('courseId'),
            'materials': data.get('materials', []),
            'questionCounts': data.get('questionCounts', {}),
            'instructions': data.get('instructions', ''),
            'createdAt': datetime.now().isoformat(),
            'fileName': file_name
        })
        
    except Exception as e:
        print("Error in generate_quiz:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-quiz-text/<quiz_id>', methods=['GET'])
def get_quiz_text(quiz_id):
    try:
        # Get quiz data from Firestore
        quiz_doc = db.collection('quizzes').document(quiz_id).get()
        if not quiz_doc.exists:
            return jsonify({"error": "Quiz not found"}), 404
            
        quiz_data = quiz_doc.to_dict()
        return quiz_data.get('quizText', '')
        
    except Exception as e:
        print("Error getting quiz text:", str(e))
        return jsonify({"error": str(e)}), 500

# === Run Flask App ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)