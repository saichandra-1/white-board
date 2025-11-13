'use client';

import React, { createContext, useContext, useState } from 'react';

interface PanelContextType {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const toggleLeftPanel = () => {
    setLeftPanelOpen(prev => !prev);
  };

  const toggleRightPanel = () => {
    setRightPanelOpen(prev => !prev);
  };

  return (
    <PanelContext.Provider value={{
      leftPanelOpen,
      rightPanelOpen,
      toggleLeftPanel,
      toggleRightPanel,
    }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
}
