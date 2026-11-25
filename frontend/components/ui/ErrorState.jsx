import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Editorial Error State Component
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry = null,
  retryLabel = 'Try Again',
  className = '',
}) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center bg-white border border-[#FEE2E2] rounded-2xl ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#B91C1C] border border-[#FECDD3] flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-[#171717]">{title}</h4>
      <p className="mt-1 text-xs text-[#6B665E] max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
