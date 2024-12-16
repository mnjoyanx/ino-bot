import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Info } from "lucide-react";

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <Check className="w-5 h-5 text-green-500" />,
    error: <X className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className="flex items-center w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex-shrink-0 p-4">{icons[type]}</div>
      <div className="flex-1 p-4">
        <p className="text-sm font-medium text-gray-900">{message}</p>
      </div>
      <button onClick={onClose} className="p-4">
        <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
      </button>
    </div>
  );
};

const Toaster = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default function SonnerExample() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => addToast("Success message!", "success")}
          className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
        >
          Success Toast
        </button>
        <button
          onClick={() => addToast("Error message!", "error")}
          className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
        >
          Error Toast
        </button>
        <button
          onClick={() => addToast("Warning message!", "warning")}
          className="px-4 py-2 text-white bg-yellow-500 rounded hover:bg-yellow-600"
        >
          Warning Toast
        </button>
        <button
          onClick={() => addToast("Info message!", "info")}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Info Toast
        </button>
      </div>

      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
