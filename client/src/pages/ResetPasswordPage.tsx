import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { SpinnerGap, Warning, Check, ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { authService } from "../services";

const ResetPasswordPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Extract email and token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const emailParam = queryParams.get("email");
    const tokenParam = queryParams.get("token");

    if (emailParam) {
      setEmail(emailParam);
    }
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const validateForm = () => {
    // Check if required fields are filled
    if (!email || !token || !newPassword || !confirmPassword) {
      setError("Please fill in all required fields");
      return false;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.resetPassword(email, token, newPassword);
      setSuccess(true);
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to reset password. The link may be invalid or expired.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full border border-gray-200">
          <h2 className="text-2xl font-semibold text-center mb-6 text-primary">
            reset password
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-500 text-sm flex items-center">
              <Warning className="h-4 w-4 mr-2" weight="bold" />
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-100 rounded-md text-green-600 text-sm flex items-start">
                <Check className="h-4 w-4 mr-2 mt-0.5" weight="bold" />
                <div>
                  <p className="font-medium">Password reset successful!</p>
                  <p className="mt-1">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" weight="bold" />
                  Go to login
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6 text-sm">
                Enter your new password below to reset your account password.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    readOnly={!!email}
                  />
                </div>

                <div className="hidden">
                  <input
                    type="hidden"
                    id="token"
                    value={token}
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <SpinnerGap
                        className="animate-spin h-5 w-5 mr-2"
                        weight="bold"
                      />
                      <span>Resetting password...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <a
                  href="/login"
                  className="text-primary hover:text-primary-dark font-medium flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" weight="bold" />
                  Back to login
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
