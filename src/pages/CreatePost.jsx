import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function CreatePost() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data || []);
      if (data?.length) setCategoryId(data[0].id);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return setError('Connecte-toi pour publier.');
    setSubmitting(true);
    setError('');

    let imageUrl = null;
    if (image) {
      const path = `${user.id}/${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage.from('post-images').upload(path, image);
      if (uploadError) {
        setError("Erreur lors de l'envoi de l'image : " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({ user_id: user.id, category_id: categoryId, title, content, image_url: imageUrl })
      .select()
      .single();

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      navigate(`/post/${newPost.id}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Créer un post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="Écris ton post ici (pas de limite de texte)..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={8}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={submitting} type="submit" className="w-full bg-orange-500 text-white rounded-lg py-2 font-semibold">
          {submitting ? 'Publication...' : 'Publier'}
        </button>
      </form>
    </div>
  );
}
