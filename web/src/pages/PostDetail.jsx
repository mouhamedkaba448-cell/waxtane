import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    const { data: p } = await supabase
      .from('posts')
      .select('*, categories(name, slug), comments(count), votes(value, user_id)')
      .eq('id', id)
      .single();
    if (p) {
      setPost({
        ...p,
        commentCount: p.comments?.[0]?.count ?? 0,
        likeCount: p.votes.filter((v) => v.value === 1).length,
        dislikeCount: p.votes.filter((v) => v.value === -1).length,
        myVote: user ? p.votes.find((v) => v.user_id === user.id)?.value : null,
      });
    }

    const { data: c } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('post_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    setComments(c || []);
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!user) return alert('Connecte-toi pour commenter.');
    if (!newComment.trim()) return;
    await supabase.from('comments').insert({ post_id: id, user_id: user.id, content: newComment.trim() });
    setNewComment('');
    load();
  }

  if (!post) return <p className="text-center mt-8">Chargement...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <PostCard post={post} onChange={load} />

      <h2 className="text-lg font-bold mt-6 mb-3">Commentaires ({comments.length})</h2>

      <form onSubmit={submitComment} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={user ? 'Écrire un commentaire...' : 'Connecte-toi pour commenter'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button type="submit" disabled={!user} className="bg-orange-500 text-white px-4 rounded-lg font-semibold disabled:opacity-50">
          Envoyer
        </button>
      </form>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-lg shadow-sm p-3">
            <div className="text-xs text-gray-500 mb-1">
              {c.profiles?.username} • {new Date(c.created_at).toLocaleString('fr-FR')}
            </div>
            <p className="whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
