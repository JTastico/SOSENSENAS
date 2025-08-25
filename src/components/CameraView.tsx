
import React, { useRef, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useSignDetection } from '@/hooks/useSignDetection';
import { SignAlert } from '@/components/SignAlert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Play, Square, Timer, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import logoSenas from "../assets/logo_senas.png";

export const CameraView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    isActive, 
    isLoading, 
    error, 
    facingMode,
    startCamera, 
    stopCamera,
    switchCamera 
  } = useCamera(videoRef);
  
  const { 
    detectedSign, 
    isDetecting, 
    setCanvasRef, 
    startDetection,
    dismissAlert,
    isDetectionActive,
    countdown
  } = useSignDetection(videoRef.current);

  // Configurar referencia del canvas
  useEffect(() => {
    if (canvasRef.current) {
      console.log('🎨 Estableciendo referencia del canvas');
      setCanvasRef(canvasRef.current);
    }
  }, [setCanvasRef]);

  // Sincronización mejorada y continua del canvas con el video
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;
    
    const syncCanvas = () => {
      if (canvasRef.current && videoRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.readyState >= 2) {
          const videoRect = video.getBoundingClientRect();
          
          if (Math.abs(canvas.width - videoRect.width) > 2 || Math.abs(canvas.height - videoRect.height) > 2) {
            canvas.width = Math.round(videoRect.width);
            canvas.height = Math.round(videoRect.height);
            
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = `${videoRect.width}px`;
            canvas.style.height = `${videoRect.height}px`;
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '10';
            
            console.log(`📐 Canvas sincronizado: ${canvas.width}x${canvas.height}`);
          }
        }
      }
    };

    // Eventos de sincronización
    const video = videoRef.current;
    const handleVideoReady = () => {
      console.log('📹 Video listo, sincronizando canvas');
      setTimeout(syncCanvas, 100);
    };

    video.addEventListener('loadeddata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);
    video.addEventListener('resize', syncCanvas);
    
    // Observer para cambios de tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(syncCanvas, 50);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Sincronización inicial y periódica
    syncCanvas();
    const syncInterval = setInterval(syncCanvas, 2000);

    return () => {
      video.removeEventListener('loadeddata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      video.removeEventListener('resize', syncCanvas);
      resizeObserver.disconnect();
      clearInterval(syncInterval);
    };
  }, [isActive]);

  // Función para cambiar cámara con feedback
  const handleSwitchCamera = async () => {
    if (isDetectionActive || countdown > 0) {
      toast.warning('No se puede cambiar de cámara durante la detección');
      return;
    }

    const success = await switchCamera();
    if (success) {
      toast.success(`Cámara cambiada a ${facingMode === 'user' ? 'trasera' : 'frontal'}`);
    } else {
      toast.error('Error al cambiar de cámara');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <img
              src={logoSenas}
              alt="SOS en SEÑAS"
              className=" h-20 mr-4 drop-shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              SOS en SEÑAS
            </h1>
            <p className="text-blue-600 font-medium">Reconocimiento Inteligente</p>
          </div>
        </div>
      </div>
      <Card className="p-3 sm:p-6 bg-white/90 backdrop-blur-sm border border-blue-200">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Detección en Tiempo Real</h2>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
              {!isActive ? (
                <Button 
                  onClick={() => startCamera()} 
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white border-0"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isLoading ? 'Iniciando...' : 'Iniciar Cámara'}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    className="w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Detener Cámara
                  </Button>
                  
                  <Button 
                    onClick={handleSwitchCamera}
                    disabled={isLoading || isDetectionActive || countdown > 0}
                    variant="outline"
                    className="w-full sm:w-auto border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {facingMode === 'user' ? 'A Trasera' : 'A Frontal'}
                  </Button>
                </>
              )}
              
              {isActive && (
                <Button 
                  onClick={startDetection}
                  disabled={isDetectionActive || countdown > 0}
                  className={`w-full sm:w-auto ${
                    isDetectionActive || countdown > 0
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0'
                  }`}
                >
                  {countdown > 0 ? (
                    <>
                      <Timer className="w-4 h-4 mr-2" />
                      Iniciando en {countdown}s
                    </>
                  ) : isDetectionActive ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Detectando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Detección
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Contenedor del video con canvas superpuesto */}
          <div 
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden w-full" 
            style={{ aspectRatio: '4/5' }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover relative z-0"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none z-10"
            />
            
            {/* Indicador de cámara activa */}
            {isActive && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                <div className="bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-semibold backdrop-blur-sm shadow-lg">
                  📷 {facingMode === 'user' ? 'Frontal' : 'Trasera'}
                </div>
              </div>
            )}
            
            {/* Overlays de estado */}
            {!isActive && !error && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/50 z-20">
                <div className="text-white text-center">
                  <Camera className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-lg">Presiona "Iniciar Cámara" para comenzar</p>
                </div>
              </div>
            )}
            
            {/* Overlay del temporizador */}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
                <div className="text-center text-white">
                  <div className="text-6xl sm:text-8xl font-bold mb-4 animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-lg sm:text-xl">Prepárate para la detección...</p>
                </div>
              </div>
            )}
            
            {isDetecting && countdown === 0 && (
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg z-20">
                🔍 Analizando...
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm sm:text-base">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </Card>

      {detectedSign && (
        <SignAlert
          sign={detectedSign.sign}
          confidence={detectedSign.confidence}
          onDismiss={dismissAlert}
        />
      )}
    </div>
  );
};
