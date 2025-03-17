// import { useState, useEffect } from "react";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import HomeButton from "../Home_Button/HomeButton";

// const FileHandler = () => {
//   const [files, setFiles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//   useEffect(() => {
//     fetchFiles();
//   }, []);

//   const fetchFiles = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${API_BASE_URL}/files`);
//       setFiles(response.data.files);
//     } catch (error) {
//       console.error("Error fetching files:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadFile = async (fileName) => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/download/${fileName}`, {
//         responseType: "blob",
//       });

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", fileName);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (error) {
//       console.error("Error downloading file:", error);
//     }
//   };

//   const deleteFile = async (fileName) => {
//     try {
//       await axios.delete(`${API_BASE_URL}/delete/${fileName}`);

//       // Optimized state update
//       setFiles((prevFiles) =>
//         prevFiles.filter((file) => file.name !== fileName)
//       );

//       // Show success toast
//       toast.success(`File "${fileName}" deleted successfully!`);
//     } catch (error) {
//       console.error("Error deleting file:", error);
//       toast.error("Failed to delete file.");
//     }
//   };

//   return (
//     <div className="max-w-full md:max-w-3xl lg:max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
//       <HomeButton />
//       <h2 className="text-2xl font-bold mb-4 text-center">Uploaded Files</h2>

//       {loading ? (
//         <div className="flex justify-center items-center">
//           <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
//           <p className="ml-2 text-gray-600">Loading files...</p>
//         </div>
//       ) : files.length === 0 ? (
//         <p className="text-gray-500 text-center">No files uploaded yet.</p>
//       ) : (
//         <ul className="space-y-3">
//           {files.map((file, index) => (
//             <li
//               key={index}
//               className="flex flex-col sm:flex-row justify-between items-center p-3 border rounded-lg bg-gray-50 shadow-sm"
//             >
//               {/* File Name (Truncated on small screens) */}
//               <span className="truncate w-full sm:w-auto text-center sm:text-left">
//                 {file.name}
//               </span>

//               {/* Buttons (Stacked on small screens) */}
//               <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
//                 <button
//                   onClick={() => downloadFile(file.name)}
//                   className="bg-blue-500 text-white text-sm px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 hover:bg-blue-600 w-full sm:w-auto"
//                 >
//                   Download
//                 </button>
//                 <button
//                   onClick={() => deleteFile(file.name)}
//                   className="bg-red-500 text-white text-sm px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 hover:bg-red-600 w-full sm:w-auto"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}

//       {/* Toast container at bottom-right to avoid blocking */}
//       <ToastContainer
//         position="bottom-right"
//         autoClose={3000}
//         hideProgressBar
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//         style={{ zIndex: 9999 }}
//       />
//     </div>
//   );
// };

// export default FileHandler;

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomeButton from "../Home_Button/HomeButton";

const FileHandler = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ✅ Wrap fetchFiles in useCallback to avoid unnecessary re-renders
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/files`);
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]); // ✅ API_BASE_URL is a dependency

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]); // ✅ Now fetchFiles is included as a dependency

  const downloadFile = async (fileName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/download/${fileName}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const deleteFile = async (fileName) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete/${fileName}`);

      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== fileName)
      );

      toast.success(`File "${fileName}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file.");
    }
  };

  return (
    <div className="max-w-full md:max-w-3xl lg:max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <HomeButton />
      <h2 className="text-2xl font-bold mb-4 text-center">Uploaded Files</h2>

      {loading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="ml-2 text-gray-600">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <p className="text-gray-500 text-center">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-3">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex flex-col sm:flex-row justify-between items-center p-3 border rounded-lg bg-gray-50 shadow-sm"
            >
              <span className="truncate w-full sm:w-auto text-center sm:text-left">
                {file.name}
              </span>

              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => downloadFile(file.name)}
                  className="bg-blue-500 text-white text-sm px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 hover:bg-blue-600 w-full sm:w-auto"
                >
                  Download
                </button>
                <button
                  onClick={() => deleteFile(file.name)}
                  className="bg-red-500 text-white text-sm px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 hover:bg-red-600 w-full sm:w-auto"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

export default FileHandler;
