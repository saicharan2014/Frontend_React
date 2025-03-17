import { useState, useEffect, useRef } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";
import { useCookies } from "react-cookie";
import { auth } from "../../FirebaseConfig/firebase";
import { onAuthStateChanged } from "firebase/auth";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url
).toString();

function TableManager() {
  const [fileData, setFileData] = useState([]); // Store data for each file
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editedData, setEditedData] = useState([]);
  const [isEditingHeadersModalOpen, setIsEditingHeadersModalOpen] =
    useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [editedHeaders, setEditedHeaders] = useState([]);
  const fileInputRef = useRef(null);
  const [cookies] = useCookies(["user"]);
  const navigate = useNavigate();

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

  // Load saved file data from localStorage on component mount
  useEffect(() => {
    const savedFileData = JSON.parse(localStorage.getItem("fileData") || "[]");
    if (savedFileData) setFileData(savedFileData);
  }, []);

  // Save file data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("fileData", JSON.stringify(fileData));
  }, [fileData]);

  // Process DOCX files
  const processDocx = async (data, fileName) => {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: data });
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, "text/html");
      const tables = doc.querySelectorAll("table");
      let columns = [];
      let rows = [];

      if (tables.length > 0) {
        const table = tables[0];
        const tableRows = table.querySelectorAll("tr");

        if (tableRows.length > 0) {
          columns = Array.from(tableRows[0].querySelectorAll("th, td")).map(
            (cell) => cell.textContent.trim()
          );
          rows = Array.from(tableRows)
            .slice(1)
            .map((row) =>
              Array.from(row.querySelectorAll("td")).map((cell) =>
                cell.textContent.trim()
              )
            );
        }
      } else {
        const lines = result.value
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "");

        if (lines.length < 2) {
          return {
            fileName,
            columns: ["Content"],
            rows: lines.map((text) => [text]),
          };
        }

        columns = ["Field", "Value"];
        for (let i = 0; i < lines.length; i += 2) {
          rows.push([lines[i], lines[i + 1] || ""]);
        }
      }

      return { fileName, columns, rows };
    } catch (error) {
      console.error("Error processing DOCX:", error);
      return { fileName, columns: [], rows: [] };
    }
  };

  // Process PDF files
  const processPDF = async (data, fileName) => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;
      let extractedRows = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let rowsMap = new Map();

        textContent.items.forEach((item) => {
          const y = Math.round(item.transform[5]);
          if (!rowsMap.has(y)) {
            rowsMap.set(y, []);
          }
          rowsMap.get(y).push({
            text: item.str.trim(),
            x: Math.round(item.transform[4]),
          });
        });

        let sortedRows = [...rowsMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, items]) =>
            items
              .sort((a, b) => a.x - b.x)
              .map((item) => item.text)
              .filter((text) => text !== "")
          );

        extractedRows.push(...sortedRows);
      }

      if (extractedRows.length > 0) {
        const numCols = Math.max(...extractedRows.map((row) => row.length));
        extractedRows = extractedRows.map((row) => {
          while (row.length < numCols) row.push("");
          return row;
        });

        return {
          fileName,
          columns: extractedRows[0],
          rows: extractedRows.slice(1),
        };
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
    }
    return { fileName, columns: [], rows: [] };
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let newFileData = [];

    for (let file of files) {
      const reader = new FileReader();

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const excelData = await new Promise((resolve) => {
          reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve({ fileName: file.name, data: jsonData });
          };
          reader.readAsBinaryString(file);
        });

        newFileData.push(excelData);
      } else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        const docxData = await new Promise((resolve) => {
          reader.onload = async (e) => {
            const arrayBuffer = e.target?.result;
            const result = await processDocx(arrayBuffer, file.name);
            resolve({
              fileName: file.name,
              data: result.rows.map((row) => {
                const rowData = {};
                result.columns.forEach((col, index) => {
                  rowData[col] = row[index] || "";
                });
                return rowData;
              }),
            });
          };
          reader.readAsArrayBuffer(file);
        });

        newFileData.push(docxData);
      } else if (file.name.endsWith(".pdf")) {
        const pdfData = await new Promise((resolve) => {
          reader.onload = async (e) => {
            const arrayBuffer = e.target?.result;
            const result = await processPDF(arrayBuffer, file.name);
            resolve({
              fileName: file.name,
              data: result.rows.map((row) => {
                const rowData = {};
                result.columns.forEach((col, index) => {
                  rowData[col] = row[index] || "";
                });
                return rowData;
              }),
            });
          };
          reader.readAsArrayBuffer(file);
        });

        newFileData.push(pdfData);
      }
    }

    if (newFileData.length > 0) {
      setFileData((prev) => [...prev, ...newFileData]);
    }
  };

  // Add a new row to the table
  const addNewRow = () => {
    if (!editedData || editedData.length === 0) {
      console.error("No data to add a new row to");
      return;
    }

    const newRow = Object.keys(editedData[0] || {}).reduce((acc, header) => {
      acc[header] = ""; // Initialize each cell in the new row as empty
      return acc;
    }, {});

    setEditedData([...editedData, newRow]);
  };

  // Save table edits
  const saveTableEdits = (index) => {
    if (!fileData || !fileData[index]) {
      console.error("Invalid file data or index");
      return;
    }

    setFileData((prev) => {
      const updatedFileData = [...prev];
      if (updatedFileData[index]) {
        updatedFileData[index].data = editedData;
      }
      return updatedFileData;
    });

    setIsEditingTable(false);
  };

  // Cancel table edits
  const cancelTableEdits = () => {
    setIsEditingTable(false);
  };

  // Export to PDF
  const exportToPDF = (index) => {
    const doc = new jsPDF();
    const file = fileData[index];
    autoTable(doc, {
      head: [file.headers || Object.keys(file.data[0] || {})],
      body: file.data.map((row) =>
        (file.headers || Object.keys(row)).map((header) => row[header] || "")
      ),
    });
    doc.save(`${file.fileName}.pdf`);
    setIsExportOpen(false);
  };

  // Export to Excel
  const exportToExcel = (index) => {
    const file = fileData[index];
    const ws = XLSX.utils.json_to_sheet(file.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${file.fileName}.xlsx`);
    setIsExportOpen(false);
  };

  // Export to Word
  const exportToDoc = (index) => {
    const file = fileData[index];
    if (!file || !file.data || file.data.length === 0) {
      console.error("No data to export.");
      return;
    }

    let headers =
      file.headers || (file.data.length > 0 ? Object.keys(file.data[0]) : []);
    let content = `<table border='1' style='border-collapse:collapse;'>`;

    content += `<tr>${headers
      .map((header) => `<th>${header}</th>`)
      .join("")}</tr>`;

    file.data.forEach((row) => {
      content += `<tr>${headers
        .map((header) => `<td>${row[header] || ""}</td>`)
        .join("")}</tr>`;
    });

    content += "</table>";

    const blob = new Blob(["\ufeff" + content], { type: "application/msword" });
    saveAs(blob, `${file.fileName || "export"}.doc`);
    setIsExportOpen(false);
  };

  // Open edit headers modal
  const openEditHeadersModal = (index) => {
    setCurrentFileIndex(index);
    setEditedHeaders(
      fileData[index].headers || Object.keys(fileData[index].data[0] || {})
    );
    setIsEditingHeadersModalOpen(true);
  };

  // Save edited headers
  const saveEditedHeaders = () => {
    if (currentFileIndex !== null) {
      setFileData((prev) => {
        const updatedFileData = [...prev];
        if (updatedFileData[currentFileIndex]) {
          updatedFileData[currentFileIndex].headers = editedHeaders;
        }
        return updatedFileData;
      });
      setIsEditingHeadersModalOpen(false);
    }
  };

  // Handle header change
  const handleHeaderChange = (index, value) => {
    const updatedHeaders = [...editedHeaders];
    updatedHeaders[index] = value;
    setEditedHeaders(updatedHeaders);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger the file input dialog
    }
  };

  // Add new header
  const addNewHeader = () => {
    setEditedHeaders([...editedHeaders, ""]);
  };

  // Remove header
  const removeHeader = (index) => {
    const updatedHeaders = editedHeaders.filter((_, i) => i !== index);
    setEditedHeaders(updatedHeaders);
  };

  const startTableEdit = (index) => {
    setCurrentFileIndex(index); // Set the index of the file being edited
    setEditedData(fileData[index].data); // Set the data to be edited
    setIsEditingTable(true); // Enable editing mode
  };

  const removeTable = (index) => {
    setFileData((prev) => {
      const updatedFileData = [...prev];
      updatedFileData.splice(index, 1); // Remove the table at the specified index
      return updatedFileData;
    });
  };

  // Handle click outside export menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isExportOpen &&
        !event.target.closest(".export-menu") &&
        !event.target.closest(".export-button")
      ) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-white">Table Manager</h1>
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.docx,.doc,.pdf"
              className="hidden"
              multiple
            />
            <button
              onClick={handleUploadClick}
              className="bg-white text-purple-600 text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-purple-100 transition-all duration-150 flex items-center gap-2"
            >
              <Upload size={20} />
              Upload File(s)
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-white text-blue-500 text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-100 transition-all duration-150"
            >
              Home
            </button>
          </div>
        </div>

        {fileData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-screen">
            {/* Glassmorphism Container */}
            <div className="bg-white/30 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl border border-white/20 w-full max-w-2xl mx-4">
              <p className="text-2xl font-semibold text-white mb-6 text-center">
                Welcome to Table Manager
              </p>
              <p className="text-lg text-white mb-8 text-center">
                Click the Upload File(s) button to preview your data in a table,
                edit it as needed, and export it in PDF, Excel, or DOC format.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleUploadClick}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-100 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Upload size={24} />
                  Click to Upload File(s)
                </button>
              </div>
            </div>

            {/* Additional Decorative Elements */}
            <div className="mt-12 text-center">
              <p className="text-white mb-4">Supported File Formats:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-purple-600 border border-white/20 shadow-sm">
                  .xlsx
                </span>
                <span className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-pink-600 border border-white/20 shadow-sm">
                  .xls
                </span>
                <span className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-red-600 border border-white/20 shadow-sm">
                  .docx
                </span>
                <span className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-purple-600 border border-white/20 shadow-sm">
                  .pdf
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {fileData.map((file, index) => (
              <div
                key={index}
                className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                  <h2 className="text-xl font-bold text-gray-700">
                    {file.fileName}
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startTableEdit(index)}
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-all duration-150"
                    >
                      Edit Table
                    </button>
                    <button
                      onClick={() => removeTable(index)}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-all duration-150"
                    >
                      Remove Table
                    </button>
                    <button
                      onClick={() => openEditHeadersModal(index)}
                      className="bg-purple-500 text-white px-3 py-1.5 rounded-md hover:bg-purple-600 transition-all duration-150"
                    >
                      Edit Headers
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-all duration-150"
                      >
                        Export
                      </button>
                      {isExportOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 export-menu">
                          <button
                            onClick={() => exportToPDF(index)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export to PDF
                          </button>
                          <button
                            onClick={() => exportToExcel(index)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export to Excel
                          </button>
                          <button
                            onClick={() => exportToDoc(index)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export to Word
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isEditingTable && currentFileIndex === index ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr>
                          {(
                            file.headers || Object.keys(file.data[0] || {})
                          ).map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editedData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.keys(row).map((key, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700"
                              >
                                <input
                                  type="text"
                                  value={row[key]}
                                  onChange={(e) => {
                                    const updatedData = [...editedData];
                                    updatedData[rowIndex][key] = e.target.value;
                                    setEditedData(updatedData);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => saveTableEdits(index)}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-150"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelTableEdits}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addNewRow}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-150"
                      >
                        Add Row
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr>
                          {(
                            file.headers || Object.keys(file.data[0] || {})
                          ).map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {file.data.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((value, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditingHeadersModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Headers</h2>
              {editedHeaders.map((header, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-all duration-150"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addNewHeader}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-150"
              >
                Add Header
              </button>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveEditedHeaders}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-150"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingHeadersModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableManager;
