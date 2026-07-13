import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  async function loadAll() {
    const { data: r } = await supabase
      .from('reports')
      .select('*, posts(title), comments(content)')
      .order('created_at', { ascending: false });
    setReports(r || []);

    const { data: s } = await supabase
      .from('suggestions')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });
    setSuggestions(s || []);

    const { data: p } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(p || []);
  }

  async function deletePost(postId) {
    await supabase.from('posts').update({ is_deleted: true }).eq('id', postId);
    loadAll();
  }

  async function deleteComment(commentId) {
    await supabase.from('comments').update({ is_deleted: true }).eq('id', commentId);
    loadAll();
  }

  async function dismissReport(reportId) {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
    loadAll();
  }

  async function toggleBan(profileId, current) {
    await supabase.from('profiles').update({ is_banned: !current }).eq('id', profileId);
    loadAll();
  }

  if (loading) return <p className="text-center mt-8">Chargement...</p>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🛠 Panneau admin</h1>

      <div className="flex gap-2 mb-4">
        {['reports', 'suggestions', 'users'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-full ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
          >
            {t === 'reports' ? 'Signalements' : t === 'suggestions' ? 'Suggestions' : 'Utilisateurs'}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.filter((r) => r.status === 'pending').length === 0 && <p>Aucun signalement en attente.</p>}
          {reports.filter((r) => r.status === 'pending').map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-3">
              <p className="text-sm text-gray-500 mb-1">Raison : {r.reason}</p>
              <p className="mb-2">{r.posts ? `Post : "${r.posts.title}"` : `Commentaire : "${r.comments?.content}"`}</p>
              <div className="flex gap-2">
                {r.post_id && (
                  <button onClick={() => deletePost(r.post_id)} className="text-red-600 text-sm">Supprimer le post</button>
                )}
                {r.comment_id && (
                  <button onClick={() => deleteComment(r.comment_id)} className="text-red-600 text-sm">Supprimer le commentaire</button>
                )}
                <button onClick={() => dismissReport(r.id)} className="text-gray-500 text-sm">Ignorer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-3">
          {suggestions.length === 0 && <p>Aucune suggestion pour l'instant.</p>}
          {suggestions.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow p-3">
              <p className="text-xs text-gray-500 mb-1">{s.profiles?.username}</p>
              <p>{s.content}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
              <span>{p.username} {p.is_admin && '👑'} {p.is_banned && '🚫'}</span>
              {!p.is_admin && (
                <button onClick={() => toggleBan(p.id, p.is_banned)} className="text-sm text-red-600">
                  {p.is_banned ? 'Débannir' : 'Bannir'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
