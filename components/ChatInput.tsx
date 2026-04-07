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
    <form onSubmit={handleSubmit} className="flex space-x-3 items-center">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        placeholder="Tell me about your ideal trip..."
        className="flex-1 px-6 py-4 bg-slate-100/50 border border-transparent focus:border-indigo-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 rounded-2xl transition-all duration-200 disabled:opacity-50 text-slate-800 placeholder-slate-400"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:scale-100 transition-all duration-200 shadow-lg shadow-indigo-200"
      >
        Send
      </button>
    </form>
  );
}
