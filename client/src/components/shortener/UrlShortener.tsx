import { useState, useEffect } from "react";
import { Copy, SpinnerGap, Warning, X } from "@phosphor-icons/react";
import { urlService } from "../../services";
import { AxiosError } from "axios";
import { isValidUrl, normalizeUrl } from "../../utils/validation";

interface UrlShortenerProps {
  userId?: string;
  customCodeEnabled?: boolean;
  onUrlShortened?: (shortCode: string) => void;
  className?: string;
  title?: string;
}

const UrlShortener = ({
  userId,
  customCodeEnabled = false,
  onUrlShortened,
  className = "",
  title = "Create a new short URL",
}: UrlShortenerProps) => {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

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

  // Custom code validation regex - only allows alphanumeric characters
  const CUSTOM_CODE_REGEX = /^[a-zA-Z0-9]*$/;

  // Validate custom code
  const isValidCustomCode = (code: string): boolean => {
    return CUSTOM_CODE_REGEX.test(code);
  };

  // Handle custom code input change
  const handleCustomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputCode = e.target.value;

    // Validate the custom code as it's being typed
    if (inputCode && !isValidCustomCode(inputCode)) {
      setError("Custom code can only contain letters and numbers.");
    } else {
      // Clear error when input is valid or empty
      if (error) {
        setError("");
      }
    }

    setCustomCode(inputCode);
  };

  // Function to handle URL shortening via API
  const handleShorten = async () => {
    if (!url.trim()) return;

    // Validate URL before proceeding
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    // Validate custom code if provided
    if (customCodeEnabled && customCode && !isValidCustomCode(customCode)) {
      setError("Custom code can only contain letters and numbers");
      return;
    }

    // Add protocol if missing using the normalizeUrl utility function
    const urlToShorten = normalizeUrl(url);

    setError("");
    setIsLoading(true);
    setShortenedUrl("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading

      // Call the URL service to create a shortened URL
      const result = await urlService.createUrl({
        original_url: urlToShorten,
        user_id: userId,
        custom_code: customCodeEnabled && customCode ? customCode : undefined,
      });

      // Get the full shortened URL with domain
      const fullShortenedUrl = urlService.getFullShortenedUrl(
        result.short_code
      );
      setShortenedUrl(fullShortenedUrl);

      // Notify parent component if callback is provided
      if (onUrlShortened) {
        onUrlShortened(result.short_code);
      }
    } catch (err: unknown) {
      console.error("Error shortening URL:", err);

      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.error ||
            "Failed to shorten URL. Please try again."
        );
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear the URL input and shortened URL
  const handleClear = () => {
    setUrl("");
    setCustomCode("");
    setShortenedUrl("");
    setError("");
  };

  // Function to copy the shortened URL to clipboard
  const handleCopy = (urlToCopy: string) => {
    if (!urlToCopy) return;

    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <div
      className={`bg-white rounded-lg p-6 border border-gray-200 ${className}`}
    >
      <h2 className="text-xl font-semibold mb-4 text-primary">{title}</h2>

      <div className="mb-4">
        <label
          htmlFor="url"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          URL to shorten
        </label>
        <div className="relative">
          <input
            type="text"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com/very/long/url/that/needs/shortening"
            className={`w-full p-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          {url && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear input"
            >
              <X className="h-5 w-5" weight="bold" />
            </button>
          )}
        </div>
      </div>

      {customCodeEnabled && (
        <div className="mb-4">
          <label
            htmlFor="customCode"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Custom code (optional)
          </label>

          <div className="flex items-center">
            <div className="text-primary font-medium text-xl mr-2">
              {urlService.getBaseUrl()}/
            </div>
            <input
              type="text"
              id="customCode"
              value={customCode}
              onChange={handleCustomCodeChange}
              placeholder="e.g., myLink, thisLink2025"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Leave empty to generate a random code. Only letters and numbers are
            allowed.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 text-red-500 text-sm flex items-center">
          <Warning className="h-4 w-4 mr-1" weight="bold" />
          {error}
        </p>
      )}

      <button
        onClick={handleShorten}
        disabled={
          isLoading ||
          !url.trim() ||
          !isValidUrl(url) ||
          !!(customCodeEnabled && customCode && !isValidCustomCode(customCode))
        }
        className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <SpinnerGap className="animate-spin h-5 w-5 mr-2" weight="bold" />
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
              onClick={() => handleCopy(shortenedUrl)}
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
    </div>
  );
};

export default UrlShortener;
