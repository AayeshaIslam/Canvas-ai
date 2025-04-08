"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(email, password)
    } catch (err) {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="min-h-screen bg-[#f3edf7] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-2">Sign In</h1>
        <p className="text-[#49454f] mb-6">Sign in to your Canvas AI account</p>

        {error && <div className="bg-[#f9dedc] text-[#b3261e] p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#1d1b20] font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-3 border border-[#cac4d0] rounded-lg bg-white text-[#1d1b20]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#1d1b20] font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-3 border border-[#cac4d0] rounded-lg bg-white text-[#1d1b20]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#6750a4] text-white py-3 rounded-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="mt-4 text-center">
            <p className="text-[#49454f]">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#6750a4] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
