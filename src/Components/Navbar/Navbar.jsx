import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import { Menu, X } from "lucide-react";
import { auth } from "../../FirebaseConfig/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

const Navbar = () => {
  const [cookies, removeCookie] = useCookies(["user"]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!cookies.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(!!cookies.user);
  }, [cookies]);

  const handleLogout = async () => {
    try {
      // 1. Sign out from Firebase first
      await signOut(auth);
      console.log("Firebase signout successful");

      // 2. Clear cookies - enhanced version
      const domain = "frontend-react-4whe.vercel.app";
      const cookieNames = ["user"]; // Only the cookie you're actually using

      // More reliable cookie clearing with all possible attributes
      cookieNames.forEach((name) => {
        document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`; // Fallback
      });

      // 3. Enhanced Google signout handling
      if (window.google?.accounts?.id) {
        try {
          // First disable auto-select
          window.google.accounts.id.disableAutoSelect();

          // Then revoke the token if we have a user
          if (auth.currentUser?.email) {
            window.google.accounts.id.revoke(auth.currentUser.email, (done) => {
              console.log("Google token revoked");
              // Force reset of Google One Tap
              window.google.accounts.id.prompt();
            });
          }
        } catch (googleError) {
          console.error("Google signout error:", googleError);
        }
      }

      // 4. Clear all client-side storage
      localStorage.clear();
      sessionStorage.clear();

      // 5. Show success message before redirect
      toast.success("Logged out successfully");

      // 6. Redirect to auth page and force full reload
      setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed: " + error.message);
    }
  };
  return (
    <nav className="bg-transparent p-4 fixed w-full top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <svg
            width="40"
            height="40"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect
              x="10"
              y="10"
              width="180"
              height="180"
              rx="20"
              fill="#4A90E2"
            />
            <path
              d="M100 130V70M80 90l20-20 20 20"
              stroke="#fff"
              strokeWidth="10"
            />
          </svg>
          <span className="text-white font-bold text-lg">SwiftUpload</span>
        </Link>

        {/* Hamburger Menu Button (Mobile) */}
        <button
          className="lg:hidden text-white"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Nav Links */}
        <div
          className={`absolute lg:static top-16 left-0 w-full lg:bg-transparent lg:flex lg:justify-end lg:w-full items-center lg:space-x-4 transition-all duration-300 ${
            isMenuOpen
              ? "flex flex-col items-center space-y-4 p-4 bg-white/10 backdrop-blur-lg border border-white/10 rounded-lg"
              : "hidden"
          }`}
        >
          {isLoggedIn ? (
            <div className="flex flex-col items-center w-full lg:w-auto lg:flex-row lg:items-stretch">
              <Link
                to="/dashboard"
                className="bg-white text-blue-500 px-3 py-1 sm:px-3 sm:py-1 md:px-3 md:py-1 lg:px-4 lg:py-2 rounded-lg shadow hover:bg-gray-200 text-center flex justify-center items-center w-3/5 sm:w-2/5 md:w-2/5 lg:w-auto text-sm md:text-sm lg:text-base mb-2 lg:mb-0 lg:mr-2"
              >
                DashBoard
              </Link>

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="bg-white text-pink-500 px-3 py-1 sm:px-3 sm:py-1 md:px-3 md:py-1 lg:px-4 lg:py-2 rounded-lg shadow hover:bg-gray-200 text-center flex justify-center items-center w-3/5 sm:w-2/5 md:w-2/5 lg:w-auto text-sm md:text-sm lg:text-base"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full lg:w-auto lg:flex-row lg:items-stretch">
              <Link
                to="/auth"
                className="bg-white text-purple-600 px-4 py-2 sm:px-4 sm:py-2 md:px-4 md:py-2 lg:px-4 lg:py-2 rounded-lg shadow hover:bg-gray-200 text-center w-3/5 sm:w-2/5 md:w-2/5 lg:w-auto text-sm md:text-sm lg:text-base mb-2 lg:mb-0 lg:mr-2"
              >
                Login
              </Link>
              <Link
                to="/auth"
                state={{ isSignup: true }}
                className="bg-white text-red-500 px-4 py-2 sm:px-4 sm:py-2 md:px-4 md:py-2 lg:px-4 lg:py-2 rounded-lg shadow hover:bg-gray-200 text-center w-3/5 sm:w-2/5 md:w-2/5 lg:w-auto text-sm md:text-sm lg:text-base"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
