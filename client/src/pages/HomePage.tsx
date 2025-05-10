import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { Copy, SpinnerGap, Warning } from "@phosphor-icons/react";
import { urlService } from "../services";

function HomePage() {
  const [url, setUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  // URL validation regex pattern
  // This pattern checks for a valid URL format with protocol (http/https)
  const urlRegex =
    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

  // Function to validate URL
  const isValidUrl = (url: string): boolean => {
    return urlRegex.test(url);
  };

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);

    // Clear error when input changes
    if (error) {
      setError("");
    }
  };

  // Function to handle URL shortening via API
  const handleShorten = async () => {
    if (!url.trim()) return;

    // Validate URL before proceeding
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    // Add protocol if missing
    let urlToShorten = url;
    if (!/^https?:\/\//i.test(urlToShorten)) {
      urlToShorten = `https://${urlToShorten}`;
    }

    setError("");
    setIsLoading(true);
    setShortenedUrl("");

    try {
      // Call the URL service to create a shortened URL
      const result = await urlService.createUrl({
        original_url: urlToShorten,
      });

      // Get the full shortened URL with domain
      const fullShortenedUrl = urlService.getFullShortenedUrl(
        result.short_code
      );
      setShortenedUrl(fullShortenedUrl);
    } catch (err: any) {
      console.error("Error shortening URL:", err);
      setError(
        err.response?.data?.error || "Failed to shorten URL. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to copy the shortened URL to clipboard
  const handleCopy = () => {
    if (!shortenedUrl) return;

    navigator.clipboard
      .writeText(shortenedUrl)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-xl w-full border border-gray-200">
          <h2 className="text-2xl font-semibold text-center mb-6 text-primary">
            let's make it shorter
          </h2>
          <div className="mb-4">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Paste it here
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/very/long/url/that/needs/shortening"
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />
            {error && (
              <p className="mt-1 text-red-500 text-sm flex items-center">
                <Warning className="h-4 w-4 mr-1" weight="bold" />
                {error}
              </p>
            )}
          </div>
          <button
            onClick={handleShorten}
            disabled={isLoading || !url.trim() || !isValidUrl(url)}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <SpinnerGap
                  className="animate-spin h-5 w-5 mr-2"
                  weight="bold"
                />
                <span>shortening...</span>
              </div>
            ) : (
              "shorten"
            )}
          </button>

          {/* Result section */}
          {shortenedUrl && !isLoading && (
            <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 text-sm font-medium text-gray-700">
                Your shortened URL
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="text-primary font-medium truncate mr-2">
                  {shortenedUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors text-sm font-medium"
                >
                  {isCopied ? (
                    <span className="text-green-600">Copied!</span>
                  ) : (
                    <span className="flex items-center">
                      <Copy className="h-4 w-4 mr-1" weight="bold" />
                      Copy
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-gray-700 text-center text-sm">
            <p>
              {" "}
              <a href="/login" className="text-primary hover:text-primary-dark">
                Login
              </a>{" "}
              to track and create custom links{" "}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default HomePage;
