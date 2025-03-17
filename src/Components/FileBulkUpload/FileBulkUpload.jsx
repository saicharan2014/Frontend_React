import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import Mammoth from "mammoth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
// Replace with your AWS API endpoint
import { auth } from "../../FirebaseConfig/firebase";
import { onAuthStateChanged } from "firebase/auth";
import HomeButton from "../Home_Button/HomeButton";
import Uploadbtn from "../Upload_Button/Uploadbtn";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [cookies] = useCookies(["user"]); // Get the user cookie
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    // Check if user exists in cookies
    if (!cookies.user) {
      navigate("/auth"); // Redirect to login if no user in cookies
      return;
    }

    // Check Firebase authentication
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/auth"); // Redirect if not logged in
      }
    });
  }, [cookies.user, navigate]);

  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    onDrop: (acceptedFiles) => {
      const previews = acceptedFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          const fileUrl = URL.createObjectURL(file);

          if (
            file.type.startsWith("image/") ||
            file.type.startsWith("video/") ||
            file.type.startsWith("audio/")
          ) {
            resolve({ file, preview: fileUrl });
          } else if (file.name.match(/\.(txt|json|md|pdf)$/)) {
            resolve({ file, preview: fileUrl });
          } else if (file.name.endsWith(".docx")) {
            reader.onload = async (e) => {
              try {
                const result = await Mammoth.extractRawText({
                  arrayBuffer: e.target.result,
                });
                resolve({ file, textPreview: result.value });
              } catch (err) {
                console.error("Mammoth error:", err);
                resolve({ file, textPreview: "Unable to extract text." });
              }
            };
            reader.readAsArrayBuffer(file);
          } else if (file?.name?.match(/\.(html|css|js|jsx)$/)) {
            reader.onload = (e) =>
              resolve({ file, textPreview: e.target.result });
            reader.readAsText(file);
          } else {
            resolve({ file, preview: null });
          }
        });
      });

      Promise.all(previews).then((previewedFiles) => {
        setFiles((prevFiles) => [...prevFiles, ...previewedFiles]);
      });
    },
  });

  const handleRemove = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async (fileObj, index) => {
    setUploadingFile(fileObj.file.name);
    const formData = new FormData();
    formData.append("files", fileObj.file);
    try {
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${fileObj.file.name} uploaded successfully!`);
      handleRemove(index);
    } catch (error) {
      toast.error("Upload failed!");
      console.error(error.message);
    } finally {
      setUploadingFile(null);
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 flex flex-col items-center bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 overflow-auto">
      <ToastContainer position="bottom-right" />

      {/* Navigation Buttons - Fixed for mobile */}
      {/* Navigation Buttons */}
      <div className="w-full flex justify-between items-center mb-4 px-4 sm:px-6">
        <HomeButton />
        <Uploadbtn />
      </div>

      {/* Upload Area */}
      <div className="flex flex-grow justify-center items-center w-full">
        <div
          {...getRootProps()}
          className="w-full max-w-[1000px] p-4 sm:p-6 border-dashed border-2 border-gray-500 flex justify-center items-center cursor-pointer bg-white rounded-lg shadow-md"
        >
          <input {...getInputProps()} />
          <p className="text-gray-700 text-center text-sm sm:text-lg font-bold">
            Drag & Drop files or click to upload
          </p>
        </div>
      </div>

      {/* Files Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 w-full max-w-5xl px-4 sm:px-8">
        {files.map((file, index) => (
          <div
            key={index}
            className="p-4 sm:p-6 border rounded-lg bg-gray-100 shadow-lg w-full"
          >
            <p className="text-sm sm:text-md font-bold truncate">
              {file.file.name}
            </p>

            {/* Image Preview */}
            {file.preview && file.file.type.startsWith("image/") && (
              <img
                src={file.preview}
                alt={file.file.name}
                className="w-full h-40 sm:h-60 object-cover mt-2 rounded-md"
              />
            )}

            {/* Text & Code Preview */}
            {file.textPreview && file.file.name.endsWith(".docx") && (
              <pre className="mt-2 p-2 bg-gray-200 rounded-lg max-h-40 sm:max-h-64 overflow-auto text-xs sm:text-sm w-full">
                {file.textPreview.substring(0, 300)}
              </pre>
            )}

            {file.textPreview &&
              file.file?.name?.match(/\.(js|jsx|css|html)$/) && (
                <pre className="mt-2 p-2 bg-gray-200 rounded-lg max-h-40 sm:max-h-64 overflow-auto text-xs sm:text-sm">
                  {file.textPreview.substring(0, 300)}
                </pre>
              )}

            {/* Document Preview */}
            {file.preview && file.file.name.match(/\.(|txt|json|md|pdf)$/) && (
              <iframe
                src={file.preview}
                title={file.file.name}
                className="w-full h-48 sm:h-80 border rounded mt-2"
              ></iframe>
            )}

            {/* Video Preview */}
            {file.preview && file.file.type.startsWith("video/") && (
              <video controls className="w-full h-40 sm:h-60 mt-2">
                <source src={file.preview} type={file.file.type} />
              </video>
            )}

            {/* Audio Preview */}
            {file.preview && file.file.type.startsWith("audio/") && (
              <audio controls className="w-full mt-2">
                <source src={file.preview} type={file.file.type} />
              </audio>
            )}

            {/* No Preview Message */}
            {!file.preview && !file.textPreview && (
              <p className="text-gray-500 mt-2 text-xs sm:text-sm">
                No preview available
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                className="bg-green-500 text-white text-xs sm:text-sm px-3 py-1 rounded-md hover:bg-green-600 transition"
                onClick={() => handleUpload(file, index)}
                disabled={uploadingFile === file.file.name}
              >
                {uploadingFile === file.file.name ? "Uploading..." : "Upload"}
              </button>
              <button
                className="bg-red-500 text-white text-xs sm:text-sm px-3 py-1 rounded-md hover:bg-red-600 transition"
                onClick={() => handleRemove(index)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
