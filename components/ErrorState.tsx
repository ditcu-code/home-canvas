import Button from '@/components/Button'
import React from 'react'

interface ErrorStateProps {
  message: string
  onReset: () => void
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onReset }) => {
  return (
    <div className="text-center animate-fade-in p-8 rounded-xl max-w-2xl mx-auto shadow-sm alert-error">
      <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Something went wrong</h2>
      <p className="text-base md:text-lg mb-6">{message}</p>
      <Button variant="primary" onClick={onReset}>
        Try again
      </Button>
    </div>
  )
}

export default ErrorState
