import UrlShortener from "../shortener/UrlShortener";

const GuestView = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* URL Shortener Card */}
        <UrlShortener className="mb-4" />
      </div>
    </div>
  );
};

export default GuestView;
