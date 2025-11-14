/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Button from '@/components/Button';

interface ErrorStateProps {
  message: string;
  onReset: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onReset }) => {
  return (
    <div className="text-center animate-fade-in bg-red-50 border border-red-200 p-8 rounded-xl max-w-2xl mx-auto shadow-sm">
      <h2 className="text-2xl md:text-3xl font-extrabold mb-3 text-red-800">Something went wrong</h2>
      <p className="text-base md:text-lg text-red-700 mb-6">{message}</p>
      <Button variant="primary" onClick={onReset}>Try again</Button>
    </div>
  );
};

export default ErrorState;
