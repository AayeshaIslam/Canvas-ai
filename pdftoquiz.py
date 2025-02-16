# Install PyPDF2 in Replit (if not installed)


import PyPDF2
import re

def clean_text(text):
    """
    Cleans extracted text by:
    - Removing excessive newlines
    - Removing extra spaces
    - Formatting text into readable paragraphs
    """
    text = text.replace("\n", " ")  # Convert all newlines to spaces
    text = re.sub(r'\s+', ' ', text)  # Remove extra spaces
    text = text.strip()  # Trim leading/trailing spaces
    return text

def extract_text_pypdf2(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "  # Add space to prevent word breakage

    return clean_text(text)

# Upload PDF manually to Replit and set the correct filename
pdf_path = "spanish doc.pdf"  # Make sure this matches your uploaded file name
formatted_text = extract_text_pypdf2(pdf_path)

print(formatted_text)
