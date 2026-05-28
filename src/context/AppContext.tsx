/**
 * AppContext.tsx — État global de l'application (React Context + useReducer)
 *
 * Remplace Zustand. Gère :
 *   - La session Supabase (auth email+password+2FA SMS)
 *   - Le profil utilisateur (avec username)
 *   - Le partenaire lié (liaison PERMANENTE)
 *   - L'étape d'onboarding (setup username si nouveau compte)
 */

import React, { createContext, useContext, useReducer } from 'react';
import { Session } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  display_name: string;
  identity_key: string;
  signed_pre_key: string;
  signed_pre_key_id: number;
  public_key: string;
  avatar_url: string | null;
  partner_id: string | null;
  partner_locked: boolean;
  created_at: string;
};

type State = {
  session: Session | null;
  profile: Profile | null;
  partner: Profile | null;
  needsUsername: boolean;
};

type Action =
  | { type: 'SET_SESSION';       payload: Session | null }
  | { type: 'SET_PROFILE';       payload: Profile }
  | { type: 'SET_PARTNER';       payload: Profile | null }
  | { type: 'SET_NEEDS_USERNAME'; payload: boolean }
  | { type: 'RESET' };

const initial: State = {
  session: null,
  profile: null,
  partner: null,
  needsUsername: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SESSION':        return { ...state, session: action.payload };
    case 'SET_PROFILE':        return { ...state, profile: action.payload };
    case 'SET_PARTNER':        return { ...state, partner: action.payload };
    case 'SET_NEEDS_USERNAME': return { ...state, needsUsername: action.payload };
    case 'RESET':              return initial;
    default:                   return state;
  }
}

type Ctx = State & {
  setSession:       (s: Session | null) => void;
  setProfile:       (p: Profile) => void;
  setPartner:       (p: Profile | null) => void;
  setNeedsUsername: (v: boolean) => void;
  reset:            () => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const value: Ctx = {
    ...state,
    setSession:       (s) => dispatch({ type: 'SET_SESSION',        payload: s }),
    setProfile:       (p) => dispatch({ type: 'SET_PROFILE',        payload: p }),
    setPartner:       (p) => dispatch({ type: 'SET_PARTNER',        payload: p }),
    setNeedsUsername: (v) => dispatch({ type: 'SET_NEEDS_USERNAME', payload: v }),
    reset:            ()  => dispatch({ type: 'RESET' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
