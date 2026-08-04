'use client';

import React, { useState, useEffect } from 'react';
import { I } from '../icons/Icons.jsx';
import { useAuth, DASHBOARD_REQUIRED_ROLE, AUTH_ROLES, getStaffHomePath } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/AppContexts.jsx';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import { useRouter } from 'next/navigation';

function roleLabelForDashboard(viewName) {
  if (viewName === 'admin') return 'gérant';
  if (viewName === 'delivery') return 'livreur';
  if (viewName === 'restaurant-dash') return 'restaurant';
  return 'professionnel';
}

export function AuthPage({ redirect, goto, goHome }) {
  const { login, register, loginWithGoogle, logout, user, ROLE_LABELS } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const requiredRole = redirect ? DASHBOARD_REQUIRED_ROLE[redirect] : null;
  const wrongAccount = user && requiredRole && user.role !== requiredRole;

  const ROLE_DEFAULT_VIEW = {
    [AUTH_ROLES.admin]: 'admin',
    [AUTH_ROLES.courier]: 'delivery',
    [AUTH_ROLES.restaurant]: 'restaurant-dash',
    [AUTH_ROLES.client]: 'home',
  };

  useEffect(() => {
    if (!user || wrongAccount) return;
    const home = getStaffHomePath(user.role);
    if (home) router.replace(home);
  }, [user, wrongAccount, router]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = await login({ login: loginId, email: loginId, password });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    finishSuccess(res.user);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = await register({ email, password, displayName });
    setLoading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    toast.push({ title: 'Compte créé', desc: 'Bienvenue sur YoHa.', type: 'success' });
    finishSuccess(res.user);
  };

  const handleGoogle = async () => {
    setErr('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await loginWithGoogle(idToken);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      toast.push({ title: 'Connecté', desc: 'Bienvenue sur YoHa.', type: 'success' });
      finishSuccess(res.user);
    } catch (e) {
      const msg = e?.code === 'auth/popup-closed-by-user'
        ? 'Connexion Google annulée.'
        : e?.message || 'Connexion Google impossible.';
      setErr(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page-enter relative min-h-[calc(100dvh-8rem)] flex flex-col overflow-hidden bg-white dark:bg-ink-950">
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(80%_70%_at_20%_0%,rgba(249,115,22,0.38),transparent_55%),radial-gradient(55%_50%_at_90%_50%,rgba(234,88,12,0.2),transparent_50%)]"
        />
        <div className="relative max-w-md mx-auto px-4 pt-6 pb-10 sm:pt-8 sm:pb-12">
          <button
            type="button"
            onClick={goHome}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold transition"
          >
            <I.Left size={16} /> Retour
          </button>
          <p className="mt-7 font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-200 via-brand-400 to-orange-600 text-4xl sm:text-5xl tracking-tight leading-none">
            YoHa
          </p>
          <h1 className="mt-3 font-display font-bold text-[clamp(1.75rem,5vw,2.4rem)] tracking-tight leading-[1.05]">
            {tab === 'login' ? 'Bon retour' : 'Créer un compte'}
          </h1>
          <p className="mt-2.5 text-sm text-white/60 font-medium max-w-sm leading-relaxed">
            {tab === 'login'
              ? 'E-mail ou identifiant, et ton mot de passe YoHa.'
              : 'Compte client pour retrouver tes commandes partout. Accès pro : identifiants fournis par YoHa.'}
          </p>
        </div>
      </section>

      <div className="relative flex-1 flex flex-col items-center px-4 -mt-5 pb-12">
        <div className="relative w-full max-w-md rounded-[1.5rem] border border-ink-100 dark:border-white/8 bg-white dark:bg-ink-900 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] p-5 sm:p-7">
          {redirect && (
            <div className="mb-4 rounded-2xl bg-ink-50 dark:bg-ink-950 border border-ink-100 dark:border-white/8 px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
              Connexion requise pour l’espace <strong className="font-bold">{roleLabelForDashboard(redirect)}</strong>.
            </div>
          )}

          {wrongAccount && (
            <div className="mb-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 px-4 py-3 text-sm">
              <p className="text-ink-800 dark:text-ink-100">
                Connecté en tant que <strong>{ROLE_LABELS[user.role]}</strong>. Utilise un compte{' '}
                <strong>{ROLE_LABELS[requiredRole]}</strong> ou déconnecte-toi.
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

          <div className="flex rounded-2xl bg-ink-100/80 dark:bg-ink-950 p-1">
            <button
              type="button"
              onClick={() => { setTab('login'); setErr(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === 'login'
                  ? 'bg-white dark:bg-ink-900 shadow-sm text-ink-950 dark:text-white'
                  : 'text-ink-500'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErr(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === 'register'
                  ? 'bg-white dark:bg-ink-900 shadow-sm text-ink-950 dark:text-white'
                  : 'text-ink-500'
              }`}
            >
              Inscription
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="cursor-pointer mt-5 w-full inline-flex items-center justify-center gap-3 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-950 px-4 py-3 text-sm font-semibold text-ink-700 dark:text-ink-200 hover:border-brand-400/50 disabled:opacity-60 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
          </button>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-ink-200 dark:bg-ink-800" />
            <span className="text-xs text-ink-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-ink-200 dark:bg-ink-800" />
          </div>

          {tab === 'login' ? (
            <form key="login" onSubmit={handleLogin} className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">Identifiant</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-base sm:text-sm text-ink-950 dark:text-white"
                  placeholder="E-mail ou nom d'utilisateur"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">Mot de passe</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-base sm:text-sm text-ink-950 dark:text-white"
                  placeholder="••••••••"
                />
              </label>
              {err && <p className="text-sm font-medium text-red-600 dark:text-red-400">{err}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form key="register" onSubmit={handleRegister} className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">Nom affiché</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-base sm:text-sm text-ink-950 dark:text-white"
                  placeholder="Prénom Nom"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">E-mail</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-base sm:text-sm text-ink-950 dark:text-white"
                  placeholder="vous@exemple.ma"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-ink-600 dark:text-ink-300 tracking-tight">Mot de passe</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                  className="w-full px-4 py-3 rounded-xl bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 outline-none focus:border-brand-500 transition text-base sm:text-sm text-ink-950 dark:text-white"
                  placeholder="Au moins 10 caractères"
                />
              </label>
              {err && <p className="text-sm font-medium text-red-600 dark:text-red-400">{err}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
