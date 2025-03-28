from flask import Flask, request, jsonify
import os
import shutil

# === Flask App Initialization ===
app = Flask(__name__)

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

    # Generate URL based on Firebase Hosting
    file_url = f"https://canvas-ai-2f5b6.web.app/quizzes/{dest_name}"  # Replace with your project ID
    return file_url


# === Main Route: Test File Saving to Public Folder ===
@app.route("/test-upload", methods=["POST"])
def test_upload():
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

        # Check if output.qti.zip exists and move it to public/quizzes/
        if os.path.exists(qti_zip):
            qti_url = save_file_to_public(qti_zip, "output.qti.zip")
        else:
            print(f"⚠️  {qti_zip} not found. Skipping upload.")

        # === Return File URLs to Test Upload ===
        return jsonify({
            "quizTextURL": txt_url if txt_url else "output.txt not found.",
            "qtiZipURL": qti_url if qti_url else "output.qti.zip not found or QTI conversion failed."
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# === Run Flask App ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
