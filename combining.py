from PyPDF2 import PdfReader
from openai import OpenAI
import subprocess
import os

# Extract text from PDF
reader = PdfReader("spanish.pdf")
page = reader.pages[0]
text = page.extract_text()

# Generate questions using OpenAI
prompt = ("You are a Spanish 1 university professor tasked with creating exams for students. "
          "Create 10 questions ranging from multiple choice and true or false from the following material: "
          + text +
          " When formatting the quiz, the question should be a number like 1. What is the capital of France? "
          "And the correct answer will have an asterisk before it like *a) Paris. "
          "After every question and the possible choices, there should be a line break. Only output the formatted questions.")

client = OpenAI(api_key="")

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": prompt}],
    model="gpt-4o",
)

quiz_text = chat_completion.choices[0].message.content
file_name = "output.txt"

with open(file_name, "w", encoding="utf-8") as file:
    file.write(quiz_text)

print(f"File '{file_name}' has been created successfully.")

# Convert generated questions to QTI format
def check_text2qti():
    try:
        result = subprocess.run(["where", "text2qti"], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

if check_text2qti():
    try:
        subprocess.run(["text2qti", file_name], check=True)
        print("QTI package successfully created.")
    except subprocess.CalledProcessError as e:
        print(f"Error running text2qti: {e}")
else:
    print("Error: 'text2qti' is not installed or not in PATH. Try running 'pip install text2qti'.")

qti_zip = "output.qti.zip"
if os.path.exists(qti_zip):
    print(f"Success! The QTI package '{qti_zip}' has been generated.")
else:
    print("Something went wrong. Check for errors and try again.")
