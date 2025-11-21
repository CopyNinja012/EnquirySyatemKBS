import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { advertisementStorage } from "../utils/advertisementStorage";
import { useAuth } from "../contexts/AuthContext";

const ImportAdvertisement: React.FC = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileExtension === "xlsx" || fileExtension === "xls") {
        setFile(selectedFile);
        setImportResult(null);
        showToast("File selected successfully", "success");
      } else {
        showToast("Please select a valid Excel file (.xlsx or .xls)", "error");
        e.target.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showToast("Excel file is empty", "error");
        setImporting(false);
        return;
      }

      const enquiries = jsonData.map((row: any) => ({
        name: String(row.Name || row.name || "").trim(),
        phoneNo: String(
          row["Phone No"] ||
            row["Phone Number"] ||
            row.phoneNo ||
            row.phone ||
            ""
        ).replace(/\D/g, ""),
        email: String(row.Email || row.email || "").trim(),
        aadharNo:
          row["Aadhar No"] || row.aadharNo || row.aadhar
            ? String(row["Aadhar No"] || row.aadharNo || row.aadhar).replace(
                /\D/g,
                ""
              )
            : "",
        panNo:
          row["PAN No"] || row.panNo || row.pan
            ? String(row["PAN No"] || row.panNo || row.pan)
                .trim()
                .toUpperCase()
            : "",
      }));

      const result = advertisementStorage.addBulkAdvertisementEnquiries(
        enquiries,
        currentUser?.username
      );

      setImportResult(await result);

      if ((await result).success > 0) {
        showToast(
          `Successfully imported ${(await result).success} records`,
          "success"
        );
      }

      if ((await result).failed > 0) {
        showToast(`Failed to import ${(await result).failed} records`, "error");
      }
    } catch (error) {
      console.error("Error importing file:", error);
      showToast("Error processing Excel file", "error");
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setImportResult(null);
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <Upload className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-sky-600 flex-shrink-0" />
            <span className="truncate">Import Advertisement Enquiries</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
            Upload Excel file to import advertisement enquiry data in bulk
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 md:p-12 text-center hover:border-sky-500 transition-all duration-300">
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <FileSpreadsheet className="w-8 h-8 sm:w-10 sm:h-10 text-sky-600" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 truncate max-w-full px-2">
                {file ? file.name : "Choose Excel File"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 px-2">
                Click to browse or drag and drop your file here
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">
                Supported formats: .xlsx, .xls
              </p>
            </label>
          </div>

          {file && (
            <div className="mt-4 sm:mt-6 flex items-center justify-between p-3 sm:p-4 bg-sky-50 rounded-xl border border-sky-200 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
              >
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </button>
            </div>
          )}

          <div className="mt-4 sm:mt-6">
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl hover:from-sky-700 hover:to-blue-700 transition-all duration-300 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload size={18} className="sm:w-5 sm:h-5" />
                  <span>Import Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <span>Import Results</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="p-4 sm:p-6 bg-sky-50 rounded-xl border-l-4 border-sky-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-sky-600 font-medium">
                      Successfully Imported
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-sky-700 mt-1">
                      {importResult.success}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-sky-500 flex-shrink-0" />
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-red-50 rounded-xl border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-red-600 font-medium">
                      Failed to Import
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-700 mt-1">
                      {importResult.failed}
                    </p>
                  </div>
                  <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 flex-shrink-0" />
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-red-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Error Details ({importResult.errors.length})</span>
                </h3>
                <div className="max-h-60 sm:max-h-80 md:max-h-96 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-2 sm:p-3 bg-white rounded-lg text-xs sm:text-sm text-red-700 border border-red-200 break-words"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Toast Component
const Toast: React.FC<{
  message: string;
  type: "success" | "error";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 sm:max-w-md z-50 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl animate-slide-in ${
        type === "success"
          ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white"
          : "bg-gradient-to-r from-red-600 to-pink-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-semibold flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80 flex-shrink-0">
        <XCircle size={14} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

// Add animation styles
const styles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ImportAdvertisement;