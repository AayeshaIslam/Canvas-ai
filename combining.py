from PyPDF2 import PdfReader
from openai import OpenAI
import subprocess
import os
import re

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

file_name = "output.txt"

pdf_files = [f for f in os.listdir() if f.endswith('.pdf')]

extra_context = "You are a spanish professor, so the quiz should be in spanish"

all_cleaned_quiz_texts = []

with open("quiz.txt", "r", encoding="utf-8") as file:
    sample_quiz = file.read()

# Extract text from PDF
for index, pdf_file in enumerate(pdf_files, start=1):
    reader = PdfReader(pdf_file)
    page = reader.pages[0]
    text = page.extract_text()

# Generate questions using OpenAI
    prompt = ("You are a university professor tasked with creating exams for students. "
          "Create 10 questions ranging from multiple choice, select all that apply and true or false from the following material: "
          + text +
            "You are processing PDF " + str(index) + " so you should start on question " + str(index - 1) + "1."
            "The output will be processed later so it is imperative that the output follows the following sample quiz: " + sample_quiz +
            "This is some extra context of extreme importance to the quiz generation: " + extra_context +
            "The output must closely follow these rules: Multiple choice questions must always have a single correct answer, no more no less"
            "There must not be repeated answer choices"
            "After every question and the possible choices, there should be a line break."
            "The output should only be the question and the answer choices")

    client = OpenAI(api_key="key here")

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="gpt-4o",
    )

    quiz_text = chat_completion.choices[0].message.content
    cleaned_text = clean_quiz_text(quiz_text)

    all_cleaned_quiz_texts.append(cleaned_text)

with open(file_name, "w", encoding="utf-8") as file:
    file.write('\n\n'.join(all_cleaned_quiz_texts))

print(f"File '{file_name}' has been created successfully with quizzes from {len(pdf_files)} PDF files.")

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

qti_zip = "output.zip"
if os.path.exists(qti_zip):
    print(f"Success! The QTI package '{qti_zip}' has been generated.")
else:
    print("Something went wrong. Check for errors and try again.")
