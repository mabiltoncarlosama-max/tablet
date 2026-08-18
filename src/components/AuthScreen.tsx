import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from '../lib/firebase';
import { BookOpen, Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido inhabilitada.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este correo electrónico.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'Se cerró la ventana de autenticación de Google.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes.';
      default:
        return 'Ocurrió un error al autenticar. Por favor intenta de nuevo.';
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setError(getFriendlyErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Por favor ingresa tu nombre.');
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (userCred.user && name.trim()) {
          await updateProfile(userCred.user, {
            displayName: name.trim(),
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Email Auth error:', err);
      setError(getFriendlyErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FAF9F6] text-[#262626] flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] shadow-xl p-8 flex flex-col relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#262626]" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#F2F0EB] border border-[#E5E2D9] text-[#262626] flex items-center justify-center mb-3 shadow-2xs">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[#262626]">
            Cuaderno Digital
          </h1>
          <p className="text-xs text-[#717171] mt-1 max-w-xs">
            Acceso seguro y sincronización en la nube para tus apuntes, bocetos y notas.
          </p>
        </div>

        {/* Per-user Isolation Badge */}
        <div className="mb-6 px-3.5 py-2 rounded-xl bg-[#F2F0EB] border border-[#E5E2D9] flex items-center gap-2.5 text-xs text-[#4A5568]">
          <ShieldCheck className="w-4 h-4 text-[#262626] shrink-0" />
          <span>Tus cuadernos están 100% aislados y protegidos para tu cuenta.</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google One-Click Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-[#E5E2D9] hover:border-[#262626] bg-white hover:bg-[#F2F0EB] text-[#262626] font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-2xs disabled:opacity-60 mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#E5E2D9]" />
          <span className="text-[11px] font-semibold text-[#A09E96] uppercase tracking-wider">
            o con correo
          </span>
          <div className="flex-1 h-px bg-[#E5E2D9]" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                Nombre o Alias
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A09E96] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E2D9] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#262626]/20 focus:border-[#262626] transition-all text-[#262626]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#4A5568] mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A09E96] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E2D9] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#262626]/20 focus:border-[#262626] transition-all text-[#262626]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5568] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A09E96] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E2D9] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#262626]/20 focus:border-[#262626] transition-all text-[#262626]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 px-4 rounded-xl bg-[#262626] hover:bg-[#171717] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span>Cargando...</span>
            ) : (
              <>
                <span>{isRegister ? 'Crear Cuenta y Entrar' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-6 pt-4 border-t border-[#E5E2D9] text-center">
          <p className="text-xs text-[#717171]">
            {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta aún?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="font-bold text-[#262626] hover:underline"
            >
              {isRegister ? 'Inicia sesión aquí' : 'Regístrate gratis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
