"use client";
import { createContext, useContext, ReactNode, useState } from 'react';

interface HeaderActionsContextType {
    headerActions: ReactNode;
    setHeaderActions: (actions: ReactNode) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
    const [headerActions, setHeaderActions] = useState<ReactNode>(null);

    return (
        <HeaderActionsContext.Provider value={{ headerActions, setHeaderActions }}>
            {children}
        </HeaderActionsContext.Provider>
    );
}

export function useHeaderActions() {
    const context = useContext(HeaderActionsContext);
    if (context === undefined) {
        throw new Error('useHeaderActions must be used within a HeaderActionsProvider');
    }
    return context;
}