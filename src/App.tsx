import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import GuestDashboard from './pages/GuestDashboard';

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  if (!offline) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      backgroundColor: '#1f2937', color: '#d1d5db',
      fontSize: '11px', textAlign: 'center', padding: '6px 12px',
      borderBottom: '1px solid #374151',
    }}>
      Sin conexion - mostrando datos guardados
    </div>
  );
}

function AppInner() {
  const { session, profile, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <img
          src="https://twsmiqxywmsskxbejykb.supabase.co/storage/v1/object/public/avatars/LogoActual.jpg"
          alt="FPTrainingPro"
          style={{ width: '200px', borderRadius: '16px' }}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#EAB308',
                display: 'inline-block',
                animation: 'fp-bounce 1.2s infinite ease-in-out',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <p style={{ color: '#EAB308', fontSize: '13px', letterSpacing: '0.05em' }}>Cargando...</p>
        <style>{`
          @keyframes fp-bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!session || !profile) return <LoginPage />;

  if (profile.rol === 'entrenador_administrador') return <AdminDashboard />;
  if (profile.rol === 'entrenador') return <TrainerDashboard />;
  // alumno with no trainer = guest
  if (profile.rol === 'alumno' && !profile.entrenador_id) return <GuestDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="dark">
        <OfflineBanner />
        <AppInner />
      </div>
    </AuthProvider>
  );
}
