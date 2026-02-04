import { useState, useEffect } from 'react';

/**
 * Hook para verificar si el componente está montado en el cliente.
 * Útil para evitar problemas de hydration en Next.js con SSR.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export default useMounted;

