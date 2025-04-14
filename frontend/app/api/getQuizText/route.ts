import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const quizId = searchParams.get('id')

  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`http://localhost:8080/get-quiz-text?id=${quizId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch quiz text')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching quiz text:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz text' }, { status: 500 })
  }
} 