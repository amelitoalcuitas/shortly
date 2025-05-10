import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GuestView from "../components/home/GuestView";
import AuthenticatedView from "../components/home/AuthenticatedView";
import { useAuth } from "../hooks/useAuth";
import { SpinnerGap } from "@phosphor-icons/react";

function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <SpinnerGap
            className="animate-spin h-10 w-10 text-primary"
            weight="bold"
          />
        </div>
      ) : isAuthenticated ? (
        <AuthenticatedView />
      ) : (
        <GuestView />
      )}

      <Footer />
    </div>
  );
}

export default HomePage;
