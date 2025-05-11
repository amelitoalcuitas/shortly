import { useState, useEffect, useCallback } from "react";
import { Copy, SpinnerGap, Link, Clock } from "@phosphor-icons/react";
import { urlService } from "../../services";
import { useAuth } from "../../hooks/useAuth";
import { ShortenedUrl } from "../../types";
import UrlShortener from "../shortener/UrlShortener";

// Interface to extend ShortenedUrl with click count
interface ShortenedUrlWithClicks extends ShortenedUrl {
  clickCount?: number;
}

const AuthenticatedView = () => {
  const { user } = useAuth();
  const [isCopied, setIsCopied] = useState(false);
  const [userUrls, setUserUrls] = useState<ShortenedUrlWithClicks[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Fetch user's URLs and their click counts
  const fetchUserUrls = useCallback(async () => {
    if (!user) return;

    setIsLoadingUrls(true);
    try {
      // Use the service method that fetches URLs with click counts
      const urlsWithClicks = await urlService.getUrlsWithClickCounts(user.id);
      setUserUrls(urlsWithClicks);
    } catch (error) {
      console.error("Error fetching user URLs:", error);
    } finally {
      setIsLoadingUrls(false);
    }
  }, [user]);

  // Load user's URLs on component mount
  useEffect(() => {
    if (user) {
      fetchUserUrls();
    }
  }, [user, fetchUserUrls]);

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

  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      const formattedDate = date.toLocaleDateString("en-US", options);
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
      });
      const formattedDateTime = `${formattedDate} at ${formattedTime}`;

      return formattedDateTime;
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center p-4">
      <div className="max-w-4xl w-full">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-gray-600">Create and manage your shortened URLs</p>
        </div>

        {/* URL Shortener Card */}
        <UrlShortener
          userId={user?.id}
          customCodeEnabled={true}
          onUrlShortened={fetchUserUrls}
          className="mb-6"
        />

        {/* User's URLs */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Your shortlies
          </h2>

          {isLoadingUrls ? (
            <div className="flex justify-center py-8">
              <SpinnerGap
                className="animate-spin h-8 w-8 text-primary"
                weight="bold"
              />
            </div>
          ) : userUrls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link
                className="h-12 w-12 mx-auto mb-2 text-gray-400"
                weight="thin"
              />
              <p>You haven't created any shortened URLs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userUrls.map((urlItem) => (
                <div
                  key={urlItem.id}
                  className="border border-gray-200 rounded-md overflow-hidden"
                >
                  <div className="p-3 flex items-center justify-between bg-gray-50">
                    <div className="text-primary font-medium truncate mr-2">
                      {urlService.getFullShortenedUrl(urlItem.short_code)}
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          urlService.getFullShortenedUrl(urlItem.short_code)
                        )
                      }
                      className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors text-xs font-medium"
                    >
                      <span className="flex items-center">
                        <Copy className="h-3 w-3 mr-1" weight="bold" />
                        Copy
                      </span>
                    </button>
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <div className="text-sm text-gray-600 truncate mb-1">
                      {urlItem.original_url}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRelativeTime(urlItem.createdAt)}
                      <span className="mx-2">•</span>
                      <span>{urlItem.clickCount || 0} clicks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedView;
