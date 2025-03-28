from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import shutil
import subprocess
import logging

# === Flask App Initialization ===
app = Flask(__name__)
CORS(app)

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


# === Main Route: Generate Quiz and Upload Files ===
@app.route("/generate-quiz", methods=["POST"], strict_slashes=False)
def generate_quiz():
    try:
        txt_filename = "output.txt"
        qti_zip = "output.zip"

        txt_url = None
        qti_url = None

        # Check if output.txt exists and move it to public/quizzes/
        if os.path.exists(txt_filename):
            txt_url = save_file_to_public(txt_filename, "output.txt")
        else:
            print(f"⚠️  {txt_filename} not found. Skipping upload.")

        # Check if output.zip exists and move it to public/quizzes/
        if os.path.exists(qti_zip):
            qti_url = save_file_to_public(qti_zip, "output.zip")
        else:
            print(f"⚠️  {qti_zip} not found. Skipping upload.")

        # === Deploy to Firebase Hosting Automatically ===
        if run_firebase_deploy():
            print("✅ Firebase Hosting updated successfully.")
        else:
            return jsonify({"error": "Failed to deploy to Firebase."}), 500

        # === Return File URLs to Frontend ===
        return jsonify({
            "quizTextURL": txt_url if txt_url else "output.txt not found.",
            "qtiZipURL": qti_url if qti_url else "output.zip not found or QTI conversion failed."
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# === Run Flask App ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
