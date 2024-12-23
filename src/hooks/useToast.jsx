import React, {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  useRef,
} from "react";
import { AlertCircle, RefreshCcw, X, CheckCircle, Info } from "lucide-react";

import "../assets/styles/toast.scss";

// Create context for the toast
const ToastContext = createContext(null);

// Toast component
const Toast = ({ message, type, onClose }) => {
  const icons = {
    retrying: (
      <RefreshCcw className="w-6 h-6 text-blue-400 animate-spin bg-red-500" />
    ),
    error: <AlertCircle className="w-6 h-6 text-red-400" />,
    success: <CheckCircle className="w-6 h-6 text-green-400" />,
    info: <Info className="w-6 h-6 text-white" />,
  };

  return (
    <div className="toast">
      <div className="flex-shrink-0 p-4">{icons[type]}</div>
      <div className="flex-1 p-4">
        <p className="toast-message">{message}</p>
      </div>
    </div>
  );
};

// Toast Provider component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [timerId, setTimerId] = useState(null);

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  const showToast = useCallback(
    (message, type, duration) => {
      if (timerId) clearTimeout(timerId);
      setToast({ message, type });

      if (duration) {
        const id = setTimeout(() => setToast(null), duration);
        setTimerId(id);
      }
    },
    [timerId],
  );

  const hideToast = useCallback(() => {
    setToast(null);
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="toast-container">
        {toast && (
          <Toast
            {...toast}
            onClose={toast.type !== "retrying" ? hideToast : undefined}
          />
        )}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { showToast, hideToast } = context;
  const retryCountRef = useRef(0);

  const retryOperation = useCallback(
    async (
      operation,
      {
        maxRetries = 3,
        retryDelay = 2000,
        onSuccess,
        onError,
        errorDuration = 5000,
      } = {},
    ) => {
      const attempt = async () => {
        try {
          const result = await operation();
          hideToast();
          if (onSuccess) onSuccess(result);
          return result;
        } catch (error) {
          if (retryCountRef.current <= maxRetries) {
            retryCountRef.current++;
            showToast(
              `Attempting to replay... (${retryCountRef.current}/${maxRetries})`,
              "retrying",
            );

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return attempt();
          } else {
            const errorMessage = onError
              ? onError(error)
              : "Something went wrong. Please try again later.";
            showToast(errorMessage, "error", errorDuration);
            // retryCountRef.current = 0; // Reset retry count on max retries reached
            // throw error;
            return { error: errorMessage };
          }
        }
      };

      return attempt();
    },
    [showToast, hideToast],
  );

  return {
    showToast,
    hideToast,
    retryOperation,
  };
};
