import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import HomeButton from "../Home_Button/HomeButton";

const ExportFiles = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convert data to PDF (Table Format)
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("User Information", 10, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Field", "Value"]],
      body: [
        ["Name", formData.name],
        ["Email", formData.email],
        ["Phone", formData.phone],
        ["Address", formData.address],
      ],
    });

    doc.save("UserData.pdf");
  };

  // Convert data to Excel (Table Format)
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        Field: "Name",
        Value: formData.name,
      },
      {
        Field: "Email",
        Value: formData.email,
      },
      {
        Field: "Phone",
        Value: formData.phone,
      },
      {
        Field: "Address",
        Value: formData.address,
      },
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserData");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const excelData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(excelData, "UserData.xlsx");
  };

  // Convert data to DOCX (Table Format)
  const exportToDocx = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "User Information", bold: true, size: 28 }),
              ],
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Field")] }),
                    new TableCell({ children: [new Paragraph("Value")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Name")] }),
                    new TableCell({ children: [new Paragraph(formData.name)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Email")] }),
                    new TableCell({
                      children: [new Paragraph(formData.email)],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Phone")] }),
                    new TableCell({
                      children: [new Paragraph(formData.phone)],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Address")] }),
                    new TableCell({
                      children: [new Paragraph(formData.address)],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "UserData.docx");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 sm:p-8">
      <HomeButton />

      <h1 className="text-xl sm:text-2xl font-bold text-center mt-4 mb-4">
        Export Data as PDF, Excel, and DOCX
      </h1>

      {/* Moved the form section further down */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-lg mt-6">
        {/* Form Inputs */}
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter Name"
          className="w-full mb-3 p-3 border rounded"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter Email"
          className="w-full mb-3 p-3 border rounded"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter Phone"
          className="w-full mb-3 p-3 border rounded"
        />
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter Address"
          className="w-full mb-3 p-3 border rounded"
        />

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <button
            onClick={exportToPDF}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Export Excel
          </button>
          <button
            onClick={exportToDocx}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
          >
            Export DOCX
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportFiles;
