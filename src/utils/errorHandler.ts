
// Manejador de errores global para evitar crashes en la app nativa
export const setupGlobalErrorHandler = () => {
  // Manejo de errores no capturados
  window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    // Evitar que el error crashee la app
    event.preventDefault();
    return false;
  });

  // Manejo de promesas rechazadas no capturadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no capturada:', event.reason);
    // Evitar que el error crashee la app
    event.preventDefault();
  });

  // Manejo específico para MediaPipe y detección de manos
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    // Filtrar errores conocidos que no deben crashear la app
    if (message.includes('MediaPipe') || 
        message.includes('hands') || 
        message.includes('landmark') ||
        message.includes('prediction')) {
      console.warn('⚠️ Error de MediaPipe manejado:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
};

// Función para manejo seguro de operaciones async
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorMessage?: string
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    console.warn(errorMessage || 'Operación async falló:', error);
    return fallback;
  }
};

// Función para manejo seguro de operaciones síncronas
export const safeSync = <T>(
  operation: () => T,
  fallback?: T,
  errorMessage?: string
): T | undefined => {
  try {
    return operation();
  } catch (error) {
    console.warn(errorMessage || 'Operación sync falló:', error);
    return fallback;
  }
};
