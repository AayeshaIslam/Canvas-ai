"use client"

import type React from "react"

import { useState } from "react"
import { ArrowRight, FileText, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  // Handle upload and navigation to dashboard
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    // Simulate file upload
    // In a real app, you would upload files to a server here
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Store files in localStorage for demo purposes
    // In a real app, you would store file references in a database
    const fileData = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      // We can't store the actual file in localStorage, just metadata
    }))

    localStorage.setItem("uploadedFiles", JSON.stringify(fileData))

    setUploading(false)

    // Navigate to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#f3edf7] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 shadow-sm max-w-3xl w-full">
        <h1 className="text-2xl font-semibold mb-2">Canvas AI Quiz Generator</h1>
        <p className="text-[#49454f] mb-6">Upload your course materials to generate quizzes.</p>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center ${
            dragActive ? "border-[#6750a4] bg-[#f3edf7]" : "border-[#cac4d0]"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-12 w-12 text-[#6750a4] mb-4" />
            <h3 className="text-lg font-medium mb-2">Drag and drop your files here</h3>
            <p className="text-[#49454f] mb-4">or</p>
            <label className="bg-[#6750a4] text-white py-2 px-4 rounded-lg cursor-pointer hover:bg-[#7b68b4] transition-colors">
              Browse Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              />
            </label>
            <p className="text-[#49454f] text-sm mt-4">Supported formats: PDF, Word, PowerPoint, Text</p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Selected Files ({files.length})</h3>
            <div className="border border-[#cac4d0] rounded-lg divide-y">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-[#49454f] mr-2" />
                    <div>
                      <p className="text-[#1d1b20] font-medium">{file.name}</p>
                      <p className="text-[#49454f] text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    className="text-[#b3261e] hover:text-[#f2b8b5] transition-colors"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          className="w-full bg-[#6750a4] text-white py-3 rounded-lg font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              Continue to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
