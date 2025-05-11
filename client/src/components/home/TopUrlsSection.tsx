import { useState, useEffect } from "react";
import { SpinnerGap, Trophy, Copy, Link } from "@phosphor-icons/react";
import { urlService } from "../../services";
import { ShortenedUrl } from "../../types";

// Interface to extend ShortenedUrl with click count
interface ShortenedUrlWithClicks extends ShortenedUrl {
  clickCount?: number;
}

interface TopUrlsSectionProps {
  userId?: string;
  limit?: number;
  className?: string;
  refreshTrigger?: number; // A number that changes to trigger a refresh
}

const TopUrlsSection = ({
  userId,
  limit = 5,
  className = "",
  refreshTrigger = 0,
}: TopUrlsSectionProps) => {
  const [topUrls, setTopUrls] = useState<ShortenedUrlWithClicks[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Fetch top URLs
  useEffect(() => {
    const fetchTopUrls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const urls = await urlService.getTopUrls(limit, userId);
        setTopUrls(urls);
      } catch (err) {
        console.error("Error fetching top URLs:", err);
        setError("Failed to load top URLs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopUrls();
  }, [limit, userId, refreshTrigger]); // Add refreshTrigger to dependencies

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (copiedUrlId) {
      const timer = setTimeout(() => {
        setCopiedUrlId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedUrlId]);

  // Function to copy the shortened URL to clipboard
  const handleCopy = (urlToCopy: string, urlId: string) => {
    if (!urlToCopy) return;

    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setCopiedUrlId(urlId);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}
    >
      <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
        <Trophy className="text-yellow-500 mr-1.5 w-4 h-4" weight="fill" />
        Top {limit} shortlies
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <SpinnerGap
            className="animate-spin h-6 w-6 text-primary"
            weight="bold"
          />
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500 text-sm">{error}</div>
      ) : topUrls.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          <Link className="h-8 w-8 mx-auto mb-1 text-gray-400" weight="thin" />
          <p>No URLs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topUrls.map((url, index) => (
            <div
              key={url.id}
              className="border border-gray-200 rounded-md overflow-hidden text-sm"
            >
              <div className="p-2 flex items-center justify-between bg-gray-50">
                <div className="flex items-center flex-grow min-w-0">
                  <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center mr-1.5 text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-grow overflow-hidden">
                    <a
                      href={urlService.getRedirectUrl(url.short_code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium truncate hover:underline block"
                      title={urlService.getFullShortenedUrl(url.short_code)}
                    >
                      {url.short_code}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      urlService.getFullShortenedUrl(url.short_code),
                      url.id
                    )
                  }
                  className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-md transition-colors text-xs font-medium ml-1"
                >
                  {copiedUrlId === url.id ? (
                    <span className="text-green-600">Copied</span>
                  ) : (
                    <span className="flex items-center">
                      <Copy className="h-3 w-3 mr-0.5" weight="bold" />
                      Copy
                    </span>
                  )}
                </button>
              </div>
              <div className="p-2 border-t border-gray-100">
                <div className="max-w-full overflow-hidden">
                  <a
                    href={url.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 truncate hover:text-gray-800 hover:underline block mb-1"
                    title={url.original_url}
                  >
                    {url.original_url.length > 40
                      ? `${url.original_url.substring(0, 40)}...`
                      : url.original_url}
                  </a>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="font-medium text-primary">
                    {formatNumber(Number(url.clickCount || 0))} click
                    {Number(url.clickCount) === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopUrlsSection;
