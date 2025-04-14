export interface Quiz {
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

export interface QuizQuestion {
  id: string
  text: string
  type: "multiple-choice" | "true-false" | "free-response" | "fill-in-multiple-blanks"
  options?: string[]
  correctAnswer?: string | string[]
  blanks?: string[]
}

export interface QuestionTypeCount {
  type: "multiple-choice" | "true-false" | "fill-in-multiple-blanks" | "free-response"
  count: number
}

export interface CourseOption {
  id: string
  name: string
}

export interface MaterialOption {
  id: string
  name: string
  icon: string
}
