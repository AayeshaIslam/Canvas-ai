from PyPDF2 import PdfReader
from openai import OpenAI
reader = PdfReader("spanish.pdf")
number_of_pages = len(reader.pages)
page = reader.pages[0]
text = page.extract_text()



#Pdf processing goes here


prompt = "You are a spanish 1 university professor tasked with creating exams for students, create 10 questions ranging from multiple choice to true or false from the following material: " + text
client = OpenAI(
    api_key="key goes here",
)
chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": prompt,
        }
    ],
    model="gpt-4o",
)
print(chat_completion)


#exam parsing goes here