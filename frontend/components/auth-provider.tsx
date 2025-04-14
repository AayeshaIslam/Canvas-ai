"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

// Define user type
interface User {
  id: string
  name: string
  email: string
}

// Define auth context type
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would verify the session with the server
        const storedUser = localStorage.getItem("user")

        if (storedUser) {
          setUser(JSON.parse(storedUser))
        } else if (pathname !== "/login" && pathname !== "/") {
          // Redirect to login if not authenticated and not already on login page
          // For now, we'll allow access to the upload page (/) without authentication
          // router.push("/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)

      // In a real app, this would call an API endpoint
      // For demo purposes, we'll simulate a successful login
      const mockUser = {
        id: "user-1",
        name: "Demo User",
        email,
      }

      // Store user in localStorage (in a real app, you'd use secure HTTP-only cookies)
      localStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
