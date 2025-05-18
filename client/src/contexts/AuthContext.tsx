import { useState, ReactNode, useEffect } from "react"
import { AuthContext, User } from "./authContext"
import { authService } from "../services"

// AuthProvider props type
interface AuthProviderProps {
  children: ReactNode
}

// Create the AuthProvider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing user session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Try to get the current user from the server using the HttpOnly cookie
        const storedUser = localStorage.getItem("shortly_user")

        if (storedUser) {
          // Set the user from localStorage
          setUser(JSON.parse(storedUser))

          // In a production app, we would validate the session with the server
          // by making a request to an endpoint like /auth/me
          try {
            // This would verify if the cookie is still valid
            // const response = await authService.getCurrentUser();
            // setUser(response.user);
          } catch (err: unknown) {
            // If the API call fails, the cookie is likely invalid
            // Clear user data and reset state
            localStorage.removeItem("shortly_user")
            setUser(null)
            console.error("Error validating user session:", err)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error checking user session:", error)
        // Clear potentially corrupted data
        localStorage.removeItem("shortly_user")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUserSession()
  }, [])

  // Login function - calls the API to authenticate the user
  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Call the auth service to login
      // The token will be set as an HttpOnly cookie by the server
      const response = await authService.login(email, password)

      // Extract user data from response
      const { user: userData } = response

      // Save user to localStorage (non-sensitive data only)
      localStorage.setItem("shortly_user", JSON.stringify(userData))

      // Update user state
      setUser(userData)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Signup function - calls the API to register a new user
  const signup = async (email: string, password: string, name?: string) => {
    setLoading(true)
    try {
      // Call the auth service to register a new user
      await authService.signup(email, password, name)

      // We don't log the user in automatically after signup
      // They will need to login with their credentials
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Call the auth service to logout (clear the cookie on the server)
      await authService.logout()

      // Clear user data from localStorage
      localStorage.removeItem("shortly_user")

      // Update user state
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      // Even if the server call fails, we still want to clear the local state
      localStorage.removeItem("shortly_user")
      setUser(null)
    }
  }

  // Create the context value
  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
