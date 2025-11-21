import React, { useState, useEffect } from "react";
import "./animation.css";
import "react-datepicker/dist/react-datepicker.css";
import { storageUtils, type EnquiryData } from "../utils/storageUtils";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface FormData {
  fullName: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  address: string;

  // Document
  aadharNumber: string;

  // Enquiry and meta
  enquiryDistrict: string;
  sourceOfEnquiry: string;
  interestedStatus: string;
  howDidYouKnow: string;
  customHowDidYouKnow: string;
  callBackDate: string;
  paidFessDate: string;
  status: string;
  education: string;
  customEducation: string;
  knowledgeOfAndroid: string;

  // Payment fields
  totalFees: string;
  paidFees: string;
  remainingFees: string;
  paymentMode: "" | "Online" | "Offline";
  offlinePaymentType: "" | "Cash" | "Cheque";
  onlineTransactionId: string;
  chequeNumber: string;
}

interface FormErrors {
  [key: string]: string;
}

// ------------------------------------------------------------------
// Validation helpers
// ------------------------------------------------------------------
const ValidationHelpers = {
  validateFullName: (name: string): string => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 3) return "Name must be at least 3 characters";
    if (!/^[a-zA-Z\s.]+$/.test(name)) return "Name can only contain letters, spaces, and dots";
    if (name.trim().length > 100) return "Name must not exceed 100 characters";
    return "";
  },
  validateMobile: (mobile: string, fieldName: string = "Mobile"): string => {
    if (!mobile.trim()) return `${fieldName} number is required`;
    if (!/^\d{10}$/.test(mobile)) return `${fieldName} number must be exactly 10 digits`;
    if (!/^[6-9]\d{9}$/.test(mobile)) return `${fieldName} number must start with 6, 7, 8, or 9`;
    return "";
  },
  validateEmail: (email: string): string => {
    if (!email.trim()) return "Email address is required";
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 100) return "Email must not exceed 100 characters";
    return "";
  },
  validateAadhar: (aadhar: string): string => {
    if (!aadhar.trim()) return "";
    const cleanAadhar = aadhar.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhar)) return "Aadhar number must be exactly 12 digits";
    if (cleanAadhar === "000000000000" || cleanAadhar === "111111111111") return "Invalid Aadhar number format";
    return "";
  },
  validateAddress: (address: string): string => {
    if (!address.trim()) return "Address is required";
    if (address.trim().length < 10) return "Address must be at least 10 characters";
    if (address.trim().length > 500) return "Address must not exceed 500 characters";
    return "";
  },
  validateDate: (date: string, fieldName: string, allowPast: boolean = false): string => {
    if (!date) return `${fieldName} is required`;

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) return `Invalid ${fieldName.toLowerCase()}`;
    if (!allowPast && selectedDate < today) return `${fieldName} cannot be in the past`;

    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    if (selectedDate > twoYearsFromNow) return `${fieldName} cannot be more than 2 years in the future`;

    return "";
  },
};

