/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ErrorStateProps {
  message: string;
  onReset: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onReset }) => {
  return (
    <div className="text-center animate-fade-in bg-red-50 border border-red-200 p-8 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-4 text-red-800">An Error Occurred</h2>
      <p className="text-lg text-red-700 mb-6">{message}</p>
      <button
        onClick={onReset}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorState;

