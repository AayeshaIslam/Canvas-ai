export interface Quiz {
  id: string
  title: string
  courseId: string
  courseName: string
  materials: string[]
  numberOfQuestions: number
  questionTypes: QuestionTypeCount[]
  instructions: string
  createdAt: string
  questions?: QuizQuestion[]
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
  type: "multiple-choice" | "true-false" | "free-response" | "fill-in-multiple-blanks"
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
