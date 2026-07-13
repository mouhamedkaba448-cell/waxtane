import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Suggestions() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    await supabase.from('suggestions').insert({ user_id: user?.id ?? null, content: content.trim() });
    setContent('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-2">💡 Suggestions aux développeurs</h1>
      <p className="text-gray-600 mb-4">Une idée pour améliorer WAXTAN ? Dis-nous tout.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="Ta suggestion..."
          className="w-full border rounded-lg px-3 py-2"
        />
        <button type="submit" className="bg-orange-500 text-white rounded-lg py-2 px-4 font-semibold">
          Envoyer
        </button>
        {sent && <p className="text-green-600">Merci pour ta suggestion !</p>}
      </form>
    </div>
  );
}
