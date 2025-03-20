import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Canvas API configuration
API_URL = "https://k12.instructure.com"
API_TOKEN = os.getenv("CANVAS_API_TOKEN")
COURSE_ID = 1999158  # Hardcoded course ID since this is a private repository
# Use a relative file path for QTI files; ensure that the QTI file is located in the './QTI_Files' directory.
QTI_ZIP_PATH = "./QTI_Files/quiz.zip" # Adjust the filename as needed

# 1. Set up authentication header using the API token.
#    The token is included as a Bearer token in the Authorization header.
#    [Canvas API Auth docs](https://canvas.instructure.com/doc/api/file.oauth.html)
headers = {
    "Authorization": f"Bearer {API_TOKEN}"
}

# 2. Initiate content migration for QTI import.
#    We use the Content Migrations API with migration_type "qti_converter".
#    Include the file name in pre_attachment so Canvas knows we're uploading a file.
#    [Content Migrations API](https://canvas.instructure.com/doc/api/content_migrations.html)
init_url = f"{API_URL}/api/v1/courses/{COURSE_ID}/content_migrations"
payload = {
    "migration_type": "qti_converter",          # specify QTI import type
    "pre_attachment[name]": QTI_ZIP_PATH.split('/')[-1]  # filename of the QTI zip
}
response = requests.post(init_url, data=payload, headers=headers)
response.raise_for_status()  # ensure the request was successful

# Parse the JSON response to get upload URL and parameters.
migration = response.json()
upload_url = migration.get("pre_attachment", {}).get("upload_url")
upload_params = migration.get("pre_attachment", {}).get("upload_params")
progress_url = migration.get("progress_url")  # URL to check migration progress

print("Content migration initiated.")

# 3. Upload the QTI file to Canvas using the provided upload_url.
#    We must send a multipart/form-data POST with all upload_params and the file content.
#    [File Uploads API](https://canvas.instructure.com/doc/api/file.uploads.html)
files = {
    # 'file' should be the last field in the multipart form according to Canvas docs.
    'file': open(QTI_ZIP_PATH, 'rb')
}
# Important: Do NOT include the Authorization header in this request.
upload_response = requests.post(upload_url, data=upload_params, files=files)
if upload_response.status_code in (301, 302):
    # Follow the redirect to finalize the file upload in Canvas.
    confirm_url = upload_response.headers.get('Location')
    if confirm_url:
        confirm_response = requests.get(confirm_url, headers=headers)
        confirm_response.raise_for_status()
        print("File upload confirmed.")
else:
    upload_response.raise_for_status()
    print("File uploaded successfully.")

# 4. Monitor the content migration progress until it's completed.
print("Processing QTI file...")
# progress_url is usually a path like "/api/v1/progress/XXXX" – append it to the base URL.
if progress_url.startswith('http'):
    progress_check_url = progress_url
else:
    progress_check_url = f"{API_URL}{progress_url}"
while True:
    prog_resp = requests.get(progress_check_url, headers=headers)
    prog_resp.raise_for_status()
    progress_data = prog_resp.json()
    state = progress_data.get("workflow_state")
    if state == "completed":
        print("Import completed! Quiz has been created.")
        break
    elif state == "failed":
        raise Exception(f"Import failed: {progress_data}")
    # If not completed or failed, you can check progress percentage.
    percent = progress_data.get("completion")
    print(f"Progress: {percent}% (state: {state})")
    time.sleep(2)  # wait before polling again
# [Content Migrations Progress](https://canvas.instructure.com/doc/api/content_migrations.html#method.content_migrations.show)

# 5. (Optional) Verify the quiz creation via Canvas API.
#    We can fetch the list of quizzes in the course and find the newest one.
#    [Quizzes API](https://canvas.instructure.com/doc/api/quizzes.html)
quizzes_url = f"{API_URL}/api/v1/courses/{COURSE_ID}/quizzes"
quizzes_resp = requests.get(quizzes_url, headers=headers)
quizzes_resp.raise_for_status()
quizzes = quizzes_resp.json()

# Identify the newly created quiz by finding the one with the highest ID or recent creation.
new_quiz = max(quizzes, key=lambda q: q.get('id', 0)) if quizzes else None
if new_quiz:
    print(f"New Quiz created: '{new_quiz.get('title')}' (ID: {new_quiz.get('id')})")
else:
    print("No quizzes found in course.")
