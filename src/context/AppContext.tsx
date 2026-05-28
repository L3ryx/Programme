/**
 * AppContext.tsx — État global de l'application (React Context + useReducer)
 *
 * Gère :
 *   - L'utilisateur Appwrite (auth email+password)
 *   - Le profil utilisateur (avec username)
 *   - Le partenaire lié (liaison PERMANENTE)
 *   - L'étape d'onboarding (setup username si nouveau compte)
 */

import React, { createContext, useContext, useReducer } from 'react';
import type { Models } from 'appwrite';

export type Profile = {
  $id:               string;
  phone:             string | null;
  email:             string | null;
  username:          string | null;
  display_name:      string;
  identity_key:      string;
  signed_pre_key:    string;
  signed_pre_key_id: number;
  public_key:        string;
  avatar_url:        string | null;
  partner_id:        string | null;
  partner_locked:    boolean;
  $createdAt:        string;
};

type State = {
  user:          Models.User<Models.Preferences> | null;
  profile:       Profile | null;
  partner:       Profile | null;
  needsUsername: boolean;
};

type Action =
  | { type: 'SET_USER';          payload: Models.User<Models.Preferences> | null }
  | { type: 'SET_PROFILE';       payload: Profile }
  | { type: 'SET_PARTNER';       payload: Profile | null }
  | { type: 'SET_NEEDS_USERNAME'; payload: boolean }
  | { type: 'RESET' };

const initial: State = {
  user:          null,
  profile:       null,
  partner:       null,
  needsUsername: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':           return { ...state, user: action.payload };
    case 'SET_PROFILE':        return { ...state, profile: action.payload };
    case 'SET_PARTNER':        return { ...state, partner: action.payload };
    case 'SET_NEEDS_USERNAME': return { ...state, needsUsername: action.payload };
    case 'RESET':              return initial;
    default:                   return state;
  }
}

type Ctx = State & {
  setUser:          (u: Models.User<Models.Preferences> | null) => void;
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
    setUser:          (u) => dispatch({ type: 'SET_USER',          payload: u }),
    setProfile:       (p) => dispatch({ type: 'SET_PROFILE',       payload: p }),
    setPartner:       (p) => dispatch({ type: 'SET_PARTNER',       payload: p }),
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
