'use client';

import { useState, FormEvent } from 'react';

export default function ChatInput({
  onSend,
  isLoading,
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        placeholder="Scrivi un messaggio..."
        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900 bg-gray-50"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        Invia
      </button>
    </form>
  );
}
