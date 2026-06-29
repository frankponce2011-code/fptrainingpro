import { useState, useEffect, useCallback } from 'react';
import {
  Users, LogOut, Edit3, Activity, Apple, Dumbbell,
  BookOpen, CheckCircle2, User,
  Plus, Trash2, Search, ArrowLeft, X, Save, Camera,
  Shield, Newspaper,
} from 'lucide-react';
import { supabase, Profile, PlantillaRutina } from '../lib/supabase';
import { createUser, deleteUser as deleteUserApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ProfileSetupPage from './ProfileSetupPage';
import MacroCalculator from './MacroCalculator';
import ExerciseLibrary from './ExerciseLibrary';
import EvaluacionList from './EvaluacionList';
import DietaDetail from './DietaDetail';
import PlantillaList from './PlantillaList';
import PlantillaBuilder from './PlantillaBuilder';
import AsignarRutina from './AsignarRutina';
import FitnessContent from './FitnessContent';
import NotificationBell from '../lib/NotificationBell';
import AIChatModal from './AIChatModal';

type View = 'home' | 'users' | 'eval-select' | 'eval-history' |
  'dieta-select' |
  'rutinas' | 'rutinas-builder' | 'assign-rutinas' | 'macros' | 'exercises' | 'fitness' |
  'add-user' | 'edit-user' | 'delete-confirm';

export default function TrainerDashboard() {
  const { profile: trainerProfile, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<View>('home');
  const [editingProfile, setEditingProfile] = useState(false);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaRutina | null>(null);

  const [formNombre, setFormNombre] = useState('');
  const [formApellido, setFormApellido] = useState('');
  const [formEdad, setFormEdad] = useState('');
  const [formEstatura, setFormEstatura] = useState('');
  const [formSexo, setFormSexo] = useState('masculino');
  const [formEmail, setFormEmail] = useState('');
  const [formFoto, setFormFoto] = useState<File | null>(null);
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!trainerProfile) return;
    setLoadingData(true);
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'alumno')
      .eq('entrenador_id', trainerProfile.id)
      .order('created_at', { ascending: false });
    setStudents(data || []);
    setLoadingData(false);
  }, [trainerProfile]);

  useEffect(() => {
    if (view === 'users' || view === 'eval-select' || view === 'dieta-select') {
      loadStudents();
    }
  }, [view, loadStudents]);

  if (editingProfile) return <ProfileSetupPage isEditing onDone={() => { setEditingProfile(false); refreshProfile(); }} />;
  if (view === 'macros') return <MacroCalculator onClose={() => setView('home')} />;
  if (view === 'exercises') return <ExerciseLibrary onClose={() => setView('home')} />;
  if (view === 'eval-history' && selectedAlumno) return <EvaluacionList alumno={selectedAlumno} onBack={() => setView('eval-select')} />;
  if (view === 'dieta-select' && selectedAlumno) return <DietaDetail alumno={selectedAlumno} onBack={() => { setSelectedAlumno(null); setView('home'); }} />;
  if (view === 'rutinas') return (
    <PlantillaList
      onBack={() => setView('home')}
      onCreate={() => { setSelectedPlantilla(null); setView('rutinas-builder'); }}
      onEdit={p => { setSelectedPlantilla(p); setView('rutinas-builder'); }}
    />
  );
  if (view === 'rutinas-builder') return (
    <PlantillaBuilder
      plantilla={selectedPlantilla}
      onBack={() => setView('rutinas')}
      onSaved={p => { setSelectedPlantilla(p); }}
    />
  );
  if (view === 'assign-rutinas') return <AsignarRutina onBack={() => setView('home')} />;
  if (view === 'fitness') return <FitnessContent onBack={() => setView('home')} />;

  async function uploadFoto(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
  }

  async function deleteUser(profile: Profile) {
    setDeleting(true);
    setDeleteError('');
    const { error } = await deleteUserApi(profile.id);
    setDeleting(false);
    if (error) { setDeleteError(error); return; }
    setDeleteTarget(null);
    setView('users');
    loadStudents();
  }

  function openAddUser() {
    setFormNombre(''); setFormApellido(''); setFormEdad(''); setFormEstatura('');
    setFormSexo('masculino'); setFormEmail('');
    setFormFoto(null); setFormFotoPreview(null); setFormError(''); setFormSuccess(false);
    setView('add-user');
  }

  function openEditUser(p: Profile) {
    setFormNombre(p.nombre); setFormApellido(p.apellido);
    setFormEdad(p.edad?.toString() || '');
    setFormEstatura(p.estatura?.toString() || '');
    setFormSexo(p.sexo || 'masculino');
    setFormEmail('');
    setFormFoto(null); setFormFotoPreview(p.foto_url || null);
    setFormError(''); setFormSuccess(false);
    setSelectedAlumno(p);
    setView('edit-user');
  }

  async function handleSaveUser(isEdit: boolean) {
    setFormError(''); setFormSaving(true);
    try {
      if (!formNombre.trim() || !formApellido.trim()) throw new Error('Nombre y apellido son obligatorios');
      let foto_url = formFotoPreview || '';
      if (isEdit && selectedAlumno) {
        if (formFoto) foto_url = await uploadFoto(formFoto, selectedAlumno.id);
        const { error } = await supabase.from('perfiles').update({
          nombre: formNombre.trim(), apellido: formApellido.trim(),
          edad: formEdad ? parseInt(formEdad) : null,
          estatura: formEstatura ? parseFloat(formEstatura) : null,
          sexo: formSexo, foto_url,
        }).eq('id', selectedAlumno.id);
        if (error) throw error;
      } else {
        if (!formEmail.trim()) throw new Error('El correo electrónico es obligatorio');
        const defaultPassword = 'Fp123456';
        const { error: createError } = await createUser({
          email: formEmail.trim(),
          password: defaultPassword,
          nombre: formNombre.trim(),
          apellido: formApellido.trim(),
          edad: formEdad || undefined,
          estatura: formEstatura || undefined,
          sexo: formSexo,
          rol: 'alumno',
          foto_url: foto_url || undefined,
          entrenador_id: trainerProfile?.id || null,
        });
        if (createError) throw new Error(createError);
      }
      setFormSuccess(true);
      setTimeout(() => { setFormSuccess(false); setView('users'); }, 800);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Error al guardar');
    } finally {
      setFormSaving(false);
    }
  }

  const displayName = `${trainerProfile?.nombre || ''} ${trainerProfile?.apellido || ''}`.trim();
  const initials = `${trainerProfile?.nombre?.[0] || ''}${trainerProfile?.apellido?.[0] || ''}`.toUpperCase();
  const filteredStudents = students.filter(p =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = [
    { key: 'users', icon: Users, label: 'Mis Alumnos', color: 'from-blue-600 to-blue-700' },
    { key: 'eval-select', icon: Activity, label: 'Evaluaciones', color: 'from-cyan-600 to-cyan-700' },
    { key: 'dieta-select', icon: Apple, label: 'Enviar Dietas', color: 'from-green-600 to-green-700' },
    { key: 'rutinas', icon: Dumbbell, label: 'Crear Rutinas', color: 'from-red-600 to-red-700' },
    { key: 'assign-rutinas', icon: CheckCircle2, label: 'Asignar Rutinas', color: 'from-yellow-600 to-yellow-700' },
    { key: 'exercises', icon: BookOpen, label: 'Biblioteca de Ejercicios', color: 'from-purple-600 to-purple-700' },
    { key: 'fitness', icon: Newspaper, label: 'Contenido Fitness', color: 'from-teal-600 to-teal-700' },
  ];

  if (view === 'add-user' || view === 'edit-user') {
    const isEdit = view === 'edit-user';
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('users')} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-sm font-bold text-white">{isEdit ? 'Editar' : 'Agregar'} Alumno</h2>
          </div>
        </header>
        <main className="flex-1 px-4 py-4 pb-28 overflow-y-auto">
          {formError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">{formError}</div>}
          {formSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-3 mb-4">Guardado correctamente</div>}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
              {formFotoPreview
                ? <img src={formFotoPreview} alt="" className="w-full h-full object-cover" />
                : <User size={24} className="text-gray-600" />}
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 border-dashed rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-500 cursor-pointer transition-colors">
              <Camera size={16} /> Foto (opcional)
              <input type="file" accept="image/*" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setFormFoto(f); setFormFotoPreview(URL.createObjectURL(f)); }
              }} className="hidden" />
            </label>
            {formFotoPreview && (
              <button onClick={() => { setFormFoto(null); setFormFotoPreview(null); }} className="text-gray-500 hover:text-red-400">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre</label>
                <input value={formNombre} onChange={e => setFormNombre(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Apellido</label>
                <input value={formApellido} onChange={e => setFormApellido(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Edad</label>
                <input type="number" value={formEdad} onChange={e => setFormEdad(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Estatura (cm)</label>
                <input type="number" step="0.1" value={formEstatura} onChange={e => setFormEstatura(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Sexo</label>
              <div className="flex gap-2">
                {['masculino', 'femenino'].map(s => (
                  <button key={s} type="button" onClick={() => setFormSexo(s)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors ${formSexo === s ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'}`}>
                    {s === 'masculino' ? 'Masculino' : 'Femenino'}
                  </button>
                ))}
              </div>
            </div>
            {!isEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Correo</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
            )}
          </div>
        </main>
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
          <button onClick={() => handleSaveUser(isEdit)} disabled={formSaving}
            className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/40 disabled:opacity-50 transition-all">
            <Save size={20} />
            {formSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'delete-confirm' && deleteTarget) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center max-w-lg mx-auto px-4">
        <Trash2 size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Eliminar alumno</h2>
        <p className="text-gray-400 text-sm text-center mb-1">{deleteTarget.nombre} {deleteTarget.apellido}</p>
        <p className="text-red-400 text-xs mb-4">Esta accion no se puede deshacer</p>
        {deleteError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 mb-4 w-full text-center">{deleteError}</div>
        )}
        <div className="flex gap-3 w-full">
          <button onClick={() => { setDeleteTarget(null); setDeleteError(''); setView('users'); }}
            className="flex-1 py-3 bg-gray-800 rounded-xl text-gray-300 text-sm font-semibold">Cancelar</button>
          <button onClick={() => deleteUser(deleteTarget)} disabled={deleting}
            className="flex-1 py-3 bg-red-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <div className="fixed inset-0 max-w-lg mx-auto flex items-center justify-center pointer-events-none z-0">
        <img src="/LogoActual.jpg" alt="" aria-hidden className="w-[45vw] max-w-[220px] select-none" style={{ opacity: 0.04, filter: 'grayscale(100%)' }} />
      </div>
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-yellow-400/20 border-2 border-yellow-400 shrink-0 flex items-center justify-center">
              {trainerProfile?.foto_url
                ? <img src={trainerProfile.foto_url} alt="Trainer" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-yellow-400 font-rajdhani">{initials}</span>}
            </div>
            <div>
              <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Entrenador</p>
              <h2 className="text-base font-bold text-white font-rajdhani leading-tight">{displayName || 'Entrenador'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setEditingProfile(true)} className="text-gray-500 hover:text-yellow-400 transition-colors p-1.5 rounded hover:bg-gray-800"><Edit3 size={16} /></button>
            <button onClick={signOut} className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-gray-800"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-8 overflow-y-auto page-enter">
        {view === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => setView(item.key as View)}
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-200 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-xs font-semibold text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-center py-6">
              <Shield size={40} className="mx-auto text-yellow-400 mb-3" />
              <h2 className="text-xl font-bold text-white mb-1">Bienvenido, {displayName || 'Entrenador'}</h2>
              <p className="text-gray-500 text-sm">Selecciona una opcion del menu</p>
            </div>
          </>
        )}

        {view === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white font-rajdhani">Mis Alumnos</h2>
              <button onClick={openAddUser} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                <Plus size={14} /> Agregar
              </button>
            </div>
            {loadingData
              ? <div className="text-center py-8"><span className="w-8 h-8 spinner mx-auto" /></div>
              : students.length === 0
              ? <div className="text-center py-8 text-gray-400"><Users size={32} className="mx-auto mb-2 opacity-50" /><p>No tienes alumnos asignados</p></div>
              : (
                <div className="space-y-2">
                  {students.map(u => (
                    <div key={u.id} className="bg-gray-800 rounded-xl p-3 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 mt-0.5 bg-blue-500/20 border border-blue-500">
                        {u.foto_url
                          ? <img src={u.foto_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[10px] font-bold text-blue-400">{u.nombre?.[0]}{u.apellido?.[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.nombre} {u.apellido}</p>
                        <p className="text-[10px] text-yellow-400/80 mb-0.5">{u.correo}</p>
                        <p className="text-[10px] text-gray-400">
                          {u.edad ? u.edad + ' anos' : ''}
                          {u.edad && u.estatura ? ' · ' : ''}
                          {u.estatura ? u.estatura + ' cm' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditUser(u)} className="text-gray-500 hover:text-blue-400 p-1.5 rounded hover:bg-gray-700"><Edit3 size={16} /></button>
                        <button onClick={() => { setDeleteTarget(u); setView('delete-confirm'); }} className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-gray-700"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            <button onClick={() => setView('home')} className="mt-4 w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm font-semibold transition-colors">Volver al menu</button>
          </div>
        )}

        {(view === 'eval-select' || view === 'dieta-select') && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 font-rajdhani">
              {view === 'eval-select' ? 'Evaluaciones' : 'Enviar Dietas'}
            </h2>
            <p className="text-xs text-gray-400 mb-3">Selecciona un alumno</p>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
            </div>
            {loadingData
              ? <div className="text-center py-8"><span className="w-8 h-8 spinner mx-auto" /></div>
              : filteredStudents.length === 0
              ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No hay alumnos</p>
                </div>
              )
              : (
                <div className="space-y-2">
                  {filteredStudents.map(p => (
                    <button key={p.id}
                      onClick={() => { setSelectedAlumno(p); setView(view === 'eval-select' ? 'eval-history' : 'dieta-select'); }}
                      className="w-full bg-gray-800 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left">
                      <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${view === 'eval-select' ? 'bg-blue-500/20 border border-blue-500' : 'bg-green-500/20 border border-green-500'}`}>
                        {p.foto_url
                          ? <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
                          : <span className={`text-[10px] font-bold ${view === 'eval-select' ? 'text-blue-400' : 'text-green-400'}`}>{p.nombre?.[0]}{p.apellido?.[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{p.nombre} {p.apellido}</p>
                        <p className="text-[10px] text-gray-400">{p.edad ? p.edad + ' anos' : ''}</p>
                      </div>
                      {view === 'eval-select'
                        ? <Activity size={16} className="text-cyan-400 shrink-0" />
                        : <Apple size={16} className="text-green-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            <button onClick={() => setView('home')} className="mt-4 w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm font-semibold transition-colors">Volver al menu</button>
          </div>
        )}
      </main>
      <AIChatModal />
    </div>
  );
}
