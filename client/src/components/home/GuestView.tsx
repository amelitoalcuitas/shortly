import UrlShortener from "../shortener/UrlShortener";

const GuestView = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* URL Shortener Card */}
        <UrlShortener className="mb-4" />

        <div className="text-gray-700 text-center text-sm">
          <p>
            <a href="/login" className="text-primary hover:text-primary-dark">
              Login
            </a>{" "}
            to track and create custom URLs
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestView;
