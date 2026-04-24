import { createContext, useContext, type ReactNode } from "react";

interface AltTextContextValue {
  showAltText: boolean;
  setShowAltText: (value: boolean) => void;
}

const AltTextContext = createContext<AltTextContextValue | undefined>(undefined);

export function AltTextProvider({
  value,
  children,
}: {
  value: AltTextContextValue;
  children: ReactNode;
}) {
  return <AltTextContext.Provider value={value}>{children}</AltTextContext.Provider>;
}

export function useAltTextVisibility() {
  const context = useContext(AltTextContext);

  if (!context) {
    throw new Error("useAltTextVisibility must be used within AltTextProvider");
  }

  return context;
}
