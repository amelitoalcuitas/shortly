import { useState, useEffect, useCallback, useRef } from "react";
import {
  Copy,
  SpinnerGap,
  Link,
  Clock,
  Timer,
  Trash,
  ChartLine,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { urlService } from "../../services";
import { useAuth } from "../../hooks/useAuth";
import { ShortenedUrl, Pagination } from "../../types";
import UrlShortener from "../shortener/UrlShortener";
import UrlAnalyticsChart from "../analytics/UrlAnalyticsChart";

// Interface to extend ShortenedUrl with click count
interface ShortenedUrlWithClicks extends ShortenedUrl {
  clickCount?: number;
}

const AuthenticatedView = () => {
  const { user } = useAuth();
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [userUrls, setUserUrls] = useState<ShortenedUrlWithClicks[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [deletingUrlId, setDeletingUrlId] = useState<string | null>(null);
  const [expandedUrlId, setExpandedUrlId] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 0,
  });

  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (copiedUrlId) {
      const timer = setTimeout(() => {
        setCopiedUrlId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedUrlId]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const skipNextDebounceRef = useRef(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Fetch user's URLs and their click counts with pagination
  const fetchUserUrls = useCallback(
    async (page: number, search = debouncedSearchTerm) => {
      if (!user) return;

      setIsLoadingUrls(true);
      try {
        const result = await urlService.getUrlsWithClickCountsPaginated(
          user.id,
          page,
          pagination.pageSize, // okay to keep pageSize as it's not expected to change often
          search
        );

        setUserUrls(result.urls);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Error fetching user URLs:", error);
      } finally {
        setIsLoadingUrls(false);
      }
    },
    [user, pagination.pageSize, debouncedSearchTerm]
  );

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      // Skip this debounce-triggered fetch if clear button already did it
      if (skipNextDebounceRef.current) {
        skipNextDebounceRef.current = false;
        return;
      }

      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Trigger fetch only when debounced value updates
  useEffect(() => {
    if (user) {
      fetchUserUrls(1);
    }
  }, [debouncedSearchTerm, fetchUserUrls, user]);

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

  // Check if a URL is expired
  const isUrlExpired = (url: ShortenedUrl): boolean => {
    if (!url.expires_at) {
      return false; // No expiration date means it never expires
    }

    const expiryDate = new Date(url.expires_at);
    const now = new Date();

    return now > expiryDate;
  };

  // Format expiration date to relative time (e.g., "Expires in 2 days")
  const formatExpirationTime = (
    expiryDateString: string | null | undefined
  ): string => {
    if (!expiryDateString) {
      return "Never expires";
    }

    const expiryDate = new Date(expiryDateString);
    const now = new Date();

    // If already expired
    if (now > expiryDate) {
      return "Expired";
    }

    const diffInSeconds = Math.floor(
      (expiryDate.getTime() - now.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return `Expires in ${diffInSeconds} seconds`;
    } else if (diffInSeconds < 3600) {
      return `Expires in ${Math.floor(diffInSeconds / 60)} minutes`;
    } else if (diffInSeconds < 86400) {
      return `Expires in ${Math.floor(diffInSeconds / 3600)} hours`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Expires in ${days} ${days === 1 ? "day" : "days"}`;
    }
  };

  // Handle URL deletion with confirmation
  const handleDeleteUrl = async (urlId: string) => {
    if (deletingUrlId === urlId) {
      try {
        await urlService.deleteUrl(urlId);
        // Remove the deleted URL from the state
        setUserUrls(userUrls.filter((url) => url.id !== urlId));
        setDeletingUrlId(null);
      } catch (error) {
        console.error("Error deleting URL:", error);
        // Reset the deleting state
        setDeletingUrlId(null);
      }
    } else {
      // Set the URL as being deleted (confirmation state)
      setDeletingUrlId(urlId);

      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => {
        setDeletingUrlId((prevId) => (prevId === urlId ? null : prevId));
      }, 3000);
    }
  };

  // Toggle analytics section for a URL
  const toggleAnalytics = (urlId: string) => {
    setExpandedUrlId((prevId) => (prevId === urlId ? null : urlId));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchUserUrls(newPage);
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
          onUrlShortened={() => fetchUserUrls(1)}
          className="mb-6"
        />

        {/* User's URLs */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              your shortlies
            </h2>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlass className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2"
                placeholder="Search URLs..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => {
                    skipNextDebounceRef.current = true;
                    setSearchTerm("");
                    fetchUserUrls(1, "");
                  }}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {userUrls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link
                className="h-12 w-12 mx-auto mb-2 text-gray-400"
                weight="thin"
              />
              <p>You haven't created any shortened URLs yet</p>
            </div>
          ) : (
            <div className="relative space-y-4">
              {isLoadingUrls ? (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
                  <SpinnerGap
                    className="animate-spin h-8 w-8 text-primary"
                    weight="bold"
                  />
                </div>
              ) : null}

              {userUrls.map((urlItem) => (
                <div
                  key={urlItem.id}
                  className="border border-gray-200 rounded-md overflow-hidden"
                >
                  <div className="p-3 flex items-center justify-between bg-gray-50">
                    <div className="min-w-0 flex-grow overflow-hidden mr-2">
                      <a
                        href={urlService.getRedirectUrl(urlItem.short_code)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium truncate hover:underline block"
                        title={urlService.getFullShortenedUrl(
                          urlItem.short_code
                        )}
                      >
                        {urlService.getFullShortenedUrl(urlItem.short_code)}
                      </a>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleCopy(
                            urlService.getFullShortenedUrl(urlItem.short_code),
                            urlItem.id
                          )
                        }
                        className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors text-xs font-medium"
                      >
                        {copiedUrlId === urlItem.id ? (
                          <span className="text-green-600">Copied!</span>
                        ) : (
                          <span className="flex items-center">
                            <Copy className="h-3 w-3 mr-1" weight="bold" />
                            Copy
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUrl(urlItem.id)}
                        className={`flex-shrink-0 ${
                          deletingUrlId === urlItem.id
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        } px-2 py-1 rounded-md transition-colors text-xs font-medium`}
                        title="Delete URL"
                      >
                        {deletingUrlId === urlItem.id ? (
                          <span>Confirm</span>
                        ) : (
                          <span className="flex items-center">
                            <Trash className="h-3 w-3 mr-1" weight="bold" />
                            Delete
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <a
                      href={urlItem.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 truncate mb-1 hover:text-gray-800 hover:underline block w-full overflow-hidden"
                      title={urlItem.original_url}
                    >
                      {urlItem.original_url}
                    </a>

                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatRelativeTime(urlItem.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <span>
                            {Number(urlItem.clickCount || 0)} click
                            {Number(urlItem.clickCount) === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div
                          className={`flex items-center ${
                            urlItem.expires_at && isUrlExpired(urlItem)
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          <Timer className="h-3 w-3 mr-1" weight="bold" />
                          {formatExpirationTime(urlItem.expires_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAnalytics(urlItem.id)}
                        className="flex items-center text-gray-500 hover:text-primary transition-colors"
                        aria-expanded={expandedUrlId === urlItem.id}
                        aria-controls={`analytics-${urlItem.id}`}
                      >
                        <ChartLine className="h-3 w-3 mr-1" weight="bold" />
                        <span>Analytics</span>
                        {expandedUrlId === urlItem.id ? (
                          <CaretUp className="h-3 w-3 ml-1" weight="bold" />
                        ) : (
                          <CaretDown className="h-3 w-3 ml-1" weight="bold" />
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Collapsible analytics section */}
                  {expandedUrlId === urlItem.id && (
                    <div id={`analytics-${urlItem.id}`}>
                      <UrlAnalyticsChart
                        urlId={urlItem.id}
                        shortCode={urlItem.short_code}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`p-2 rounded-md ${
                      pagination.page === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Previous page"
                  >
                    <CaretLeft className="w-5 h-5" />
                  </button>

                  <div className="flex space-x-1">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current page
                        return (
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.page) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis between non-consecutive pages
                        const showEllipsisBefore =
                          index > 0 && array[index - 1] !== page - 1;

                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsisBefore && (
                              <span className="px-3 py-1 text-gray-500">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                                pagination.page === page
                                  ? "bg-primary text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`p-2 rounded-md ${
                      pagination.page === pagination.totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Next page"
                  >
                    <CaretRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show total count when there are URLs */}
          {!isLoadingUrls && userUrls.length > 0 && (
            <div className="text-sm text-gray-500 mt-4 text-center">
              Showing {userUrls.length} of {pagination.total} URLs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedView;
