import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received request body:', {
      courseId: body.courseId,
      materials: body.materials,
      questionCounts: body.questionCounts,
      fileName: body.fileName,
      hasFileData: !!body.fileData,
      fileDataLength: body.fileData?.length || 0
    })
    
    const response = await fetch('http://localhost:8080/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()
    console.log('Backend response status:', response.status)
    console.log('Backend response text:', responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Error parsing backend response:', e)
      return NextResponse.json({ 
        error: 'Invalid response from backend',
        details: responseText
      }, { status: 500 })
    }

    if (!response.ok) {
      console.error('Backend error:', data)
      return NextResponse.json({ 
        error: data.error || 'Failed to generate quiz',
        details: data
      }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in generateQuiz API route:', error)
    return NextResponse.json({ 
      error: 'Failed to generate quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 