// ------------------------------------------------------------------
// Reusable UI components
// ------------------------------------------------------------------
const Field: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  error?: string;
  icon?: React.ReactNode;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  readOnly?: boolean;
  disabled?: boolean;
}> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  required,
  placeholder,
  type = "text",
  error,
  icon,
  maxLength,
  minLength,
  pattern,
  readOnly,
  disabled,
}) => {
  const isDuplicate = error?.includes("⚠️");
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="flex items-center text-gray-700 text-sm font-medium">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          readOnly={readOnly}
          disabled={disabled}
          className={`w-full h-11 border rounded-lg px-3 ${icon ? "pl-10" : ""
            } text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 ${readOnly || disabled ? "bg-gray-50" : ""
            } ${error
              ? isDuplicate
                ? "border-yellow-400 focus:ring-2 focus:ring-yellow-200 focus:border-yellow-500 bg-yellow-50"
                : "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500"
            } hover:border-gray-400 focus:outline-none`}
        />
        {maxLength && value.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {error && (
        <span
          className={`text-xs flex items-center gap-1 ${isDuplicate ? "text-yellow-600 font-medium" : "text-red-500"
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

const TextAreaField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  rows?: number;
}> = ({ label, name, value, onChange, onBlur, required, placeholder, error, rows = 4 }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="flex items-center text-gray-700 text-sm font-medium">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 resize-none ${error
          ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
          : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500"
          } hover:border-gray-400 focus:outline-none`}
      />
      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

const DropdownField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
}> = ({ label, name, value, onChange, options, required, error, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label htmlFor={name} className="flex items-center text-gray-700 text-sm font-medium">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full h-11 px-3 ${icon ? "pl-10" : ""
            } border rounded-lg text-left text-sm transition-all duration-200 ${error
              ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500"
            } hover:border-gray-400 focus:outline-none ${value ? "text-gray-900" : "text-gray-400"}`}
        >
          <span className="truncate">{value || "Select an option"}</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-green-50 transition-colors ${value === option ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"
                    } ${index !== options.length - 1 ? "border-b border-gray-100" : ""} first:rounded-t-lg last:rounded-b-lg`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

const SearchableDropdownField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  onBlur?: () => void;
}> = ({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
  icon,
  placeholder = "Type to search...",
  onBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const normalized = (s: string) => s.toLowerCase().trim();
  const filtered = options.filter((opt) => normalized(opt).includes(normalized(query)));

  const selectOption = (opt: string) => {
    onChange(opt);
    setQuery(opt);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label htmlFor={name} className="flex items-center text-gray-700 text-sm font-medium">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            onBlur?.();
            if (query !== value) onChange(query);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) selectOption(filtered[0]);
              else onChange(query);
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          autoComplete="off"
          className={`w-full h-11 border rounded-lg px-3 ${icon ? "pl-10" : ""
            } text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 ${error
              ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500"
            } hover:border-gray-400 focus:outline-none`}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            onClick={() => {
              setQuery("");
              onChange("");
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filtered.length > 0 ? (
                filtered.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectOption(option)}
                    className={`w-full px-3 py-2.5 text-left text-sm hover:bg-green-50 transition-colors ${value === option ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"
                      } ${index !== filtered.length - 1 ? "border-b border-gray-100" : ""} first:rounded-t-lg last:rounded-b-lg`}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2.5 text-sm text-gray-500">No results found</div>
              )}
            </div>
          </>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

const DateField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  min?: string;
}> = ({ label, name, value, onChange, required, error, icon, min }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="flex items-center text-gray-700 text-sm font-medium">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          className={`w-full h-11 border rounded-lg px-3 ${icon ? "pl-10" : ""
            } text-sm text-gray-900 ${error
              ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-500"
            } hover:border-gray-400 focus:outline-none transition-all duration-200`}
        />
      </div>
      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

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
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in-right ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}
    >
      {type === "success" ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

const DuplicateWarningModal: React.FC<{
  existingEnquiry: EnquiryData;
  duplicateField: string;
  onClose: () => void;
}> = ({ existingEnquiry, duplicateField, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              Duplicate {duplicateField.toUpperCase()} Detected
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              This {duplicateField} already exists in our system
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-3">
            Existing Enquiry Details:
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Enquiry ID:</span>
              <span className="font-medium text-gray-900">{existingEnquiry.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{existingEnquiry.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mobile:</span>
              <span className="font-medium text-gray-900">{existingEnquiry.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900 truncate max-w-xs">
                {existingEnquiry.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900">{existingEnquiry.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {new Date(existingEnquiry.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-700">
            <strong>Important:</strong> Each mobile, email, and Aadhar number must be unique. Please
            verify the information or update the existing enquiry instead of creating a new one.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
const AddEnquiry: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    address: "",
    aadharNumber: "",
    enquiryDistrict: "",
    sourceOfEnquiry: "",
    interestedStatus: "",
    howDidYouKnow: "",
    customHowDidYouKnow: "",
    callBackDate: "",
    paidFessDate: "",
    status: "",
    education: "",
    customEducation: "",
    knowledgeOfAndroid: "",
    totalFees: "25000",      // default
    paidFees: "",
    remainingFees: "25000",  // default
    paymentMode: "",
    offlinePaymentType: "",
    onlineTransactionId: "",
    chequeNumber: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateEnquiry, setDuplicateEnquiry] = useState<EnquiryData | null>(null);
  const [duplicateField, setDuplicateField] = useState<string>("");
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, inProcess: 0 });

  const isConfirmed = formData.status === "Confirmed";

  useEffect(() => {
    const loadStats = async () => {
      const statistics = await storageUtils.getStatistics();
      setStats(statistics);
    };
    loadStats();
  }, []);

  const formatMobile = (value: string) => value.replace(/\D/g, "").slice(0, 10);
  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3").trim();
  };
  // REMOVE LENGTH LIMIT: keep only digits, no slicing
  const formatAmount = (value: string) => value.replace(/\D/g, "");
  const formatCheque = (value: string) => value.replace(/\D/g, "").slice(0, 20);
  const formatTxnId = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30);

  const recalcRemaining = (total: string, paid: string) => {
    if (!total && !paid) return "";
    const t = Number(total || "0");
    const p = Number(paid || "0");
    return String(Math.max(t - p, 0));
  };

  const handleChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    if (field === "mobile" || field === "alternateMobile") {
      formattedValue = formatMobile(value);
    } else if (field === "aadharNumber") {
      formattedValue = formatAadhar(value);
    } else if (field === "totalFees" || field === "paidFees") {
      formattedValue = formatAmount(value);
    } else if (field === "chequeNumber") {
      formattedValue = formatCheque(value);
    } else if (field === "onlineTransactionId") {
      formattedValue = formatTxnId(value);
    } else if (field === "paymentMode") {
      setFormData((prev) => ({
        ...prev,
        paymentMode: value as FormData["paymentMode"],
        onlineTransactionId: value === "Online" ? prev.onlineTransactionId : "",
        offlinePaymentType: value === "Offline" ? prev.offlinePaymentType : "",
        chequeNumber: value === "Offline" ? prev.chequeNumber : "",
      }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
      return;
    } else if (field === "offlinePaymentType") {
      setFormData((prev) => ({
        ...prev,
        offlinePaymentType: value as FormData["offlinePaymentType"],
        chequeNumber: value === "Cash" ? "" : prev.chequeNumber,
      }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: formattedValue };
      if (field === "totalFees" || field === "paidFees") {
        next.remainingFees = recalcRemaining(
          field === "totalFees" ? formattedValue : next.totalFees,
          field === "paidFees" ? formattedValue : next.paidFees
        );
      }
      return next;
    });

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = async (field: keyof FormData) => {
    const value = formData[field];
    let error = "";

    switch (field) {
      case "fullName":
        error = ValidationHelpers.validateFullName(value);
        break;

      case "mobile":
        error = ValidationHelpers.validateMobile(value);
        if (!error && (await storageUtils.isMobileExists(value))) {
          error = "⚠️ This mobile number is already registered";
        }
        break;

      case "alternateMobile":
        if (value) {
          error = ValidationHelpers.validateMobile(value, "Alternate mobile");
          if (!error && value === formData.mobile)
            error = "Alternate mobile cannot be same as primary mobile";
        }
        break;

      case "email":
        error = ValidationHelpers.validateEmail(value);
        if (!error && (await storageUtils.isEmailExists(value))) {
          error = "⚠️ This email is already registered";
        }
        break;

      case "address":
        error = ValidationHelpers.validateAddress(value);
        break;

      case "aadharNumber":
        if (value) {
          error = ValidationHelpers.validateAadhar(value);
          if (!error && (await storageUtils.isAadharExists(value))) {
            error = "⚠️ This Aadhar number is already registered";
            const existing = await storageUtils.getExistingEnquiry(value);
            if (existing) {
              setDuplicateEnquiry(existing);
              setDuplicateField("Aadhar");
              setShowDuplicateWarning(true);
            }
          }
        }
        break;

      case "callBackDate":
        error = ValidationHelpers.validateDate(value, "Call back date", true);
        break;

      case "paidFessDate":
        if (isConfirmed && isAdmin()) {
          error = ValidationHelpers.validateDate(value, "Paid Fees date", false);
        }
        break;

      case "sourceOfEnquiry":
        if (isConfirmed && !value) error = "Please select source of enquiry";
        break;

      case "interestedStatus":
        if (!value) error = "Please select interested status";
        break;

      case "status":
        if (!value) error = "Please select status";
        break;

      case "education":
        if (isConfirmed && !value) error = "Please select Education";
        break;

      case "knowledgeOfAndroid":
        if (isConfirmed && !value) error = "Please select knowledge level";
        break;

      case "howDidYouKnow":
        if (isConfirmed && !value) error = "Please select an option";
        break;

      case "customHowDidYouKnow":
        if (isConfirmed && formData.howDidYouKnow === "Other" && !value.trim())
          error = "Please specify how you knew about us";
        break;

      case "customEducation":
        if (isConfirmed && formData.education === "Other" && !value.trim())
          error = "Please specify your Education";
        break;

      case "totalFees":
        if (isConfirmed && isAdmin()) {
          if (!value) error = "Please enter total fees amount";
          else if (!/^\d+$/.test(value) || Number(value) <= 0)
            error = "Total fees must be a positive number";
          else if (formData.paidFees && Number(formData.paidFees) > Number(value))
            error = "Paid fees cannot exceed Total fees";
        }
        break;

      case "paidFees":
        if (isConfirmed && isAdmin()) {
          if (!value) error = "Please enter paid fees amount";
          else if (!/^\d+$/.test(value) || Number(value) < 0)
            error = "Paid fees cannot be negative";
          else if (formData.totalFees && Number(value) > Number(formData.totalFees))
            error = "Paid fees cannot exceed Total fees";
        }
        break;

      case "paymentMode":
        if (isConfirmed && isAdmin() && !value) error = "Please select payment mode";
        break;

      case "offlinePaymentType":
        if (isConfirmed && isAdmin() && formData.paymentMode === "Offline" && !value)
          error = "Please select offline payment type";
        break;

      case "onlineTransactionId":
        if (isConfirmed && isAdmin() && formData.paymentMode === "Online") {
          if (!value.trim()) error = "Please enter online transaction ID";
          else if (!/^[A-Z0-9]{6,30}$/.test(value))
            error = "Enter a valid transaction ID (6-30 chars, A-Z/0-9)";
        }
        break;

      case "chequeNumber":
        if (
          isConfirmed &&
          isAdmin() &&
          formData.paymentMode === "Offline" &&
          formData.offlinePaymentType === "Cheque"
        ) {
          if (!value.trim()) error = "Please enter cheque number";
          else if (!/^\d{6,20}$/.test(value))
            error = "Enter a valid cheque number (6-20 digits)";
        }
        break;
    }

    if (error) setErrors((prev) => ({ ...prev, [field]: error }));
    else
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

    return error;
  };

  const validate = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};
    const alwaysRequiredFields: (keyof FormData)[] = [
      "fullName",
      "mobile",
      "email",
      "address",
      "interestedStatus",
      "status",
      "callBackDate",
    ];
    const confirmedRequiredFields: (keyof FormData)[] = [
      "sourceOfEnquiry",
      "education",
      "knowledgeOfAndroid",
      "howDidYouKnow",
    ];
    const adminPaymentFields: (keyof FormData)[] = [
      "paidFessDate",
      "totalFees",
      "paidFees",
      "paymentMode",
    ];

    for (const field of alwaysRequiredFields) {
      const error = await validateField(field);
      if (error) newErrors[field] = error;
    }

    if (isConfirmed) {
      for (const field of confirmedRequiredFields) {
        const error = await validateField(field);
        if (error) newErrors[field] = error;
      }

      if (isAdmin()) {
        for (const field of adminPaymentFields) {
          const error = await validateField(field);
          if (error) newErrors[field] = error;
        }
      }
    }

    if (formData.alternateMobile) {
      const error = await validateField("alternateMobile");
      if (error) newErrors.alternateMobile = error;
    }

    if (isConfirmed && formData.howDidYouKnow === "Other") {
      const error = await validateField("customHowDidYouKnow");
      if (error) newErrors.customHowDidYouKnow = error;
    }

    if (isConfirmed && formData.education === "Other") {
      const error = await validateField("customEducation");
      if (error) newErrors.customEducation = error;
    }

    if (isConfirmed && isAdmin() && formData.paymentMode === "Online") {
      const error = await validateField("onlineTransactionId");
      if (error) newErrors.onlineTransactionId = error;
    }

    if (isConfirmed && isAdmin() && formData.paymentMode === "Offline") {
      const errType = await validateField("offlinePaymentType");
      if (errType) newErrors.offlinePaymentType = errType;

      if (formData.offlinePaymentType === "Cheque") {
        const errCheque = await validateField("chequeNumber");
        if (errCheque) newErrors.chequeNumber = errCheque;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => (allTouched[key] = true));
    setTouched(allTouched);

    const duplicates = await storageUtils.checkDuplicates(formData as any);
    if (duplicates.length > 0) {
      const duplicateErrors: FormErrors = {};
      duplicates.forEach(({ field, message }: any) => {
        duplicateErrors[field] = `⚠️ ${message}`;
      });
      setErrors((prev) => ({ ...prev, ...duplicateErrors }));
      setToast({
        message: `Duplicate found: ${duplicates
          .map((d: any) => d.field)
          .join(", ")}. Please check highlighted fields.`,
        type: "error",
      });
      return;
    }

    if (!(await validate())) {
      setToast({
        message: "Please fix all validation errors before submitting",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = parseFloat(formData.totalFees || "0");
      const paidAmount = parseFloat(formData.paidFees || "0");
      const remainingAmount = Math.max(totalAmount - paidAmount, 0);

      let initialPaymentHistory: any[] = [];

      if (isAdmin() && isConfirmed && paidAmount > 0) {
        initialPaymentHistory = [
          {
            id: `PMT-${Date.now()}`,
            date: formData.paidFessDate || new Date().toISOString(),
            amount: String(paidAmount),
            mode: formData.paymentMode,
            method: formData.paymentMode === "Offline" ? formData.offlinePaymentType : undefined,
            reference:
              formData.paymentMode === "Online"
                ? formData.onlineTransactionId
                : formData.chequeNumber,
            note: "Initial payment recorded at registration",
            createdBy: "Admin",
          },
        ];
      }

      const enquiryToSave = {
        ...formData,
        totalFees: String(totalAmount),
        paidFees: String(paidAmount),
        remainingFees: String(remainingAmount),
        paymentHistory: initialPaymentHistory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedEnquiry = await storageUtils.saveEnquiry(enquiryToSave as any);
      setToast({
        message: `✅ Enquiry added successfully! ID: ${savedEnquiry.id}`,
        type: "success",
      });

      if (isAdmin() && paidAmount > 0) {
        setTimeout(() => navigate("/payment-details"), 1500);
      } else {
        setTimeout(() => resetForm(), 1500);
      }
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit enquiry. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasData = Object.values(formData).some((value) => value.trim() !== "");
    if (hasData) setShowCancelConfirm(true);
    else resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      mobile: "",
      alternateMobile: "",
      email: "",
      address: "",
      aadharNumber: "",
      enquiryDistrict: "",
      sourceOfEnquiry: "",
      interestedStatus: "",
      howDidYouKnow: "",
      customHowDidYouKnow: "",
      callBackDate: "",
      paidFessDate: "",
      status: "",
      education: "",
      customEducation: "",
      knowledgeOfAndroid: "",
      totalFees: "25000",      // keep default on reset
      paidFees: "",
      remainingFees: "25000",  // keep default on reset
      paymentMode: "",
      offlinePaymentType: "",
      onlineTransactionId: "",
      chequeNumber: "",
    });
    setErrors({});
    setTouched({});
    setShowCancelConfirm(false);
  };

  const today = new Date().toISOString().split("T")[0];

  // ------------------------------------------------------------------
  // Icons
  // ------------------------------------------------------------------
  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
  const PhoneIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
  const EmailIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
  const CardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
  const ClipboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
  const StatusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
  const BookIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
  const BriefcaseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-sm px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Enquiry</h1>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the details to create a new enquiry
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm">
                <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  Total: {stats.total}
                </div>
                <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium">
                  Confirmed: {stats.confirmed}
                </div>
                <div className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg font-medium">
                  Pending: {stats.pending}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-200"
          noValidate
        >
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-green-500">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserIcon />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                </div>

                <Field
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(v) => handleChange("fullName", v)}
                  onBlur={() => handleBlur("fullName")}
                  required
                  placeholder="Enter full name"
                  error={touched.fullName ? errors.fullName : ""}
                  icon={<UserIcon />}
                  maxLength={100}
                />

                <Field
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(v) => handleChange("mobile", v)}
                  onBlur={() => handleBlur("mobile")}
                  required
                  placeholder="Enter 10-digit mobile number"
                  type="tel"
                  error={touched.mobile ? errors.mobile : ""}
                  icon={<PhoneIcon />}
                  maxLength={10}
                />

                <Field
                  label="Alternate Mobile Number"
                  name="alternateMobile"
                  value={formData.alternateMobile}
                  onChange={(v) => handleChange("alternateMobile", v)}
                  onBlur={() => handleBlur("alternateMobile")}
                  placeholder="Enter alternate number (optional)"
                  type="tel"
                  error={touched.alternateMobile ? errors.alternateMobile : ""}
                  icon={<PhoneIcon />}
                  maxLength={10}
                />

                <Field
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={(v) => handleChange("email", v)}
                  onBlur={() => handleBlur("email")}
                  placeholder="example@email.com"
                  type="email"
                  required
                  error={touched.email ? errors.email : ""}
                  icon={<EmailIcon />}
                  maxLength={100}
                />

                <TextAreaField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={(v) => handleChange("address", v)}
                  onBlur={() => handleBlur("address")}
                  placeholder="Enter complete address"
                  error={touched.address ? errors.address : ""}
                  required
                  rows={3}
                />

                {/* Document & Payment Details */}
                {isConfirmed && (
                  <>
                    <div className="pt-4 border-t-2 border-gray-200">
                      <div className="flex items-center gap-2 pb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CardIcon />
                        </div>
                        <h3 className="text-md font-semibold text-gray-900">Document</h3>
                      </div>
                    </div>

                    <Field
                      label="Aadhar Number"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={(v) => handleChange("aadharNumber", v)}
                      onBlur={() => handleBlur("aadharNumber")}
                      placeholder="XXXX XXXX XXXX"
                      error={touched.aadharNumber ? errors.aadharNumber : ""}
                      icon={<CardIcon />}
                      maxLength={14}
                    />

                    {/* Payment Details - Admin Only */}
                    {isAdmin() && (
                      <>
                        <div className="pt-2">
                          <div className="flex items-center gap-2 pb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <ClipboardIcon />
                            </div>
                            <h3 className="text-md font-semibold text-gray-900">
                              Payment Details
                            </h3>
                          </div>
                        </div>

                        <Field
                          label="Total Fees Amount"
                          name="totalFees"
                          value={formData.totalFees}
                          onChange={(v) => handleChange("totalFees", v)}
                          onBlur={() => handleBlur("totalFees")}
                          required
                          placeholder="Enter amount (e.g., 25000)"
                          error={touched.totalFees ? errors.totalFees : ""}
                          icon={<ClipboardIcon />}
                        />

                        <Field
                          label="Paid Fees Amount"
                          name="paidFees"
                          value={formData.paidFees}
                          onChange={(v) => handleChange("paidFees", v)}
                          onBlur={() => handleBlur("paidFees")}
                          required
                          placeholder="Enter amount paid"
                          error={touched.paidFees ? errors.paidFees : ""}
                          icon={<ClipboardIcon />}
                        />

                        <Field
                          label="Remaining Fees Amount"
                          name="remainingFees"
                          value={formData.remainingFees}
                          onChange={() => { }}
                          placeholder="Auto-calculated"
                          error={""}
                          icon={<ClipboardIcon />}
                          readOnly
                          disabled
                        />

                        <DropdownField
                          label="Payment Mode"
                          name="paymentMode"
                          value={formData.paymentMode}
                          onChange={(v) => handleChange("paymentMode", v)}
                          options={["Online", "Offline"]}
                          required
                          error={touched.paymentMode ? errors.paymentMode : ""}
                          icon={<ClipboardIcon />}
                        />

                        {formData.paymentMode === "Online" && (
                          <Field
                            label="Online Transaction ID"
                            name="onlineTransactionId"
                            value={formData.onlineTransactionId}
                            onChange={(v) => handleChange("onlineTransactionId", v)}
                            onBlur={() => handleBlur("onlineTransactionId")}
                            required
                            placeholder="e.g., TXN12345ABC"
                            error={
                              touched.onlineTransactionId
                                ? errors.onlineTransactionId
                                : ""
                            }
                            icon={<ClipboardIcon />}
                            maxLength={30}
                          />
                        )}

                        {formData.paymentMode === "Offline" && (
                          <>
                            <DropdownField
                              label="Offline Payment Type"
                              name="offlinePaymentType"
                              value={formData.offlinePaymentType}
                              onChange={(v) => handleChange("offlinePaymentType", v)}
                              options={["Cash", "Cheque"]}
                              required
                              error={
                                touched.offlinePaymentType ? errors.offlinePaymentType : ""
                              }
                              icon={<ClipboardIcon />}
                            />

                            {formData.offlinePaymentType === "Cheque" && (
                              <Field
                                label="Cheque Number"
                                name="chequeNumber"
                                value={formData.chequeNumber}
                                onChange={(v) => handleChange("chequeNumber", v)}
                                onBlur={() => handleBlur("chequeNumber")}
                                required
                                placeholder="Enter cheque number"
                                error={
                                  touched.chequeNumber ? errors.chequeNumber : ""
                                }
                                icon={<ClipboardIcon />}
                                maxLength={20}
                              />
                            )}
                          </>
                        )}

                        <DateField
                          label="Paid Fees Date"
                          name="paidFessDate"
                          value={formData.paidFessDate}
                          required
                          onChange={(v) => handleChange("paidFessDate", v)}
                          error={touched.paidFessDate ? errors.paidFessDate : ""}
                          icon={<CalendarIcon />}
                          min={today}
                        />
                      </>
                    )}

                    {!isAdmin() && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex gap-3">
                          <svg
                            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <h4 className="text-sm font-semibold text-amber-900 mb-1">
                              Payment Information
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed">
                              Payment details (fees, payment mode, transaction IDs) are managed
                              by administrators only. Your enquiry will be processed and payment
                              information will be handled by the admin team.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-blue-500">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardIcon />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Enquiry Details</h2>
                </div>

                <SearchableDropdownField
                  label="Select Enquiry District"
                  name="enquiryDistrict"
                  value={formData.enquiryDistrict}
                  onChange={(v) => handleChange("enquiryDistrict", v)}
                  onBlur={() => handleBlur("enquiryDistrict")}
                  options={[
                    "Ahmednagar",
                    "Akola",
                    "Amravati",
                    "Aurangabad",
                    "Beed",
                    "Bhandara",
                    "Buldhana",
                    "Chandrapur",
                    "Dhule",
                    "Gadchiroli",
                    "Gondia",
                    "Hingoli",
                    "Jalgaon",
                    "Jalna",
                    "Kolhapur",
                    "Latur",
                    "Mumbai City",
                    "Mumbai Suburban",
                    "Nagpur",
                    "Nanded",
                    "Nandurbar",
                    "Nashik",
                    "Osmanabad",
                    "Palghar",
                    "Parbhani",
                    "Pune",
                    "Raigad",
                    "Ratnagiri",
                    "Sangli",
                    "Satara",
                    "Sindhudurg",
                    "Solapur",
                    "Thane",
                    "Wardha",
                    "Washim",
                    "Yavatmal",
                  ]}
                  error={touched.enquiryDistrict ? errors.enquiryDistrict : ""}
                  icon={<ClipboardIcon />}
                  placeholder="Type district name..."
                />

                <DropdownField
                  label="Interested Status"
                  name="interestedStatus"
                  value={formData.interestedStatus}
                  onChange={(v) => handleChange("interestedStatus", v)}
                  options={[
                    "100% Interested",
                    "75% Interested",
                    "50% Interested",
                    "25% Interested",
                    "0% Interested",
                  ]}
                  required
                  error={touched.interestedStatus ? errors.interestedStatus : ""}
                  icon={<ClipboardIcon />}
                />

                <DropdownField
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={(v) => handleChange("status", v)}
                  options={["In Process", "Confirmed", "Pending"]}
                  required
                  error={touched.status ? errors.status : ""}
                  icon={<StatusIcon />}
                />

                <DateField
                  label="Call Back Date"
                  name="callBackDate"
                  value={formData.callBackDate}
                  onChange={(v) => handleChange("callBackDate", v)}
                  error={touched.callBackDate ? errors.callBackDate : ""}
                  required
                  icon={<CalendarIcon />}
                  min={today}
                />

                {isConfirmed && (
                  <>
                    <div className="pt-4 border-t-2 border-gray-200">
                      <div className="flex items-center gap-2 pb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <BriefcaseIcon />
                        </div>
                        <h3 className="text-md font-semibold text-gray-900">
                          Additional Information
                        </h3>
                      </div>
                    </div>

                    <DropdownField
                      label="Source of Enquiry"
                      name="sourceOfEnquiry"
                      value={formData.sourceOfEnquiry}
                      onChange={(v) => handleChange("sourceOfEnquiry", v)}
                      options={[
                        "Phone Call",
                        "Walk-in",
                        "Referral",
                        "Social Media",
                        "Email",
                        "Advertisement",
                      ]}
                      required
                      error={touched.sourceOfEnquiry ? errors.sourceOfEnquiry : ""}
                      icon={<ClipboardIcon />}
                    />

                    <DropdownField
                      label="Education"
                      name="education"
                      value={formData.education}
                      onChange={(v) => {
                        handleChange("education", v);
                        if (v !== "Other") handleChange("customEducation", "");
                      }}
                      options={[
                        "BCA-I",
                        "BCA-II",
                        "BCA-III",
                        "MCA-I",
                        "MCA-II",
                        "B.Tech-I",
                        "B.Tech-II",
                        "B.Tech-III",
                        "B.Tech-IV",
                        "Diploma-I",
                        "Diploma-II",
                        "Diploma-III",
                      ]}
                      required
                      error={touched.education ? errors.education : ""}
                      icon={<BriefcaseIcon />}
                    />

                    {formData.education === "Other" && (
                      <Field
                        label="Specify Education"
                        name="customEducation"
                        value={formData.customEducation}
                        onChange={(v) => handleChange("customEducation", v)}
                        onBlur={() => handleBlur("customEducation")}
                        required
                        placeholder="Enter your Education"
                        error={touched.customEducation ? errors.customEducation : ""}
                        icon={<BriefcaseIcon />}
                      />
                    )}

                    <DropdownField
                      label="Knowledge of Domain"
                      name="knowledgeOfAndroid"
                      value={formData.knowledgeOfAndroid}
                      onChange={(v) => handleChange("knowledgeOfAndroid", v)}
                      options={["Fresher", "Intermediate", "Advanced", "Professional"]}
                      required
                      error={touched.knowledgeOfAndroid ? errors.knowledgeOfAndroid : ""}
                      icon={<BookIcon />}
                    />

                    <DropdownField
                      label="How did you know about us?"
                      name="howDidYouKnow"
                      value={formData.howDidYouKnow}
                      onChange={(v) => {
                        handleChange("howDidYouKnow", v);
                        if (v !== "Other") handleChange("customHowDidYouKnow", "");
                      }}
                      options={[
                        "Google Search",
                        "Facebook",
                        "Instagram",
                        "LinkedIn",
                        "Friend/Family",
                        "Advertisement",
                        "Other",
                      ]}
                      required
                      error={touched.howDidYouKnow ? errors.howDidYouKnow : ""}
                      icon={<ClipboardIcon />}
                    />

                    {formData.howDidYouKnow === "Other" && (
                      <Field
                        label="Specify Source"
                        name="customHowDidYouKnow"
                        value={formData.customHowDidYouKnow}
                        onChange={(v) => handleChange("customHowDidYouKnow", v)}
                        onBlur={() => handleBlur("customHowDidYouKnow")}
                        required
                        placeholder="Enter how you knew about us"
                        error={
                          touched.customHowDidYouKnow
                            ? errors.customHowDidYouKnow
                            : ""
                        }
                        icon={<ClipboardIcon />}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Important Note
                  </h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {isConfirmed
                      ? isAdmin()
                        ? "Additional fields are visible since status is Confirmed. Complete Document and Payment Details (including Mode, Cash/Cheque, and Paid Fees Date)."
                        : "Status is Confirmed. Document information is required. Payment details will be managed by administrators."
                      : "Basic information is required. Select Confirmed to access additional document fields" +
                      (isAdmin() ? " and payment details" : "") +
                      "."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-sky-500 text-white font-medium rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Enquiry"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toast & Modals */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Discard Changes?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  All unsaved changes will be lost
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateWarning && duplicateEnquiry && (
        <DuplicateWarningModal
          existingEnquiry={duplicateEnquiry}
          duplicateField={duplicateField}
          onClose={() => {
            setShowDuplicateWarning(false);
            setDuplicateEnquiry(null);
            setDuplicateField("");
          }}
        />
      )}
    </div>
  );
};

export default AddEnquiry;