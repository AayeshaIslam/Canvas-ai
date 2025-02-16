import subprocess
import os

# Define the existing quiz file name
quiz_filename = "quiz.txt"  # Make sure quiz.txt exists in the same directory

# Check if the file exists before running text2qti
if not os.path.exists(quiz_filename):
    print(f"Error: The file '{quiz_filename}' does not exist. Please make sure it is in the same directory.")
    exit(1)

print(f"Using existing file: '{quiz_filename}'")

# Function to check if text2qti is installed and in PATH
def check_text2qti():
    """Returns True if text2qti is installed and available in PATH."""
    try:
        result = subprocess.run(["where", "text2qti"], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

# Run text2qti to generate the QTI package
if check_text2qti():
    try:
        subprocess.run(["text2qti", quiz_filename], check=True)
        print("QTI package successfully created.")
    except subprocess.CalledProcessError as e:
        print(f"Error running text2qti: {e}")
else:
    print("Error: 'text2qti' is not installed or not in PATH. Try running 'pip install text2qti'.")

# Check if the QTI ZIP file was created
qti_zip = "quiz.qti.zip"
if os.path.exists(qti_zip):
    print(f"Success! The QTI package '{qti_zip}' has been generated.")
else:
    print("Something went wrong. Check for errors and try again.")
