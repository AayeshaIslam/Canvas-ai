
# AI-Powered Canvas Quiz Generator

[🎥 Watch the Demo](https://www.youtube.com/watch?v=bb5Ti_cx0G4)

---

## 📌 Project Overview

This project delivers a completed AI-powered tool that allows faculty to easily convert PDF course materials into fully formatted quizzes for their Canvas courses.

By simply uploading a PDF, instructors can receive a bank of well-structured, relevant quiz questions generated through AI, which are then automatically uploaded to their Canvas course, eliminating the need for manual formatting or question entry.

The tool is designed to streamline the quiz creation process and make it more accessible, especially for instructors managing multiple courses or large classes.

**Key Features:**
- Automatic content extraction
- AI-generated questions tailored to material
- Seamless Canvas integration
- Time-saving for large or multiple courses
- Improves accessibility and learning experience

---

## ⚙️ Prerequisites

### Install Python  
[Download Python](https://www.python.org/downloads/)  
If needed: [Watch Setup Video](https://www.youtube.com/watch?v=4V14G5_CNGg)

### Install NodeJS  
[Download NodeJS](https://nodejs.org/en/download)  
If needed: [Watch Setup Video](https://www.youtube.com/watch?v=4FAtFwKVhn0)

### Install PyCharm  
[Download PyCharm](https://www.jetbrains.com/pycharm/download/)  
If needed: [Watch Setup Video](https://youtu.be/KN6vHY-3F9E?si=8QNbV_ta1UpalzQA)

---

## 🔑 API Setup

### OpenAI API
- [Create OpenAI Account](https://openai.com/index/openai-api/)
- [Get Your API Key](https://platform.openai.com/api-keys)
- [Watch Detailed Setup](https://www.youtube.com/watch?v=hSVTPU-FVLI)

### Canvas API (Optional)
- Generate a Canvas API token through your institution’s IT department for course-level integration.

---

## 🔐 Tokens Setup

Navigate to the `/backend` folder and open the `.env` file.  
Paste the following values with your actual keys:

```
OPENAI_API_KEY=your_openai_api_key_here
CANVAS_API_KEY=your_canvas_api_key_here
```

---

## 🛠️ Running the Project

### Backend Setup

1. Open the project in PyCharm  
2. Open terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies (only once):
   ```bash
   pip install Flask
   pip install flask-cors
   pip install PyPDF2
   pip install openai
   pip install firebase-admin
   pip install python-dotenv
   pip install requests
   ```
4. Start the backend server:
   ```bash
   python aitoken.py -p 8080
   ```

### Frontend Setup

1. Open a **new terminal** and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (only once):
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

4. Go to [http://localhost:3000](http://localhost:3000) in your browser

---

