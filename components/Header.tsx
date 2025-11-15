import React from "react"

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 text-center">
      <div className="flex items-center justify-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight md:leading-[1.12] pb-1 bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
          Adorn AI
        </h1>
      </div>
      <p className="mt-2 text-sm md:text-base text-[hsl(var(--text-muted))] max-w-3xl mx-auto">
        Upload jewelry and a scene, then click to place it. AI composes a photorealistic result.
      </p>
    </header>
  )
}

export default Header
