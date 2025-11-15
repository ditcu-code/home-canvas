/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 text-center">
      <div className="flex items-center justify-center">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight md:leading-[1.12] pb-1 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
          Jewelry Canvas
        </h1>
      </div>
      <p className="mt-2 text-sm md:text-base text-zinc-600 max-w-3xl mx-auto">
        Upload jewelry and a scene, then click to place it. Gemini composes a photorealistic result.
      </p>
    </header>
  );
};

export default Header;
