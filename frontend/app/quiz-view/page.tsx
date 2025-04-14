"use client"

import { useState, useEffect } from "react"
import { Download, ArrowLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Quiz {
  id: string
  courseId: string
  materials: string[]
  questionCounts: { type: string; count: number }[]
  instructions: string
  createdAt: string
  textUrl: string
  qtiUrl: string
  fileName: string
}

export default function QuizView() {
  const searchParams = useSearchParams()
  const quizId = searchParams.get("id")
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizText, setQuizText] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        setError("No quiz ID provided")
        setLoading(false)
        return
      }

      try {
        // Get quiz data from localStorage
        const pastQuizzes = JSON.parse(localStorage.getItem("pastQuizzes") || "[]")
        const foundQuiz = pastQuizzes.find((q: Quiz) => q.id === quizId)

        if (!foundQuiz) {
          setError("Quiz not found")
          setLoading(false)
          return
        }

        setQuiz(foundQuiz)
        setQuizText(foundQuiz.textUrl)
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError(err instanceof Error ? err.message : "Failed to load quiz")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId])

  const handleDownload = () => {
    if (!quizText) return

    const blob = new Blob([quizText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quiz-${quiz?.id || "unknown"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3edf7] flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-3xl w-full text-center">
          <p className="text-[#49454f]">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3edf7] flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-3xl w-full text-center">
          <p className="text-[#b3261e] mb-4">{error}</p>
          <a
            href="/dashboard"
            className="text-[#6750a4] hover:text-[#7b68b4] flex items-center justify-center"
          >
            <ArrowLeft className="mr-2" />
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3edf7] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Quiz Details</h1>
              <p className="text-[#49454f]">
                Generated on{" "}
                {new Date(quiz?.createdAt || "").toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="bg-[#6750a4] text-white py-2 px-4 rounded-lg flex items-center hover:bg-[#7b68b4] transition-colors"
              >
                <Download className="mr-2" />
                Download Text
              </button>
              <a
                href="/dashboard"
                className="border border-[#cac4d0] text-[#1d1b20] py-2 px-4 rounded-lg flex items-center hover:bg-[#f3edf7] transition-colors"
              >
                <ArrowLeft className="mr-2" />
                Back to Dashboard
              </a>
            </div>
          </div>

          <div className="border border-[#cac4d0] rounded-lg p-4 bg-[#f3edf7]">
            <pre className="whitespace-pre-wrap font-mono text-sm text-[#1d1b20]">
              {quizText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 