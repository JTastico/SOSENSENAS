
import { useRef, useEffect, useState, useCallback } from 'react';

export const useCamera = (videoRef?: React.RefObject<HTMLVideoElement>) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const actualVideoRef = videoRef || internalVideoRef;
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (requestedFacingMode?: 'user' | 'environment') => {
    try {
      console.log('📹 Iniciando cámara con modo:', requestedFacingMode || facingMode);
      setError(null);
      setIsLoading(true);
      
      // Verificar soporte para MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está disponible en este navegador');
      }
      
      // Detener stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const targetFacingMode = requestedFacingMode || facingMode;
      
      // Configuración con fallbacks
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: { ideal: targetFacingMode },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      };

      console.log('📹 Solicitando acceso a cámara con constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Stream obtenido:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));

      if (actualVideoRef.current) {
        actualVideoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Esperar a que el video esté listo con timeout
        const videoReady = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Timeout esperando video'));
          }, 10000);
          
          if (actualVideoRef.current) {
            actualVideoRef.current.onloadedmetadata = () => {
              clearTimeout(timeoutId);
              console.log('✅ Video metadata cargada:', {
                width: actualVideoRef.current?.videoWidth,
                height: actualVideoRef.current?.videoHeight
              });
              resolve(true);
            };
          }
        });
        
        await videoReady;
        
        setIsActive(true);
        setFacingMode(targetFacingMode);
        console.log('✅ Cámara iniciada correctamente con modo:', targetFacingMode);
      }
    } catch (err) {
      console.error('❌ Error accediendo a la cámara:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      
      // Detener cualquier stream si hay error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setError('No se encontró una cámara disponible en este dispositivo.');
      } else if (errorMessage.includes('OverconstrainedError')) {
        console.log('⚠️ Cámara solicitada no disponible, intentando con configuración básica...');
        
        try {
          // Intentar con configuración más básica
          const basicConstraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          };
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          
          if (actualVideoRef.current) {
            actualVideoRef.current.srcObject = fallbackStream;
            streamRef.current = fallbackStream;
            setIsActive(true);
            setFacingMode('user'); // Asumir frontal por defecto
            console.log('✅ Cámara iniciada con configuración básica');
          }
        } catch (fallbackErr) {
          setError('No se pudo acceder a ninguna cámara disponible.');
        }
      } else if (errorMessage.includes('NotReadableError')) {
        setError('La cámara está siendo utilizada por otra aplicación.');
      } else {
        setError('No se pudo acceder a la cámara: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [actualVideoRef, facingMode]);

  const switchCamera = useCallback(async () => {
    if (!isActive || isLoading) {
      console.log('⚠️ No se puede cambiar cámara - Estado:', { isActive, isLoading });
      return false;
    }

    console.log(`🔄 Cambiando cámara de ${facingMode} a ${facingMode === 'user' ? 'environment' : 'user'}`);
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    
    try {
      setIsLoading(true);
      
      // Detener cámara actual primero
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsActive(false);
      
      // Esperar un poco antes de iniciar la nueva cámara
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Iniciar nueva cámara
      await startCamera(newFacingMode);
      
      console.log(`✅ Cámara cambiada exitosamente a ${newFacingMode}`);
      return true;
    } catch (error) {
      console.error('❌ Error al cambiar cámara:', error);
      // Intentar volver a la cámara anterior
      setTimeout(() => startCamera(facingMode), 1000);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, isActive, isLoading, startCamera]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Deteniendo cámara...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔌 Track detenido:', track.kind, track.label);
      });
      streamRef.current = null;
    }
    
    if (actualVideoRef.current) {
      actualVideoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
    console.log('✅ Cámara detenida');
  }, [actualVideoRef]);

  useEffect(() => {
    return () => {
      // Cleanup al desmontar
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef: actualVideoRef,
    isActive,
    isLoading,
    error,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera
  };
};
