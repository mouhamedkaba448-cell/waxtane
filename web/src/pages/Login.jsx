import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Se connecter</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Mot de passe (8 caractères min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full border rounded-lg px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-orange-500 text-white rounded-lg py-2 font-semibold">
          Connexion
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        Pas de compte ? <Link to="/inscription" className="text-orange-500 font-medium">S'inscrire</Link>
      </p>
    </div>
  );
}
