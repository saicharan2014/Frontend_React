import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCookies } from "react-cookie";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../FirebaseConfig/firebase";
import { z } from "zod"; // Import Zod

// Zod schema for form validation
const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    )
    .trim(),
});

const Auth = () => {
  const location = useLocation();
  const [isSignup, setIsSignUp] = useState(!location.state?.isSignup);
  const [cookies, setCookie] = useCookies(["user"]);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validate form using Zod
  const validateForm = () => {
    try {
      schema.parse({ email, password }); // Validate using Zod schema
      setErrors({}); // Clear errors if validation passes
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message; // Map Zod errors to the errors object
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let userCredential;
      if (isSignup) {
        // Login with email and password
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        toast.success("Login successful");
      } else {
        // Signup with email and password
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        toast.success("Signup successful");
        setIsSignUp(true); // Switch to login after successful signup
      }

      // Set cookies and reset form
      setCookie("user", userCredential.user.email, {
        path: "/",
        maxAge: 86400,
      });
      setEmail("");
      setPassword("");

      // Redirect after 1.5 seconds
      setTimeout(() => navigate(isSignup ? "/" : "/auth"), 1500);
    } catch (error) {
      toast.error(`${isSignup ? "Login" : "Signup"} failed: ` + error.message);
    }
  };

  // Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      setCookie("user", user.email, { path: "/", maxAge: 86400 });
      toast.success("Google Sign-In Successful");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast.error("Google Sign-In Failed: " + error.message);
    }
  };

  // Guest login
  const handleGuestLogin = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      setCookie("user", "Guest User", { path: "/", maxAge: 86400 });
      toast.success("Logged in as Guest");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast.error("Guest Login Failed: " + error.message);
    }
  };

  return (
    <motion.div
      className="flex justify-center items-center min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-red-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="bg-white/30 backdrop-blur-lg shadow-2xl rounded-3xl p-10 w-[400px] border border-white/40"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h2
          className="text-3xl font-extrabold text-white text-center mb-6 tracking-wide"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {isSignup ? "Welcome Back!" : "Create an Account"}
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            className="relative"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-white/20 text-white border border-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white placeholder-white/80"
            />
            {errors.email && (
              <p className="text-yellow-300 text-sm mt-1">{errors.email}</p>
            )}
          </motion.div>

          <motion.div
            className="relative"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-white/20 text-white border border-white/40 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-white placeholder-white/80"
              />
              <span
                className="absolute inset-y-0 right-4 flex items-center text-white cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && (
              <p className="text-yellow-300 text-sm mt-1">{errors.password}</p>
            )}
          </motion.div>

          <motion.button
            type="submit"
            className="w-full bg-white text-pink-500 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-200 transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSignup ? "Login" : "Signup"}
          </motion.button>
        </form>

        {/* Google Sign-In Button */}
        <motion.button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-200 transition duration-300 mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FcGoogle className="text-2xl" />
          Continue with Google
        </motion.button>

        {/* Guest Login Button */}
        <motion.button
          onClick={handleGuestLogin}
          className="w-full bg-white text-gray-700 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-400 transition duration-300 mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue as Guest
        </motion.button>

        {/* Go to Home Button */}
        <motion.button
          onClick={() => navigate("/")}
          className="w-full bg-white text-pink-500 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-200 transition duration-300 mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Go to Home
        </motion.button>

        {/* Toggle between Login and Signup */}
        <motion.p
          onClick={() => setIsSignUp(!isSignup)}
          className="text-center text-white/80 mt-5 cursor-pointer hover:underline"
          whileHover={{ scale: 1.1, color: "white" }}
        >
          {isSignup
            ? "Don't have an account? Signup"
            : "Already have an account? Login"}
        </motion.p>
      </motion.div>
      <ToastContainer />
    </motion.div>
  );
};

export default Auth;
