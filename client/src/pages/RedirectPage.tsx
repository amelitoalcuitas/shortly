import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { SpinnerGap, Warning } from "@phosphor-icons/react";

/**
 * RedirectPage component
 * Handles redirecting users to the original URL when they visit a shortened URL
 * Supports passing UTM parameters and other query parameters from the current URL to the target URL
 *
 * Example usage with UTM parameters:
 * /{short-code}?utm_source=newsletter&utm_medium=email&utm_campaign=summer_sale
 *
 * These parameters will be appended to the original URL when redirecting
 */
const RedirectPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!code) {
        setError("Invalid URL");
        setIsLoading(false);
        return;
      }

      // Get the current query parameters
      const queryParams = new URLSearchParams(location.search);

      // Extract UTM parameters and other query parameters
      const utmParams = new URLSearchParams();
      queryParams.forEach((value, key) => {
        // Add all parameters to be passed to the backend
        utmParams.append(key, value);
      });

      // Create the redirect URL with query parameters
      const redirectUrl = `${import.meta.env.VITE_API_URL}/${code}${
        utmParams.toString() ? `?${utmParams.toString()}` : ""
      }`;

      // Redirect directly to the backend which will:
      // 1. Check if the URL exists
      // 2. Increment the click count if it does
      // 3. Redirect to the original URL with UTM parameters
      // 4. Show an error if the URL doesn't exist
      window.location.href = redirectUrl;

      // Note: We don't need to handle errors here since the backend will handle them
      // and show an appropriate error page if the URL doesn't exist
    };

    fetchAndRedirect();
  }, [code, location.search, navigate]);

  // If there's an error, show an error page
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full">
          <h1 className="text-2xl font-bold text-primary mb-4">
            URL Not Found
          </h1>
          <div className="flex items-start mb-6">
            <Warning
              className="text-red-500 h-5 w-5 mt-0.5 mr-2"
              weight="bold"
            />
            <p className="text-gray-700">{error}</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while redirecting
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <SpinnerGap
            className="animate-spin h-10 w-10 text-primary mx-auto mb-4"
            weight="bold"
          />
          <h1 className="text-xl font-medium text-gray-700 mb-2">
            Redirecting...
          </h1>
          <p className="text-gray-500">
            You are being redirected to the original URL.
          </p>
        </div>
      </div>
    );
  }

  // This should never be shown, but just in case
  return null;
};

export default RedirectPage;
