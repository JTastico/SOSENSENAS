
import { useCallback, useRef, useState } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export const useNativeTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoopingRef = useRef(false);

  const speakText = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim()) {
      console.warn('🔊 Texto vacío, no se puede reproducir');
      return false;
    }

    console.log(`🔊 Iniciando reproducción nativa: "${text}"`);

    try {
      setIsPlaying(true);
      
      await TextToSpeech.speak({
        text: text,
        lang: 'es-ES',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient'
      });

      console.log('🔊 Audio nativo completado');
      
      // No cambiar isPlaying aquí si está en bucle
      if (!isLoopingRef.current) {
        setIsPlaying(false);
      }
      
      return true;
    } catch (error) {
      console.error('🔊 Error en TTS nativo:', error);
      if (!isLoopingRef.current) {
        setIsPlaying(false);
      }
      return false;
    }
  }, []);

  const speakTextLoop = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;
    
    isLoopingRef.current = true;
    console.log('🔊 Iniciando bucle de audio nativo');
    
    const playLoop = async () => {
      if (!isLoopingRef.current) return;
      
      try {
        await speakText(text);
        
        // Esperar un poco antes de repetir
        if (isLoopingRef.current) {
          loopIntervalRef.current = setTimeout(playLoop, 2000);
        }
      } catch (error) {
        console.error('🔊 Error en bucle de audio nativo:', error);
      }
    };
    
    await playLoop();
    return true;
  }, [speakText]);

  const stopSpeaking = useCallback(async () => {
    console.log('🔊 Deteniendo audio nativo...');
    
    // Detener el bucle
    isLoopingRef.current = false;
    
    if (loopIntervalRef.current) {
      clearTimeout(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    
    try {
      await TextToSpeech.stop();
    } catch (error) {
      console.warn('🔊 Error deteniendo TTS nativo:', error);
    }
    
    setIsPlaying(false);
    console.log('🔊 Audio nativo detenido');
  }, []);

  return {
    speakText,
    speakTextLoop,
    stopSpeaking,
    isPlaying
  };
};
