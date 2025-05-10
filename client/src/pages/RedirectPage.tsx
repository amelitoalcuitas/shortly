import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { urlService } from "../services";
import { SpinnerGap, Warning } from "@phosphor-icons/react";

/**
 * RedirectPage component
 * Handles redirecting users to the original URL when they visit a shortened URL
 */
const RedirectPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!code) {
        setError("Invalid URL");
        setIsLoading(false);
        return;
      }

      try {
        // First, get the URL data from the API
        const urlData = await urlService.getUrlByCode(code);

        // Increment the click count via a separate API call (fire and forget)
        fetch(`${import.meta.env.VITE_API_URL}/api/urls/increment/${code}`, {
          method: "POST",
        }).catch((err) => {
          console.error("Error incrementing click count:", err);
          // Don't block the redirect if this fails
        });

        // Then redirect to the original URL
        window.location.href = urlData.original_url;
      } catch (err) {
        console.error("Error redirecting:", err);
        setError(
          "The shortened URL you're looking for doesn't exist or has been removed."
        );
        setIsLoading(false);
      }
    };

    fetchAndRedirect();
  }, [code, navigate]);

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
};

export default RedirectPage;
