import { useState, useEffect } from "react"
import { Copy, SpinnerGap, Warning, X } from "@phosphor-icons/react"
import { urlService } from "../../services"
import { AxiosError } from "axios"
import { isValidUrl, normalizeUrl, isSameAsHost } from "../../utils/validation"

interface UrlShortenerProps {
  userId?: string
  customCodeEnabled?: boolean
  onUrlShortened?: (shortCode: string) => void
  className?: string
  title?: string
}

const UrlShortener = ({
  userId,
  customCodeEnabled = false,
  onUrlShortened,
  className = "",
  title = "let's make it shorter",
}: UrlShortenerProps) => {
  const [url, setUrl] = useState("")
  const [customCode, setCustomCode] = useState("")
  const [shortenedUrl, setShortenedUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState("")
  // Default to 7 days for non-logged-in users
  const [expirationDays, setExpirationDays] = useState<number | "">(
    userId ? "" : 7
  )

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value
    setUrl(inputUrl)

    // Clear error when input changes
    if (error) {
      setError("")
    }
  }

  // Custom code validation regex - only allows alphanumeric characters
  const CUSTOM_CODE_REGEX = /^[a-zA-Z0-9]*$/

  // Validate custom code
  const isValidCustomCode = (code: string): boolean => {
    // Check if code matches regex and has at least 3 characters
    return CUSTOM_CODE_REGEX.test(code) && code.length >= 3
  }

  // Handle custom code input change
  const handleCustomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputCode = e.target.value

    // Validate the custom code as it's being typed
    if (inputCode && !isValidCustomCode(inputCode)) {
      if (!CUSTOM_CODE_REGEX.test(inputCode)) {
        setError("Custom code can only contain letters and numbers.")
      } else {
        setError("Custom code must be at least 3 characters long.")
      }
    } else {
      // Clear error when input is valid or empty
      if (error) {
        setError("")
      }
    }

    setCustomCode(inputCode)
  }

  // Handle expiration days input change
  const handleExpirationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setExpirationDays(value === "" ? "" : parseInt(value, 10))

    // Clear error when input changes
    if (error) {
      setError("")
    }
  }

  // Function to handle URL shortening via API
  const handleShorten = async () => {
    if (!url.trim()) return

    // Validate URL before proceeding
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL")
      return
    }

    // Add protocol if missing using the normalizeUrl utility function
    const urlToShorten = normalizeUrl(url)

    // Check if the URL is the same as the host URL
    const hostUrl = urlService.getBaseUrl()
    if (isSameAsHost(urlToShorten, hostUrl)) {
      setError("You cannot shorten the URL of this site.")
      return
    }

    // Validate custom code if provided
    if (customCodeEnabled && customCode && !isValidCustomCode(customCode)) {
      if (!CUSTOM_CODE_REGEX.test(customCode)) {
        setError("Custom code can only contain letters and numbers")
      } else {
        setError("Custom code must be at least 3 characters long")
      }
      return
    }

    setError("")
    setIsLoading(true)
    setShortenedUrl("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate loading

      // Call the URL service to create a shortened URL
      const result = await urlService.createUrl({
        original_url: urlToShorten,
        user_id: userId,
        custom_code: customCodeEnabled && customCode ? customCode : undefined,
        // Always send expiration days for non-logged-in users (default 7)
        expires_in_days: userId
          ? typeof expirationDays === "number"
            ? expirationDays
            : undefined
          : 7,
      })

      // Get the full shortened URL with domain
      const fullShortenedUrl = urlService.getFullShortenedUrl(result.short_code)
      setShortenedUrl(fullShortenedUrl)

      // Notify parent component if callback is provided
      if (onUrlShortened) {
        onUrlShortened(result.short_code)
      }
    } catch (err: unknown) {
      console.error("Error shortening URL:", err)

      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.error ||
            "Failed to shorten URL. Please try again."
        )
        return
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Function to clear the URL input and shortened URL
  const handleClear = () => {
    setUrl("")
    setCustomCode("")
    setShortenedUrl("")
    setError("")
    // Reset expiration to default value based on login status
    setExpirationDays(userId ? "" : 7)
  }

  // Function to copy the shortened URL to clipboard
  const handleCopy = (urlToCopy: string) => {
    if (!urlToCopy) return

    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setIsCopied(true)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

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
          Paste it here
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
              placeholder="e.g., myLink, shortURL123"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Leave empty to generate a random code. Only letters and numbers are
            allowed. Custom codes must be at least 3 characters long.
          </p>
        </div>
      )}

      <div className="mb-4">
        {userId ? (
          <>
            <label
              htmlFor="expiration"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Link expiration (optional)
            </label>
            <div className="relative">
              <select
                id="expiration"
                value={expirationDays === "" ? "" : expirationDays.toString()}
                onChange={handleExpirationChange}
                className="w-full p-3 pr-10 appearance-none bg-transparent border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Never expires</option>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Select how long this link should be active. After expiration, the
              link will no longer work.
            </p>
          </>
        ) : (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <p className="text-sm text-gray-700 flex items-center">
              <span className="mr-1">⏱️</span>
              <span className="text-primary font-medium">
                Guest links expire in 7 days.
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Create an account to customize expiration or create permanent
              links.
            </p>
          </div>
        )}
      </div>

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
          (url.trim() &&
            isSameAsHost(normalizeUrl(url), urlService.getBaseUrl())) ||
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
            <a
              href={shortenedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium truncate mr-2 hover:underline"
            >
              {shortenedUrl}
            </a>
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
          {/* Always show expiration for non-logged in users or when expiration is set */}
          {(!userId || expirationDays) && (
            <div className="px-3 pb-3 text-xs text-gray-500 flex items-center">
              <span className="flex items-center">
                <span className="mr-1">⏱️</span>
                Expires in{" "}
                {expirationDays === 1 ? "1 day" : `${expirationDays || 7} days`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UrlShortener
