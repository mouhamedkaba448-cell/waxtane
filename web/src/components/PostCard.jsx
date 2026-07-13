import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function PostCard({ post, onChange }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  // Envoie ou met à jour le vote de l'utilisateur connecté (1 = like, -1 = unlike)
  async function vote(value) {
    if (!user) return alert('Connecte-toi pour voter.');
    setBusy(true);
    const existing = post.myVote;
    if (existing === value) {
      // Annule le vote si on reclique sur le même bouton
      await supabase.from('votes').delete().eq('user_id', user.id).eq('post_id', post.id);
    } else {
      await supabase.from('votes').upsert(
        { user_id: user.id, post_id: post.id, value },
        { onConflict: 'user_id,post_id' }
      );
    }
    setBusy(false);
    onChange && onChange();
  }

  async function report() {
    if (!user) return alert('Connecte-toi pour signaler un post.');
    const reason = prompt('Pourquoi signales-tu ce post ?');
    if (!reason) return;
    await supabase.from('reports').insert({ user_id: user.id, post_id: post.id, reason });
    alert('Post signalé, merci.');
  }

  function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    alert('Lien copié : ' + url);
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="text-xs text-gray-500 mb-1">
        {post.categories?.name} • {new Date(post.created_at).toLocaleString('fr-FR')}
      </div>
      <Link to={`/post/${post.id}`}>
        <h2 className="text-lg font-bold mb-2">{post.title}</h2>
      </Link>
      <p className="text-gray-700 whitespace-pre-wrap mb-3 line-clamp-6">{post.content}</p>
      {post.image_url && (
        <img src={post.image_url} alt="" className="rounded-lg max-h-96 w-full object-cover mb-3" />
      )}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <button disabled={busy} onClick={() => vote(1)} className={post.myVote === 1 ? 'text-orange-500 font-bold' : ''}>
          👍 {post.likeCount ?? 0}
        </button>
        <button disabled={busy} onClick={() => vote(-1)} className={post.myVote === -1 ? 'text-blue-500 font-bold' : ''}>
          👎 {post.dislikeCount ?? 0}
        </button>
        <Link to={`/post/${post.id}`}>💬 {post.commentCount ?? 0}</Link>
        <button onClick={share}>🔗 Partager</button>
        <button onClick={report}>🚩 Signaler</button>
      </div>
    </div>
  );
}
