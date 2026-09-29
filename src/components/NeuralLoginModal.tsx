import React, { useState, useEffect } from 'react';
import { supabase, CloudPersistenceService, ICloudProfile } from '../services/supabaseClient';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { IPlayerState } from '../types/game';

interface NeuralLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: IPlayerState;
  onProfileLoaded: (profile: ICloudProfile) => void;
}

export const NeuralLoginModal: React.FC<NeuralLoginModalProps> = ({
  isOpen,
  onClose,
  player,
  onProfileLoaded,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState(player.callsign || 'Vance');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cloudProfile, setCloudProfile] = useState<ICloudProfile | null>(null);

  const audio = ProceduralAudioEngine.getInstance();
  const currentUser = CloudPersistenceService.getCurrentUser();

  // Load active profile on open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const checkCurrentSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        CloudPersistenceService.setCurrentUser(data.session.user);
        const profile = await CloudPersistenceService.fetchProfile(data.session.user.id);
        if (profile) {
          setCloudProfile(profile);
        }
      } else {
        setCloudProfile(null);
      }
    };

    checkCurrentSession();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('BITTE E-MAIL UND PASSWORT EINGEBEN.');
      audio.playUiClick();
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    audio.playSelectClick();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(`LOGIN FEHLGESCHLAGEN: ${error.message.toUpperCase()}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        CloudPersistenceService.setCurrentUser(data.user);
        const profile = await CloudPersistenceService.fetchProfile(data.user.id);
        if (profile) {
          setCloudProfile(profile);
          onProfileLoaded(profile);
        }
        setSuccessMsg('NEURAL-LINK ERFOLGREICH SYNCHRONISIERT.');
        audio.playSelectClick();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`SYSTEMFEHLER: ${msg.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('BITTE E-MAIL UND PASSWORT EINGEBEN.');
      audio.playUiClick();
      return;
    }
    if (password.length < 6) {
      setErrorMsg('DAS PASSWORT MUSS MINDESTENS 6 ZEICHEN LANG SEIN.');
      audio.playUiClick();
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    audio.playSelectClick();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            callsign: callsign.trim() || 'Vance',
          },
        },
      });

      if (error) {
        setErrorMsg(`REGISTRIERUNG FEHLGESCHLAGEN: ${error.message.toUpperCase()}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        CloudPersistenceService.setCurrentUser(data.user);

        // Initial sync of current local progress to cloud profile
        await CloudPersistenceService.syncProgression(data.user.id, {
          callsign: callsign.trim() || 'Vance',
          credits: player.credits,
          nanites: player.nanites,
          chrono_crystals: player.chronoCrystals,
          high_score: player.level,
        });

        const profile = await CloudPersistenceService.fetchProfile(data.user.id);
        if (profile) {
          setCloudProfile(profile);
          onProfileLoaded(profile);
        }

        setSuccessMsg('NEUER CLOUD-SPEICHER INITIALISIERT & AKTIVIERT.');
        audio.playSelectClick();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`SYSTEMFEHLER: ${msg.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Force Sync
  const handleForceSync = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);
    audio.playSelectClick();

    const ok = await CloudPersistenceService.syncProgression(currentUser.id, {
      callsign: player.callsign,
      credits: player.credits,
      nanites: player.nanites,
      chrono_crystals: player.chronoCrystals,
      high_score: player.level,
    });

    if (ok) {
      const refreshed = await CloudPersistenceService.fetchProfile(currentUser.id);
      if (refreshed) {
        setCloudProfile(refreshed);
      }
      setSuccessMsg('SPIELSTAND ERFOLGREICH MIT DER CLOUD SYNCHRONISIERT.');
    } else {
      setErrorMsg('SYNCHRONISATION FEHLGESCHLAGEN (NETZWERKFEHLER).');
    }
    setLoading(false);
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setLoading(true);
    audio.playSelectClick();
    await supabase.auth.signOut();
    CloudPersistenceService.setCurrentUser(null);
    CloudPersistenceService.setCachedApiKey('');
    setCloudProfile(null);
    setSuccessMsg('NEURAL-LINK GETRENNT // GAST-MODUS AKTIV.');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-[#0b1017] border-2 border-cyan-400 max-w-lg w-full p-6 shadow-[0_0_40px_rgba(0,255,170,0.3)] space-y-4 text-xs text-[#d8e2dc]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-cyan-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] shadow-[0_0_8px_#00FFAA]" />
            <span className="text-cyan-300 font-bold tracking-widest uppercase">
              [ASTRAEA MODEL-7 // NEURAL-LINK &amp; CLOUD-SYNC]
            </span>
          </div>
          <button
            onClick={() => {
              audio.playUiClick();
              onClose();
            }}
            className="text-gray-400 hover:text-white px-2 py-0.5 border border-cyan-800 hover:border-cyan-500 transition-colors"
          >
            [ESC]
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-2.5 bg-red-950/80 border border-red-500 text-red-300 text-[11px] font-bold">
            &gt; [ALARM]: {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 bg-cyan-950/80 border border-[#00FFAA] text-[#00FFAA] text-[11px] font-bold">
            &gt; [STATUS]: {successMsg}
          </div>
        )}

        {/* View 1: Already Logged In */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-3 bg-black/60 border border-cyan-900/80 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-cyan-300 font-bold">STATUS:</span>
                <span className="text-[#00FFAA] font-bold tracking-wider">
                  VERBUNDEN // RLS GESICHERT
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-cyan-300 font-bold">E-MAIL:</span>
                <span className="text-gray-100 font-medium">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-cyan-300 font-bold">CALLSIGN:</span>
                <span className="text-white font-bold">
                  {cloudProfile?.callsign || player.callsign}
                </span>
              </div>
            </div>

            {/* Cloud Progression Preview */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-cyan-300 font-semibold">CREDITS</div>
                <div className="text-sm font-bold text-gray-100">
                  {cloudProfile ? cloudProfile.credits : player.credits} AC
                </div>
              </div>
              <div>
                <div className="text-[10px] text-cyan-300 font-semibold">NANITEN</div>
                <div className="text-sm font-bold text-[#00FFAA]">
                  {cloudProfile ? cloudProfile.nanites : player.nanites} TN
                </div>
              </div>
              <div>
                <div className="text-[10px] text-cyan-300 font-semibold">CHRONO-KRISTALLE</div>
                <div className="text-sm font-bold text-amber-300">
                  {cloudProfile ? cloudProfile.chrono_crystals : player.chronoCrystals} CK
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleForceSync}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#00FFAA] text-black font-bold tracking-widest text-xs hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'SYNCHRONISIERE...' : '[ &gt; ] JETZT IN CLOUD SICHERN'}
              </button>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="py-2.5 px-4 bg-red-950/60 border border-red-700 text-red-300 hover:bg-red-900 font-bold text-xs cursor-pointer transition-colors"
              >
                ABMELDEN
              </button>
            </div>
          </div>
        ) : (
          /* View 2: Authentication Form */
          <div className="space-y-4">
            {/* Mode Selector */}
            <div className="flex border-b border-cyan-900 text-xs">
              <button
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  audio.playHoverPing();
                }}
                className={`flex-1 py-2 font-bold tracking-wider text-center cursor-pointer transition-colors ${
                  mode === 'LOGIN'
                    ? 'text-[#00FFAA] border-b-2 border-[#00FFAA] bg-cyan-950/40'
                    : 'text-gray-400 hover:text-cyan-300'
                }`}
              >
                [01] ANMELDEN (SIGN IN)
              </button>
              <button
                onClick={() => {
                  setMode('SIGNUP');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  audio.playHoverPing();
                }}
                className={`flex-1 py-2 font-bold tracking-wider text-center cursor-pointer transition-colors ${
                  mode === 'SIGNUP'
                    ? 'text-[#00FFAA] border-b-2 border-[#00FFAA] bg-cyan-950/40'
                    : 'text-gray-400 hover:text-cyan-300'
                }`}
              >
                [02] NEUES PROFIL (SIGN UP)
              </button>
            </div>

            <form onSubmit={mode === 'LOGIN' ? handleLogin : handleSignup} className="space-y-3">
              {mode === 'SIGNUP' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-cyan-400 tracking-wider font-bold">
                    OPERATIVE CALLSIGN:
                  </label>
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    placeholder="Vance"
                    maxLength={20}
                    className="w-full bg-black/60 border border-cyan-800 focus:border-[#00FFAA] px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 tracking-wider font-bold">
                  TERMINAL-E-MAIL:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operative@astraea-07.org"
                  required
                  className="w-full bg-black/60 border border-cyan-800 focus:border-[#00FFAA] px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 tracking-wider font-bold">
                  NEURAL-SCHLÜSSEL (PASSWORT):
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/60 border border-cyan-800 focus:border-[#00FFAA] px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#00FFAA] text-black font-bold tracking-widest text-xs hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? 'VERBINDE MIT KERNEL...'
                    : mode === 'LOGIN'
                    ? '[ &gt; ] NEURAL-LOGIN DURCHFÜHREN'
                    : '[ &gt; ] PROFIL INITIALISIEREN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playUiClick();
                    onClose();
                  }}
                  className="py-2.5 px-4 bg-cyan-950/60 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 font-bold text-xs cursor-pointer transition-colors"
                >
                  GAST-MODUS
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security & RLS Disclaimer */}
        <div className="pt-2 border-t border-cyan-950 text-[10px] text-cyan-300 font-medium leading-relaxed flex items-center justify-between">
          <span>RLS: POSTGRESQL MULTI-TENANT GESICHERT</span>
          <span className="text-[#00FFAA] font-bold">CWE-312 KONFORM</span>
        </div>
      </div>
    </div>
  );
};
