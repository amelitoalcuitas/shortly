import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { SpinnerGap, Warning, Check, ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { authService } from "../services";

const ForgotPasswordPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    // Check if email is provided
    if (!email) {
      setError("Please enter your email address");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
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
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      // We don't want to reveal if an email exists or not for security reasons
      // So we show a success message even if the email doesn't exist
      setSuccess(true);
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
            forgot password
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
                  <p className="font-medium">Password reset email sent!</p>
                  <p className="mt-1">
                    If an account exists with the email {email}, you will receive
                    password reset instructions.
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" weight="bold" />
                  Back to login
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6 text-sm">
                Enter your email address and we'll send you instructions to reset your password.
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
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send reset instructions"
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

export default ForgotPasswordPage;
