
import { useCallback, useRef, useState } from 'react';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoopingRef = useRef(false);

  const speakText = useCallback((text: string, durationMs: number = 15000) => {
    if (!text.trim()) {
      console.warn('🔊 Texto vacío, no se puede reproducir');
      return Promise.resolve(false);
    }
    
    // Verificar si la síntesis de voz está disponible
    if (!('speechSynthesis' in window)) {
      console.warn('🔊 Síntesis de voz no disponible en este navegador');
      return Promise.resolve(false);
    }

    console.log(`🔊 Iniciando reproducción: "${text}"`);

    // Limpiar cualquier reproducción anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Detener cualquier síntesis de voz en curso
    try {
      speechSynthesis.cancel();
    } catch (error) {
      console.warn('🔊 Error cancelando síntesis anterior:', error);
    }
    
    return new Promise<boolean>((resolve) => {
      // Esperar un momento para que se complete la cancelación
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'es-ES';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utteranceRef.current = utterance;
          
          let hasStarted = false;
          let resolved = false;
          
          const resolveOnce = (success: boolean) => {
            if (!resolved) {
              resolved = true;
              resolve(success);
            }
          };
          
          utterance.onstart = () => {
            console.log('🔊 Audio iniciado correctamente');
            hasStarted = true;
            setIsPlaying(true);
            resolveOnce(true);
          };
          
          utterance.onend = () => {
            console.log('🔊 Audio terminado correctamente');
            if (!hasStarted) {
              resolveOnce(false);
            }
            // No cambiar isPlaying aquí si está en bucle
            if (!isLoopingRef.current) {
              setIsPlaying(false);
            }
          };
          
          utterance.onerror = (error) => {
            console.error('🔊 Error en síntesis de voz:', error);
            setIsPlaying(false);
            resolveOnce(false);
          };
          
          // Obtener voces disponibles y esperar si es necesario
          let voices = speechSynthesis.getVoices();
          
          const speakWithVoice = () => {
            voices = speechSynthesis.getVoices();
            
            if (voices.length > 0) {
              // Buscar una voz en español
              const spanishVoice = voices.find(voice => 
                voice.lang.startsWith('es') || 
                voice.lang.includes('Spanish') || 
                voice.name.toLowerCase().includes('spanish') ||
                voice.name.toLowerCase().includes('español')
              );
              
              if (spanishVoice) {
                utterance.voice = spanishVoice;
                console.log('🔊 Usando voz en español:', spanishVoice.name);
              } else {
                console.log('🔊 Usando voz por defecto');
              }
            }
            
            console.log('🔊 Reproduciendo utterance...');
            speechSynthesis.speak(utterance);
            
            // Timeout de seguridad para resolver si no se inicia
            setTimeout(() => {
              if (!hasStarted && !resolved) {
                console.warn('🔊 Timeout esperando inicio de audio');
                setIsPlaying(false);
                resolveOnce(false);
              }
            }, 2000);
          };
          
          // Si no hay voces disponibles, esperar a que se carguen
          if (voices.length === 0) {
            console.log('🔊 Esperando voces...');
            speechSynthesis.onvoiceschanged = () => {
              speechSynthesis.onvoiceschanged = null;
              setTimeout(speakWithVoice, 100);
            };
            // Fallback si onvoiceschanged no se dispara
            setTimeout(speakWithVoice, 1000);
          } else {
            speakWithVoice();
          }
          
          // Detener después de la duración especificada
          timeoutRef.current = setTimeout(() => {
            try {
              speechSynthesis.cancel();
            } catch (error) {
              console.warn('🔊 Error cancelando en timeout:', error);
            }
            setIsPlaying(false);
            console.log('🔊 Audio detenido por timeout');
          }, durationMs);
          
        } catch (error) {
          console.error('🔊 Error creando utterance:', error);
          setIsPlaying(false);
          resolve(false);
        }
      }, 100);
    });
  }, []);

  const speakTextLoop = useCallback(async (text: string) => {
    if (!text.trim()) return false;
    
    isLoopingRef.current = true;
    console.log('🔊 Iniciando bucle de audio');
    
    const playLoop = async () => {
      if (!isLoopingRef.current) return;
      
      try {
        await speakText(text, 8000);
        
        // Esperar un poco antes de repetir
        if (isLoopingRef.current) {
          loopIntervalRef.current = setTimeout(playLoop, 1000);
        }
      } catch (error) {
        console.error('🔊 Error en bucle de audio:', error);
      }
    };
    
    await playLoop();
    return true;
  }, [speakText]);

  const stopSpeaking = useCallback(() => {
    console.log('🔊 Deteniendo audio...');
    
    // Detener el bucle
    isLoopingRef.current = false;
    
    if (loopIntervalRef.current) {
      clearTimeout(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    
    try {
      speechSynthesis.cancel();
    } catch (error) {
      console.warn('🔊 Error cancelando síntesis:', error);
    }
    setIsPlaying(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    console.log('🔊 Audio detenido manualmente');
  }, []);

  return {
    speakText,
    speakTextLoop,
    stopSpeaking,
    isPlaying
  };
};
