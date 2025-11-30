import React, { useState, useEffect, useRef } from "react";
import { useJobSubmission } from "../hooks/use-job-submission";
import { useImagePreview } from "../hooks/use-image-preview";

interface JobSubmitFormProps {
  onSuccess: () => void;
}

export function JobSubmitForm({ onSuccess }: JobSubmitFormProps) {
  const t = useTranslations('jobsubmitform');
  const [url, setUrl] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [grayscale, setGrayscale] = useState(false);
  const [blur, setBlur] = useState(0);
  const [sharpen, setSharpen] = useState(false);
  const [rotate, setRotate] = useState(0);
  const [flip, setFlip] = useState(false);
  const [flop, setFlop] = useState(false);
  const [quality, setQuality] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { submit, loading, error, clearError } = useJobSubmission(onSuccess);
  const {
    previewUrl,
    isLoading: previewLoading,
    error: previewError,
    loadPreview,
    clearPreview,
  } = useImagePreview();

  // Debounced preview loading
  useEffect(() => {
    if (!url) {
      clearPreview();
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        new URL(url);
        loadPreview(url);
      } catch {
        // Invalid URL, don't attempt preview
        clearPreview();
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [url, loadPreview, clearPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    // Build transformations from form state
    const transformations: any = {};

    if (width > 0) transformations.width = width;
    if (height > 0) transformations.height = height;
    if (quality > 0) transformations.quality = quality;
    if (grayscale) transformations.grayscale = true;
    if (blur > 0) transformations.blur = blur;
    if (sharpen) transformations.sharpen = true;
    if (rotate !== 0) transformations.rotate = rotate;
    if (flip) transformations.flip = true;
    if (flop) transformations.flop = true;

    // Check if at least one transformation is set
    const hasTransformations = Object.keys(transformations).length > 0;

    if (!hasTransformations) {
      setValidationError(
        "Please select at least one transformation option to process the image."
      );
      return;
    }

    // Clear validation error if set
    setValidationError(null);

    const result = await submit(url.trim(), transformations);

    if (result) {
      setShowSuccess(true);
      setUrl("");
      clearPreview();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      // Focus back on input for better UX
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) clearError();
    if (validationError) setValidationError(null);
  };

  return (
    function __rewrite__() {
  return <section className="card p-8 transition-all duration-500 ease-in-out" aria-labelledby="submit-form-title">
      <div className="space-y-6">
        <div className="text-center">
          <h2 id="submit-form-title" className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">{t("transform_your_image")}</h2>
          <p className="text-[hsl(var(--color-text-secondary))]">{t("paste_your_image_url_below")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="image-url" className="block text-sm font-bold text-[hsl(var(--color-text))] mb-2">{t("image_url")}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input ref={inputRef} id="image-url" type="url" value={url} onChange={handleUrlChange} placeholder="https://example.com/image.jpg" className="input pl-12 pr-12 text-base font-medium" disabled={loading} aria-invalid={error ? "true" : "false"} aria-describedby={error ? "url-error" : previewError ? "preview-error" : undefined} autoComplete="url" />
              {url && <button type="button" onClick={() => {
              setUrl("");
              clearPreview();
              if (error) clearError();
              inputRef.current?.focus();
            }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10" aria-label={t("clear_input")}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>}
            </div>

            {/* Error Messages */}
            {error && <div id="url-error" className="flex items-start gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl" role="alert" aria-live="assertive">
                <svg className="w-5 h-5 text-[hsl(var(--color-error))] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[hsl(var(--color-error))]">
                  {error}
                </p>
              </div>}

            {previewError && !error && <div id="preview-error" className="flex items-start gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl" role="alert" aria-live="polite">
                <svg className="w-5 h-5 text-[hsl(var(--color-warning))] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[hsl(var(--color-warning))]">
                  {previewError}
                </p>
              </div>}
          </div>

          {/* Transformation Options */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
            {validationError && <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl" role="alert" aria-live="assertive">
                <svg className="w-5 h-5 text-[hsl(var(--color-error))] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[hsl(var(--color-error))]">
                  {validationError}
                </p>
              </div>}
            <h3 className="text-sm font-bold text-[hsl(var(--color-text))] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Transformations
            </h3>

            {/* Size Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="width" className="block text-xs font-semibold text-[hsl(var(--color-text))] mb-1.5">{t("width_px")}</label>
                <input id="width" type="number" value={width || ""} onChange={e => {
                setWidth(parseInt(e.target.value) || 0);
                if (validationError) setValidationError(null);
              }} placeholder="Original" className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:outline-none transition-colors" min="0" max="4000" />
              </div>
              <div>
                <label htmlFor="height" className="block text-xs font-semibold text-[hsl(var(--color-text))] mb-1.5">{t("height_px")}</label>
                <input id="height" type="number" value={height || ""} onChange={e => {
                setHeight(parseInt(e.target.value) || 0);
                if (validationError) setValidationError(null);
              }} placeholder="Original" className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:outline-none transition-colors" min="0" max="4000" />
              </div>
            </div>

            {/* Quality Slider */}
            <div>
              <label htmlFor="quality" className="block text-xs font-semibold text-[hsl(var(--color-text))] mb-1.5">{t("quality")}{quality > 0 ? `${quality}%` : "Original"}
              </label>
              <input id="quality" type="range" value={quality} onChange={e => {
              setQuality(parseInt(e.target.value));
              if (validationError) setValidationError(null);
            }} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" min="0" max="100" />
            </div>

            {/* Effect Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="checkbox" checked={grayscale} onChange={e => {
                setGrayscale(e.target.checked);
                if (validationError) setValidationError(null);
              }} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                <span className="text-sm font-medium text-[hsl(var(--color-text))]">
                  Grayscale
                </span>
              </label>

              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="checkbox" checked={sharpen} onChange={e => {
                setSharpen(e.target.checked);
                if (validationError) setValidationError(null);
              }} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                <span className="text-sm font-medium text-[hsl(var(--color-text))]">
                  Sharpen
                </span>
              </label>

              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="checkbox" checked={flip} onChange={e => {
                setFlip(e.target.checked);
                if (validationError) setValidationError(null);
              }} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                <span className="text-sm font-medium text-[hsl(var(--color-text))]">{t("flip_v")}</span>
              </label>

              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input type="checkbox" checked={flop} onChange={e => {
                setFlop(e.target.checked);
                if (validationError) setValidationError(null);
              }} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                <span className="text-sm font-medium text-[hsl(var(--color-text))]">{t("flip_h")}</span>
              </label>
            </div>

            {/* Blur Slider */}
            <div>
              <label htmlFor="blur" className="block text-xs font-semibold text-[hsl(var(--color-text))] mb-1.5">{t("blur")}{blur > 0 ? blur.toFixed(1) : "None"}
              </label>
              <input id="blur" type="range" value={blur} onChange={e => {
              setBlur(parseFloat(e.target.value));
              if (validationError) setValidationError(null);
            }} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-purple-500" min="0" max="10" step="0.5" />
            </div>

            {/* Rotation Selector */}
            <div>
              <label htmlFor="rotate" className="block text-xs font-semibold text-[hsl(var(--color-text))] mb-1.5">
                Rotation
              </label>
              <select id="rotate" value={rotate} onChange={e => {
              setRotate(parseInt(e.target.value));
              if (validationError) setValidationError(null);
            }} className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:outline-none transition-colors cursor-pointer">
                <option value="0">None</option>
                <option value="90">{t("90_right")}</option>
                <option value="180">180°</option>
                <option value="270">{t("270_left")}</option>
              </select>
            </div>
          </div>

          {/* Image Preview */}
          {url && <div className="space-y-3">
              <label className="block text-sm font-bold text-[hsl(var(--color-text))]">
                Preview
              </label>
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl overflow-hidden">
                {previewLoading && <div className="absolute inset-0 flex items-center justify-center">
                    <div className="space-y-3 text-center">
                      <div className="w-10 h-10 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
                      <p className="text-sm text-[hsl(var(--color-text-secondary))]">{t("loading_preview")}</p>
                    </div>
                  </div>}

                {!previewLoading && !previewUrl && !previewError && <div className="absolute inset-0 flex items-center justify-center text-[hsl(var(--color-text-secondary))]">
                    <div className="text-center space-y-2">
                      <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">{t("enter_a_valid_image_url")}</p>
                    </div>
                  </div>}

                {previewUrl && <img src={previewUrl} alt={t("image_preview")} className="w-full h-full object-cover animate-fade-in" />}

                {previewError && !previewLoading && <div className="absolute inset-0 flex items-center justify-center text-[hsl(var(--color-text-secondary))]">
                    <div className="text-center space-y-2">
                      <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm">{t("unable_to_load_preview")}</p>
                    </div>
                  </div>}
              </div>
            </div>}

          {/* Submit Button */}
          <button type="submit" disabled={loading || !url.trim()} className="btn-primary w-full" aria-label={loading ? t("submitting_job") : t("submit_job")}>
            {loading ? <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>{t("processing")}</span>
              </> : <span>{t("process_image")}</span>}
          </button>
        </form>

        {/* Success Message */}
        {showSuccess && <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl text-sm text-green-700 font-medium" role="status" aria-live="polite">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{t("job_submitted_successfully")}</span>
          </div>}
      </div>
    </section>;
}
  );
}
