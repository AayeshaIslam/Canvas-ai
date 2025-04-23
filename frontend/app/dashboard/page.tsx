"use client"

import { Book, ChevronDown, FileText, Menu, Minus, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import type { Quiz, CourseOption, MaterialOption, QuestionTypeCount } from "@/types/quiz"


export default function Dashboard() {

  const [selectedCourse, setSelectedCourse] = useState<string>("spn1130")
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10)
  const [questionTypeCounts, setQuestionTypeCounts] = useState<QuestionTypeCount[]>([
    { type: "multiple-choice", count: 5 },
    { type: "true-false", count: 3 },
    { type: "select-all-that-apply", count: 2 },
  ])
  const [instructions, setInstructions] = useState<string>("")

  const [pastQuizzes, setPastQuizzes] = useState<Quiz[]>([])
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [canvasCourseId, setCanvasCourseId] = useState<string>("1999158")
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const [newCourseCode, setNewCourseCode] = useState<string>("")
  const [newCourseName, setNewCourseName] = useState<string>("")
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([
    { id: "spn1130", name: "SPN1130: Beginning Spanish I" },
    { id: "eng2000", name: "ENG2000: Introduction to Literature" },
    { id: "math101", name: "MATH101: Calculus I" },
  ])

  const materialOptions: MaterialOption[] = [
    { id: "chapter1", name: "Chapter 1: Introduction", icon: "file" },
    { id: "chapter2", name: "Chapter 2: Basic Concepts", icon: "file" },
    { id: "textbook", name: "Textbook: Spanish for Beginners", icon: "book" },
  ]

  const questionTypes = [
    { id: "multiple-choice", name: "Multiple Choice" },
    { id: "true-false", name: "True/False" },
    { id: "select-all-that-apply", name: "Select All That Apply" },
  ]

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Load uploaded files from localStorage on component mount
  useEffect(() => {
    const storedFiles = localStorage.getItem('uploadedFiles')
    console.log("Loading files from localStorage:", storedFiles)
    if (storedFiles) {
      try {
        const parsedFiles = JSON.parse(storedFiles)
        console.log("Parsed files:", parsedFiles.map((f: any) => ({
          name: f.name,
          id: f.id,
          dataLength: f.data?.length
        })))
        setUploadedFiles(parsedFiles)
      } catch (error) {
        console.error("Error parsing stored files:", error)
        localStorage.removeItem('uploadedFiles') // Clear invalid data
      }
    }
  }, [])

  useEffect(() => {
    const storedCourses = localStorage.getItem("courseOptions")
    if (storedCourses) {
      setCourseOptions(JSON.parse(storedCourses))
    }
  }, [])

  // Update question type counts when total number changes
  useEffect(() => {
    // Get current total
    const currentTotal = questionTypeCounts.reduce((sum, item) => sum + item.count, 0)

    if (currentTotal !== numberOfQuestions) {

      const diff = numberOfQuestions - currentTotal

      const newCounts = [...questionTypeCounts]

      if (diff > 0) {
        newCounts[0].count += diff
      } else if (diff < 0) {
        let remainingToRemove = Math.abs(diff)
        for (let i = 0; i < newCounts.length && remainingToRemove > 0; i++) {
          const toRemove = Math.min(newCounts[i].count, remainingToRemove)
          newCounts[i].count -= toRemove
          remainingToRemove -= toRemove
        }
      }

      setQuestionTypeCounts(newCounts)
    }
  }, [numberOfQuestions])
  //Test:Added by Aayesha who doesnt know React
  useEffect(() => {
  const storedQuizzes = localStorage.getItem("pastQuizzes")
  if (storedQuizzes) {
    try {
      setPastQuizzes(JSON.parse(storedQuizzes))
    } catch (error) {
      console.error("Error parsing stored quizzes:", error)
      localStorage.removeItem("pastQuizzes")
    }
  }
}, [])


  // Toggle material selection
  const toggleMaterial = (materialId: string) => {
    if (selectedMaterials.includes(materialId)) {
      setSelectedMaterials(selectedMaterials.filter((id) => id !== materialId))
    } else {
      setSelectedMaterials([...selectedMaterials, materialId])
    }
  }

  const updateQuestionTypeCount = (
    type: "multiple-choice" | "true-false" | "select-all-that-apply",
    change: number,
  ) => {
    const newCounts = [...questionTypeCounts]
    const typeIndex = newCounts.findIndex((item) => item.type === type)

    if (typeIndex !== -1) {
      const otherTypesTotal = newCounts.reduce((sum, item, idx) => (idx !== typeIndex ? sum + item.count : sum), 0)

      const newCount = Math.max(0, newCounts[typeIndex].count + change)
      const newTotal = otherTypesTotal + newCount

      if (newTotal <= numberOfQuestions) {
        newCounts[typeIndex].count = newCount
        setQuestionTypeCounts(newCounts)
      }
    }
  }

  const getTotalQuestionCount = () => {
    return questionTypeCounts.reduce((sum, item) => sum + item.count, 0)
  }

  const addNewCourse = () => {
    if (!newCourseCode || !newCourseName) return

    const newCourse: CourseOption = {
      id: newCourseCode.toLowerCase().replace(/\s+/g, ""),
      name: `${newCourseCode}: ${newCourseName}`,
    }

    const updatedCourses = [...courseOptions, newCourse]
    setCourseOptions(updatedCourses)

    setSelectedCourse(newCourse.id)

    setNewCourseCode("")
    setNewCourseName("")

    // Save to localStorage for persistence
    localStorage.setItem("courseOptions", JSON.stringify(updatedCourses))
  }

  const generateQuiz = async () => {
    console.log("Starting quiz generation...")
    
    // validate 
    if (selectedMaterials.length === 0) {
      alert("Please select at least one material")
      return
    }

    if (getTotalQuestionCount() === 0) {
      alert("Please add at least one question")
      return
    }

    // Get the selected file from uploadedFiles
    const selectedFile = uploadedFiles.find(file => selectedMaterials.includes(file.id))
    console.log("Selected file for quiz generation:", {
      file: selectedFile ? {
        name: selectedFile.name,
        id: selectedFile.id,
        dataLength: selectedFile.data?.length
      } : null,
      selectedMaterials
    })

    if (!selectedFile) {
      alert("Please select a file from the materials")
      return
    }

    if (!selectedFile.data) {
      console.error("File data is missing. File object:", {
        name: selectedFile.name,
        id: selectedFile.id,
        hasData: !!selectedFile.data
      })
      alert("File data is missing. Please upload the file again.")
      return
    }

    setIsGenerating(true)

    try {
      // Check if the data is already base64 (without data URL prefix)
      let base64Data = selectedFile.data
      if (selectedFile.data.startsWith('data:')) {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        base64Data = selectedFile.data.split(',')[1]
      }

      console.log("Preparing quiz generation request:", {
        courseId: selectedCourse,
        materials: selectedMaterials,
        questionCounts: questionTypeCounts.reduce((acc, item) => {
          acc[item.type] = item.count
          return acc
        }, {} as Record<string, number>),
        instructions: instructions,
        fileName: selectedFile.name,
        dataLength: base64Data.length
      })

      const response = await fetch("/api/generateQuiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          materials: selectedMaterials,
          questionCounts: questionTypeCounts.reduce((acc, item) => {
            acc[item.type] = item.count
            return acc
          }, {} as Record<string, number>),
          instructions: instructions,
          canvasCourseId: canvasCourseId,
          fileData: base64Data,
          fileName: selectedFile.name,
        }),
      })

      const data = await response.json()
      console.log("Quiz generation response:", data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz')
      }

      // Create new quiz object
      const newQuiz: Quiz = {
        id: data.quizId,
        courseId: data.courseId,
        materials: data.materials,
        questionCounts: data.questionCounts,
        instructions: data.instructions,
        createdAt: data.createdAt,
        textUrl: data.quizText, // Store the quiz text directly
        qtiUrl: data.qtiUrl,
        fileName: data.fileName
      }

      console.log("Created new quiz object:", {
        id: newQuiz.id,
        courseId: newQuiz.courseId,
        fileName: newQuiz.fileName,
        materials: newQuiz.materials
      })

      // Add to past quizzes
      setPastQuizzes([newQuiz, ...pastQuizzes])
      
      // Save to localStorage
      const storedQuizzes = JSON.parse(localStorage.getItem("pastQuizzes") || "[]")
      localStorage.setItem("pastQuizzes", JSON.stringify([newQuiz, ...storedQuizzes]))
      
      // Navigate to quiz view
      window.location.href = `/quiz-view?id=${data.quizId}`
    } catch (error) {
      console.error("Error generating quiz:", error)
      alert(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const navToAddFile = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#f3edf7] flex">
      {/* Sidebar */}
      <div className="w-[80px] bg-white flex flex-col items-center py-4">
        <button className="p-4 text-[#6750a4]">
          <Menu size={24} />
        </button>
        <button className="mt-4 w-12 h-12 bg-[#e8def8] rounded-full flex items-center justify-center text-[#6750a4]">
          <Plus size={24} onClick={navToAddFile}/>
        </button>

        <div className="mt-12 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1 text-[#49454f]">
            <div className="w-8 h-8 bg-[#e8def8] rounded-md flex items-center justify-center">
              <span className="text-xs">D</span>
            </div>
            <span className="text-xs">Dashboard</span>
          </div>

          <div className="flex flex-col items-center gap-1 text-[#6750a4]">
            <div className="w-8 h-8 bg-[#e8def8] rounded-md flex items-center justify-center">
              <span className="text-xs">Q</span>
            </div>
            <span className="text-xs">Quizzes</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Quiz Generator Card */}
          <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
            <h1 className="text-2xl font-semibold mb-6">Generate Quiz from Canvas</h1>

            {/* Course Selection */}
            <div className="mb-6">
              <label className="block text-[#1d1b20] font-medium mb-2">Select course</label>
              <div className="relative mb-2">
                <select
                  className="w-full p-3 border border-[#cac4d0] rounded-lg appearance-none pr-10 bg-white text-[#1d1b20]"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  {courseOptions.map((course) => (
                    <option key={`course-${course.id}`} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                  <option value="new">+ Add New Course</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#49454f]" size={20} />
              </div>
              {selectedCourse === "new" && (
                <div className="border border-[#cac4d0] rounded-lg p-4 bg-[#f3edf7]">
                  <h3 className="font-medium mb-3">Add New Course</h3>
                  <div className="mb-3">
                    <label className="block text-[#1d1b20] text-sm mb-1">Course Code</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[#cac4d0] rounded-lg bg-white text-[#1d1b20]"
                      placeholder="e.g., CS101"
                      value={newCourseCode}
                      onChange={(e) => setNewCourseCode(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-[#1d1b20] text-sm mb-1">Course Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-[#cac4d0] rounded-lg bg-white text-[#1d1b20]"
                      placeholder="e.g., Introduction to Computer Science"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-[#6750a4] text-white py-2 px-4 rounded-lg text-sm"
                      onClick={addNewCourse}
                      disabled={!newCourseCode || !newCourseName}
                    >
                      Add Course
                    </button>
                    <button
                      className="border border-[#cac4d0] py-2 px-4 rounded-lg text-sm"
                      onClick={() => setSelectedCourse(courseOptions[0].id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Materials Selection */}
            <div className="mb-6">
              <label className="block text-[#1d1b20] font-medium mb-2">Select materials</label>
              <div className="flex flex-wrap gap-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={`material-${file.id}`}
                    className={`border rounded-lg px-4 py-3 flex items-center gap-2 cursor-pointer transition-colors ${
                      selectedMaterials.includes(file.id) ? "border-[#6750a4] bg-[#f3edf7]" : "border-[#cac4d0]"
                    }`}
                    onClick={() => toggleMaterial(file.id)}
                  >
                    <FileText size={20} className="text-[#49454f]" />
                    <span className="text-[#1d1b20]">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div className="mb-6">
              <label className="block text-[#1d1b20] font-medium mb-2">Number of Questions</label>
              <div className="relative pt-1">
                <input
                  type="range"
                  className="w-full h-2 bg-[#e8def8] rounded-lg appearance-none cursor-pointer"
                  min="5"
                  max="50"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Number.parseInt(e.target.value))}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#49454f]">5</span>
                  <span className="text-xs text-[#49454f]">{numberOfQuestions}</span>
                  <span className="text-xs text-[#49454f]">500</span>
                </div>
              </div>
            </div>

            {/* Question Types */}
            <div className="mb-6">
              <label className="block text-[#1d1b20] font-medium mb-2">Question Types</label>
              <div className="space-y-3 border border-[#cac4d0] rounded-lg p-4">
                {questionTypes.map((type) => (
                  <div key={`question-type-${type.id}`} className="flex items-center justify-between">
                    <span className="text-[#1d1b20]">{type.name}</span>
                    <div className="flex items-center">
                      <button
                        className="w-8 h-8 flex items-center justify-center text-[#6750a4] border border-[#cac4d0] rounded-l-lg"
                        onClick={() => updateQuestionTypeCount(type.id as any, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <div className="w-12 h-8 flex items-center justify-center border-t border-b border-[#cac4d0]">
                        {questionTypeCounts.find((item) => item.type === type.id)?.count || 0}
                      </div>
                      <button
                        className="w-8 h-8 flex items-center justify-center text-[#6750a4] border border-[#cac4d0] rounded-r-lg"
                        onClick={() => updateQuestionTypeCount(type.id as any, 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-2 border-t border-[#cac4d0]">
                  <span className="font-medium text-[#1d1b20]">Total</span>
                  <span className="font-medium text-[#1d1b20]">
                    {getTotalQuestionCount()} / {numberOfQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <label className="block text-[#1d1b20] font-medium mb-2">Instructions</label>
              <textarea
                className="w-full p-3 border border-[#cac4d0] rounded-lg bg-white text-[#1d1b20] min-h-[100px] resize-none"
                placeholder="Add specific instructions for quiz generation (e.g., focus on chapters 1-3, include vocabulary questions, etc.)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

             {/* Course ID Field */}
            <div className="mb-6">
            <label className="block text-[#1d1b20] font-medium mb-2">
                Canvas Course ID
              </label>
              <input
                type="text"
                className="w-64 p-2 border border-[#cac4d0] rounded-lg bg-white text-[#1d1b20]"
                placeholder="e.g. 1999158"
              value={canvasCourseId}
              onChange={(e) => setCanvasCourseId(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <button
              className="w-full bg-[#6750a4] text-white py-3 rounded-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={generateQuiz}
              disabled={isGenerating || selectedMaterials.length === 0 || getTotalQuestionCount() === 0}
            >
              {isGenerating ? "Generating..." : "Generate Quiz Questions"}
            </button>
          </div>

          {/* Past Quizzes */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">Past Quizzes</h2>
            <p className="text-[#49454f] mb-6">View your previously generated quizzes.</p>

            {pastQuizzes.length > 0 ? (
              <div className="space-y-4">
                {pastQuizzes.map((quiz) => (
                  <div key={`quiz-${quiz.id}`} className="border border-[#cac4d0] rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-[#1d1b20]">
                          {courseOptions.find(course => course.id === quiz.courseId)?.name || quiz.courseId}
                        </h3>
                        <p className="text-[#49454f] text-sm">
                          Generated on{" "}
                          {new Date(quiz.createdAt).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <a 
                        href={`/quiz-view?id=${quiz.id}`}
                        className="border border-[#cac4d0] rounded-lg px-4 py-2 text-[#1d1b20] hover:bg-[#f3edf7] transition-colors"
                      >
                        View Quiz
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-[#cac4d0] rounded-lg">
                <p className="text-[#49454f]">No quizzes generated yet.</p>
                <p className="text-[#49454f] text-sm mt-1">Generate your first quiz using the form above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
