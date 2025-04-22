"use client"

import type React from "react"

import { useState } from "react"
import { ArrowRight, FileText, Upload, Menu, Plus} from "lucide-react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  //const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("Selected file:", {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      // Read the file as base64
      const fileReader = new FileReader()
      fileReader.onload = () => {
        const base64Data = fileReader.result as string
        console.log("Base64 data generated, length:", base64Data.length)
        
        // Save file data to localStorage
        const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
        console.log("Current stored files:", storedFiles)
        
        const newFile = {
          name: file.name,
          data: base64Data,
          id: `file-${storedFiles.length}`,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
        
        console.log("New file to store:", {
          name: newFile.name,
          id: newFile.id,
          size: newFile.size,
          type: newFile.type
        })
        
        storedFiles.push(newFile)
        localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles))
        
        // Verify the stored data
        const verifyStored = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
        console.log("Verified stored files:", verifyStored.map((f: any) => ({
          name: f.name,
          id: f.id,
          dataLength: f.data?.length
        })))
        
        // Navigate to dashboard
        window.location.href = '/dashboard'
      }
      
      fileReader.onerror = (error) => {
        console.error("Error reading file:", error)
      }
      
      fileReader.readAsDataURL(file)
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

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      const file = e.dataTransfer.files[0]
      if (file) {
        // Create a new FileList object
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        // Create a new input event
        const event = {
          target: {
            files: dataTransfer.files
          }
        } as React.ChangeEvent<HTMLInputElement>
        
        handleFileSelect(event)
      }
    }
  }

  const navToDashboard = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#f3edf7] flex">

      {/* Sidebar */}
      <div className="w-[80px] bg-white flex flex-col items-center py-4">
        <button className="p-4 text-[#6750a4]">
          <Menu size={24} />
        </button>
        <button className="mt-4 w-12 h-12 bg-[#e8def8] rounded-full flex items-center justify-center text-[#6750a4]">
          <Plus size={24} />
        </button>

        <div className="mt-12 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1 text-[#49454f]">
          <button onClick={navToDashboard}>
            <div className="w-8 h-8 bg-[#e8def8] rounded-md flex items-center justify-center">
              <span className="text-xs">D</span>
            </div>
          </button>
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
      
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm max-w-3xl w-full flex-col items-center justify-center p-6">
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
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf"
                  />
                </label>
                <p className="text-[#49454f] text-sm mt-4">Supported formats: PDF</p>
              </div>
            </div>

            {/* Remove the file list and upload button since we're handling uploads immediately */}
            {/* File List */}
            {/* Upload Button */}
          </div>
        </div>
      </div>
    </div>
  )
}
