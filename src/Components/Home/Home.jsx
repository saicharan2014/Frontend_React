import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles
import Navbar from "../Navbar/Navbar";
import images from "./images";
import { fimages } from "./images";

export default function Home() {
  const navigate = useNavigate();
  const [cookies] = useCookies(["user"]);

  const handleActionClick = () => {
    if (!cookies.user) {
      toast.error("You're not logged in. Please login to upload files.", {
        position: "top-right",
        autoClose: 3000, // Auto-close after 3s
        pauseOnHover: true,
        theme: "light",
      });
      setTimeout(() => navigate("/auth"), 3000); // Redirect after 3s
    } else {
      navigate("/filebulk-upload");
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer />
      {/* ✅ Toast container to show alerts */}
      <div className="min-h-screen bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white flex flex-col items-center justify-center px-6 pt-20">
        {/* Hero Section */}
        <motion.div
          className="text-center max-w-3xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-bold">
            Effortless Bulk Upload & Preview
          </h1>
          <p className="text-lg mt-4 opacity-80">
            Upload, manage, and preview your files instantly with our intuitive
            and secure platform.
          </p>
        </motion.div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center w-full max-w-6xl px-4">
          <FeatureCard
            icon={
              <img
                src={fimages.images1}
                alt="Upload"
                className="mx-auto mb-4 h-50 w-60"
              />
            }
            title="Drag & Drop Upload"
            description="Easily upload files using our intuitive drag & drop interface."
          />
          <FeatureCard
            icon={
              <img
                src={fimages.images2}
                alt="Preview"
                className="mx-auto mb-4 h-50 w-60"
              />
            }
            title="Instant Preview"
            description="Preview uploaded files before finalizing your submission."
          />
          <FeatureCard
            icon={
              <img
                src={fimages.images3}
                alt="Secure"
                className="mx-auto mb-4 h-50 w-60"
              />
            }
            title="Table Manager"
            description="Table Manager is a powerful tool that lets you upload, preview, and edit files (XLSX, DOCX, PDF) instantly."
          />
        </div>

        {/* Demo Section */}
        <motion.div
          className="mt-16 w-full max-w-xl bg-white/20 p-6 rounded-lg border border-white/40 shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-center text-lg font-bold">Try it now:</p>
          <div
            className="border-2 border-dashed border-white/60 p-10 mt-4 rounded-lg text-center cursor-pointer"
            onClick={handleActionClick} // ✅ Show toast alert & redirect
          >
            Click to upload Files Here
          </div>
        </motion.div>

        {/* Demo Feedback Section */}
        <div className="mt-20 bg-gray-300 p-8 rounded-lg shadow-lg text-center w-full max-w-6xl px-4">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">
            What People Are Saying
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {/* Testimonial 1 */}
            <div className="w-full md:w-1/3 p-6 text-center bg-white rounded-lg shadow-md">
              <img
                src={images.img1}
                alt="User 1"
                className="mx-auto mb-4 rounded-full border-2 border-gray-200"
                width={80}
              />
              <p className="font-semibold text-lg text-gray-700">John Doe</p>
              <p className="text-gray-600 text-lg mt-4">
                This platform made bulk file uploading so easy! I love the
                simple drag & drop feature!
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="w-full md:w-1/3 p-6 text-center bg-white rounded-lg shadow-md">
              <img
                src={images.img2}
                alt="User 2"
                className="mx-auto mb-4 rounded-full border-2 border-gray-200"
                width={80}
              />
              <p className="font-semibold text-lg text-gray-700">Jane Smith</p>
              <p className="text-gray-600 text-lg mt-4">
                I can preview my files before submitting them, which is amazing
                for my workflow.
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="w-full md:w-1/3 p-6 text-center bg-white rounded-lg shadow-md">
              <img
                src={images.img3}
                alt="User 3"
                className="mx-auto mb-4 rounded-full border-2 border-gray-200"
                width={80}
              />
              <p className="font-semibold text-lg text-gray-700">
                Emily Johnson
              </p>
              <p className="text-gray-600 text-lg mt-4">
                I feel confident knowing my data is stored securely and
                encrypted. Highly recommend!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white py-6 mt-20 w-full">
        <div className="text-center">
          <p>&copy; 2025 SwiftUploadApp. All Rights Reserved.</p>
          <p className="mt-2">Designed with ❤️ for seamless file management.</p>
        </div>
      </footer>
    </>
  );
}

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    className="p-6 bg-white/20 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 flex flex-col items-center justify-center h-full"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    {icon}
    <h3 className="text-xl font-bold mt-4">{title}</h3>
    <p className="mt-2 opacity-80 text-center">{description}</p>
  </motion.div>
);
