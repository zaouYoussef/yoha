import React, { useState } from 'react';
import { I } from '../icons/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth, DASHBOARD_REQUIRED_ROLE, AUTH_ROLES } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/AppContexts.jsx';

function roleLabelForDashboard(viewName) {
  if (viewName === 'admin') return 'gérant';
  if (viewName === 'delivery') return 'livreur';
  if (viewName === 'restaurant-dash') return 'restaurant';
  return 'professionnel';
}

export function AuthPage({ redirect, goto, goHome }) {
  const { login, register, logout, user, ROLE_LABELS } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const requiredRole = redirect ? DASHBOARD_REQUIRED_ROLE[redirect] : null;
  const wrongAccount =
    user && requiredRole && user.role !== requiredRole;

  /** Après connexion / inscription : tableau de bord pro ou accueil client. */
  const ROLE_DEFAULT_VIEW = {
    [AUTH_ROLES.admin]: 'admin',
    [AUTH_ROLES.courier]: 'delivery',
    [AUTH_ROLES.restaurant]: 'restaurant-dash',
    [AUTH_ROLES.client]: 'home',
  };

  const finishSuccess = (sessionUser) => {
    const opts = { session: sessionUser };
    if (redirect === 'my-orders') {
      if (sessionUser.role !== 'client') {
        toast.push({
          title: 'Espace client',
          desc: 'L’historique des commandes est réservé aux comptes client.',
          type: 'default',
          duration: 4000,
        });
        goHome();
        return;
      }
      goto('my-orders', {}, opts);
      return;
    }
    if (redirect && DASHBOARD_REQUIRED_ROLE[redirect]) {
      const need = DASHBOARD_REQUIRED_ROLE[redirect];
      if (sessionUser.role !== need) {
        toast.push({
          title: 'Compte incompatible',
          desc: `Cet espace est réservé aux comptes « ${ROLE_LABELS[need] || need} ».`,
          type: 'default',
          duration: 4200,
        });
        goHome();
        return;
      }
      goto(redirect, {}, opts);
      return;
    }
    const dest = ROLE_DEFAULT_VIEW[sessionUser.role] || 'home';
    goto(dest, {}, opts);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = login({ email, password });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    finishSuccess(res.user);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = register({ email, password, displayName });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    toast.push({ title: 'Compte créé', desc: 'Bienvenue sur YoHa.', type: 'success' });
    finishSuccess(res.user);
  };

  return (
    <div className="page-enter min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={goHome}
          className="cursor-grow inline-flex items-center gap-2 mb-6 text-sm text-ink-500 hover:text-brand-500 transition"
        >
          <I.Left size={18}/> Retour
        </button>

        <div className="rounded-3xl border border-ink-200/70 bg-white/90 dark:bg-ink-900/80 dark:border-ink-800 shadow-card p-6 sm:p-8">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-center">
            {tab === 'login' ? 'Connexion' : 'Créer un compte client'}
          </h1>
          <p className="mt-2 text-center text-sm text-ink-500 dark:text-ink-400">
            {tab === 'login'
              ? 'Connectez-vous avec votre compte client ou avec les identifiants professionnels qui vous ont été communiqués.'
              : 'Créez un compte client pour retrouver vos infos. Les accès gérant, livreur et restaurant ne s’ouvrent pas en ligne : utilisez l’e-mail et le mot de passe fournis par YoHa.'}
          </p>

          {redirect && (
            <div className="mt-4 rounded-2xl bg-brand-500/10 border border-brand-500/25 px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
              Connexion requise pour l’espace <strong>{roleLabelForDashboard(redirect)}</strong>.
            </div>
          )}

          {wrongAccount && (
            <div className="mt-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-4 py-3 text-sm">
              <p className="text-ink-800 dark:text-ink-100">
                Vous êtes connecté en tant que <strong>{ROLE_LABELS[user.role]}</strong>. Utilisez un compte{' '}
                <strong>{ROLE_LABELS[requiredRole]}</strong> ou déconnectez-vous.
              </p>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setErr('');
                }}
                className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
              >
                Se déconnecter
              </button>
            </div>
          )}

          <div className="mt-6 flex rounded-2xl bg-ink-100/80 dark:bg-ink-800/80 p-1">
            <button
              type="button"
              onClick={() => { setTab('login'); setErr(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${tab === 'login' ? 'bg-white dark:bg-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErr(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${tab === 'register' ? 'bg-white dark:bg-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              Inscription
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">E-mail</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition"
                  placeholder="vous@exemple.ma"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Mot de passe</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition"
                  placeholder="••••••••"
                />
              </label>
              {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Nom affiché</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition"
                  placeholder="Prénom Nom"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">E-mail</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition"
                  placeholder="vous@exemple.ma"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Mot de passe</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition"
                  placeholder="Au moins 4 caractères"
                />
              </label>
              {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-[11px] text-center text-ink-400 dark:text-ink-500 leading-relaxed">
            Connexion Pro (mot de passe démo <code className="px-1 rounded bg-ink-100 dark:bg-ink-800">demo123</code>) :{' '}
            <span className="block sm:inline mt-1">admin@yoha.ma · livreur@yoha.ma · resto@yoha.ma — client test : client@yoha.ma</span>
          </p>
        </div>
      </div>
    </div>
  );
}
