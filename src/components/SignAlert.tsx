
import React, { useEffect, useState, useRef } from 'react';
import { Sign } from '@/types/sign';
import { CheckCircle, X, Volume2, VolumeX } from 'lucide-react';
import { useNativeTextToSpeech } from '@/hooks/useNativeTextToSpeech';

interface SignAlertProps {
  sign: Sign;
  confidence: number;
  onDismiss: () => void;
}

export const SignAlert: React.FC<SignAlertProps> = ({ sign, confidence, onDismiss }) => {
  const { speakTextLoop, stopSpeaking, isPlaying } = useNativeTextToSpeech();
  const [audioStarted, setAudioStarted] = useState(false);
  const [showFramesAlert, setShowFramesAlert] = useState(true);
  const hasTriedAutoRef = useRef(false);

  // Función para iniciar el bucle de audio automáticamente
  const startAudioLoop = async () => {
    if (!sign.voiceAlert || hasTriedAutoRef.current) return;
    
    hasTriedAutoRef.current = true;
    setAudioStarted(true);
    
    console.log('🔊 SignAlert: Iniciando bucle de audio nativo:', sign.voiceAlert);
    
    try {
      await speakTextLoop(sign.voiceAlert);
      console.log('🔊 SignAlert: Bucle de audio nativo iniciado exitosamente');
    } catch (error) {
      console.error('🔊 SignAlert: Error iniciando bucle de audio nativo:', error);
    }
  };

  // Iniciar el bucle de audio al montar el componente
  useEffect(() => {
    if (sign.voiceAlert) {
      // Intentar iniciar el bucle después de un pequeño delay
      const timer = setTimeout(() => {
        startAudioLoop();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [sign.voiceAlert]);

  const handleDismiss = () => {
    console.log('🔊 SignAlert: Cerrando alerta y deteniendo audio nativo');
    stopSpeaking();
    onDismiss();
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <div className="bg-green-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border-l-4 border-green-400">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-200 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white mb-1">
                ¡Seña Detectada!
              </h3>
              <p className="text-green-100 font-semibold text-base mb-2">
                {sign.name || 'Seña sin nombre'}
              </p>
              <p className="text-green-200 text-sm mb-2">
                {sign.description || 'Sin descripción'}
              </p>
              
              {/* Sección de audio */}
              {sign.voiceAlert && (
                <div className="mb-2">
                  <div className="flex items-center space-x-2 p-2 bg-green-500 rounded mb-2">
                    <Volume2 className="w-4 h-4 text-green-200" />
                    <p className="text-green-100 text-xs italic flex-1">
                      "{sign.voiceAlert}"
                    </p>
                  </div>
                  
                  {/* Indicador de estado del bucle */}
                  {isPlaying && (
                    <div className="flex items-center justify-center p-2 bg-blue-500 rounded">
                      <Volume2 className="w-4 h-4 animate-pulse mr-2 text-blue-100" />
                      <span className="text-blue-100 text-xs font-medium">
                        🔄 Reproduciendo en bucle (Audio Nativo)...
                      </span>
                    </div>
                  )}
                  
                  {audioStarted && !isPlaying && (
                    <div className="flex items-center justify-center p-2 bg-gray-500 rounded">
                      <VolumeX className="w-4 h-4 mr-2 text-gray-100" />
                      <span className="text-gray-100 text-xs">
                        Audio nativo detenido
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Alerta de frames con botón X */}
              {showFramesAlert && (
                <div className="mb-2 p-2 bg-blue-500 rounded-lg relative">
                  <button 
                    onClick={() => setShowFramesAlert(false)}
                    className="absolute top-1 right-1 text-blue-200 hover:text-white transition-colors"
                    title="Cerrar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="pr-6">
                    <p className="text-blue-100 text-xs">
                      {Object.values(sign.landmarks).reduce((total, frames) => total + (frames?.length || 0), 0)} frames capturados
                    </p>
                    <p className="text-blue-200 text-xs">
                      {sign.handType === 'both' ? 'Ambas manos' : `Mano ${sign.handType === 'left' ? 'izquierda' : 'derecha'}`}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 px-3 py-1 rounded-full text-xs font-medium">
                  Confianza: {(confidence * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-200">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-green-200 hover:text-white transition-colors ml-2 flex-shrink-0"
            title="Cerrar alerta y detener audio nativo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Barra de progreso de confianza */}
        <div className="mt-3">
          <div className="bg-green-500 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-green-200 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(confidence * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
