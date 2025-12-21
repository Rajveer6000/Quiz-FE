/**
 * Loading Context
 * Global loading state for API calls
 */

import { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount(prev => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1));
  }, []);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      
      {/* Global Loading Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-1 bg-dark-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 loading-bar" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Singleton for API interceptors (since they can't use hooks)
let loadingCallbacks = {
  start: () => {},
  stop: () => {},
};

export const setLoadingCallbacks = (start, stop) => {
  loadingCallbacks.start = start;
  loadingCallbacks.stop = stop;
};

export const getLoadingCallbacks = () => loadingCallbacks;
