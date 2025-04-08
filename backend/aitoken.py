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
import requests
import re
import time

# === Flask App Initialization ===
app = Flask(__name__)
CORS(app)

# === Load Environment Variables ===
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
CANVAS_API_TOKEN = os.getenv("CANVAS_API_TOKEN")

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

# === Canvas API Helper Functions ===
def setup_canvas_api(course_url):
    """Setup Canvas API URL and course ID from course URL."""
    if not CANVAS_API_TOKEN:
        raise ValueError("⚠️ CANVAS_API_TOKEN not found in .env file!")
    
    url_pattern = r'(https?://[^/]+)/courses/(\d+)'
    url_match = re.search(url_pattern, course_url)
    
    if not url_match:
        raise ValueError("Invalid course URL. Please provide a valid Canvas course URL.")
    
    api_url = url_match.group(1)
    course_id = int(url_match.group(2))
    
    print(f"🎓 Using Canvas API URL: {api_url}")
    print(f"🎓 Using Course ID: {course_id}")
    
    return {
        'api_url': api_url,
        'course_id': course_id,
        'headers': {"Authorization": f"Bearer {CANVAS_API_TOKEN}"}
    }

def upload_quiz_to_canvas(qti_path, canvas_config):
    """Upload QTI file to Canvas and create quiz."""
    try:
        print("🔄 Uploading quiz to Canvas...")
        
        # 1. Initiate content migration
        init_url = f"{canvas_config['api_url']}/api/v1/courses/{canvas_config['course_id']}/content_migrations"
        payload = {
            "migration_type": "qti_converter",
            "pre_attachment[name]": os.path.basename(qti_path)
        }
        
        response = requests.post(
            init_url, 
            data=payload, 
            headers=canvas_config['headers']
        )
        response.raise_for_status()
        migration = response.json()
        
        # 2. Get upload details
        upload_url = migration.get("pre_attachment", {}).get("upload_url")
        upload_params = migration.get("pre_attachment", {}).get("upload_params")
        progress_url = migration.get("progress_url")
        
        if not all([upload_url, upload_params, progress_url]):
            raise ValueError("Failed to get upload details from Canvas")

        print("✅ Content migration initiated.")

        # 3. Upload file
        with open(qti_path, 'rb') as file:
            files = {'file': file}
            upload_response = requests.post(upload_url, data=upload_params, files=files)
            
            if upload_response.status_code in (301, 302):
                confirm_url = upload_response.headers.get('Location')
                if confirm_url:
                    confirm_response = requests.get(confirm_url, headers=canvas_config['headers'])
                    confirm_response.raise_for_status()
                    print("✅ File upload confirmed.")
            else:
                upload_response.raise_for_status()
                print("✅ File uploaded successfully.")

        # 4. Monitor progress
        print("⏳ Processing QTI file...")
        progress_check_url = progress_url
        if not progress_url.startswith('http'):
            progress_check_url = f"{canvas_config['api_url']}{progress_url}"
            
        while True:
            prog_resp = requests.get(progress_check_url, headers=canvas_config['headers'])
            prog_resp.raise_for_status()
            progress_data = prog_resp.json()
            state = progress_data.get("workflow_state")
            
            if state == "completed":
                print("✅ Import completed! Quiz has been created.")
                break
            elif state == "failed":
                error_msg = f"Import failed: {progress_data}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)
                
            percent = progress_data.get("completion")
            print(f"⏳ Progress: {percent}% (state: {state})")
            time.sleep(2)
            
        # 5. Verify quiz creation
        quizzes_url = f"{canvas_config['api_url']}/api/v1/courses/{canvas_config['course_id']}/quizzes"
        quizzes_resp = requests.get(quizzes_url, headers=canvas_config['headers'])
        quizzes_resp.raise_for_status()
        quizzes = quizzes_resp.json()
        
        # Identify the newly created quiz
        new_quiz = max(quizzes, key=lambda q: q.get('id', 0)) if quizzes else None
        if new_quiz:
            quiz_info = f"New Quiz created: '{new_quiz.get('title')}' (ID: {new_quiz.get('id')})"
            print(f"✅ {quiz_info}")
            return {"status": "success", "message": quiz_info, "quiz_id": new_quiz.get('id')}
        else:
            print("⚠️ No quizzes found in course.")
            return {"status": "warning", "message": "Quiz upload completed, but no quizzes found in course."}

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Canvas upload error: {error_msg}")
        return {"status": "error", "message": error_msg}

# === Main Route: Generate Quiz, Convert to QTI, and Deploy ===
@app.route("/generate-quiz", methods=["POST"], strict_slashes=False)
def generate_quiz():
    try:
        # Get Canvas course URL if provided in the request
        data = request.get_json() or {}
        course_url = data.get('courseUrl', '')
        canvas_config = None
        
        if course_url:
            try:
                canvas_config = setup_canvas_api(course_url)
                print(f"✅ Canvas API configured for course: {course_url}")
            except ValueError as e:
                print(f"⚠️ Canvas API setup error: {str(e)}")
                # Continue without Canvas integration if URL is invalid
        
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

        # === Step 6: Upload to Canvas if configured ===
        canvas_result = None
        if canvas_config and qti_zip and os.path.exists(qti_zip):
            canvas_result = upload_quiz_to_canvas(qti_zip, canvas_config)
            print(f"🎓 Canvas upload result: {canvas_result}")

        # === Step 7: Deploy to Firebase Hosting Automatically ===
        if run_firebase_deploy():
            print("✅ Firebase Hosting updated successfully.")
        else:
            return jsonify({"error": "Failed to deploy to Firebase."}), 500

        # === Step 8: Return File URLs and Canvas Result to Frontend ===
        response = {
            "quizTextURL": txt_url if txt_url else "output.txt not found.",
            "qtiZipURL": qti_url if qti_url else "output.zip not found or QTI conversion failed."
        }
        
        # Add Canvas result if available
        if canvas_result:
            response["canvasUpload"] = canvas_result
            
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# === Run Flask App ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
