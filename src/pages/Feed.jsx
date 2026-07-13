import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const activeSlug = params.get('categorie');

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  async function loadPosts() {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, categories(name, slug), comments(count), votes(value, user_id)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (activeSlug) {
      const cat = categories.find((c) => c.slug === activeSlug);
      if (cat) query = query.eq('category_id', cat.id);
    }

    const { data } = await query;
    const enriched = (data || []).map((p) => ({
      ...p,
      commentCount: p.comments?.[0]?.count ?? 0,
      likeCount: p.votes.filter((v) => v.value === 1).length,
      dislikeCount: p.votes.filter((v) => v.value === -1).length,
      myVote: user ? p.votes.find((v) => v.user_id === user.id)?.value : null,
    }));
    setPosts(enriched);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
        <button
          onClick={() => setParams({})}
          className={`px-3 py-1 rounded-full whitespace-nowrap ${!activeSlug ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
        >
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParams({ categorie: c.slug })}
            className={`px-3 py-1 rounded-full whitespace-nowrap ${activeSlug === c.slug ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {user && (
        <Link to="/nouveau-post" className="block text-center bg-orange-500 text-white rounded-lg py-2 mb-4 font-semibold">
          + Créer un post
        </Link>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 text-center">Aucun post pour l'instant.</p>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onChange={loadPosts} />)
      )}
    </div>
  );
}
