import { useState, useCallback } from "react";

interface UseImagePreviewReturn {
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  loadPreview: (url: string) => Promise<void>;
  clearPreview: () => void;
}

export function useImagePreview(): UseImagePreviewReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate URL format
      new URL(url);

      // Check if it's an image by attempting to load it
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("Failed to load image. Please check the URL."));
        img.src = url;
      });

      setPreviewUrl(url);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid image URL";
      setError(errorMessage);
      setPreviewUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
  }, []);

  return { previewUrl, isLoading, error, loadPreview, clearPreview };
}
