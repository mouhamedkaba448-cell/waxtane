import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0 z-10">
      <Link to="/" className="text-xl font-extrabold text-orange-500">WAXTAN</Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/suggestions">💡 Suggestions</Link>
        {isAdmin && <Link to="/admin" className="font-semibold text-orange-500">🛠 Admin</Link>}
        {user ? (
          <>
            <span className="text-gray-500 hidden sm:inline">{profile?.username}</span>
            <button onClick={signOut} className="text-gray-600">Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/connexion">Connexion</Link>
            <Link to="/inscription" className="bg-orange-500 text-white px-3 py-1 rounded-full">S'inscrire</Link>
          </>
        )}
      </div>
    </nav>
  );
}
