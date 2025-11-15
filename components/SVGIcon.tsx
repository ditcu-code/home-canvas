import React from 'react';

export interface SVGIconProps {
  d: string;
  className?: string;
  strokeWidth?: number;
  viewBox?: string;
}

export default function SVGIcon({ d, className, strokeWidth = 2, viewBox = '0 0 24 24' }: SVGIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'h-6 w-6'}
      fill="none"
      viewBox={viewBox}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
    </svg>
  );
}

export interface IconProps { className?: string }

export const CloseIcon: React.FC<IconProps> = ({ className }) => (
  <SVGIcon d="M6 18L18 6M6 6l12 12" className={className} />
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ className }) => (
  <SVGIcon d="M15 19l-7-7 7-7" className={className} />
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className }) => (
  <SVGIcon d="M9 5l7 7-7 7" className={className} />
);

export const UploadIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || 'h-12 w-12 text-zinc-500 mx-auto mb-2'}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || 'h-4 w-4'}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || 'h-5 w-5 mr-2 flex-shrink-0'}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

export const RetryIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || 'h-4 w-4'}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 19A9 9 0 1019 5" />
  </svg>
);
