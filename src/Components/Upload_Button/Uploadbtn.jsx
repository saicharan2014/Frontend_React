import { useNavigate } from "react-router-dom";

const Uploadbtn = () => {
  const navigate = useNavigate();

  return (
    <button
      className="bg-green-500 text-white text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-green-600 transition-all duration-150"
      onClick={() => navigate("/filehandling")}
    >
      Uploaded files
    </button>
  );
};

export default Uploadbtn;
