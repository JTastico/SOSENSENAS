import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useHandpose } from '@/hooks/useHandpose';
import { Button } from '@/components/ui/button';
import { Video, Square, AlertCircle, CheckCircle, Camera, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob, landmarks: { leftHand?: number[][][]; rightHand?: number[][][]; bothHands?: number[][][]; }, handType: 'left' | 'right' | 'both') => void;
  onCancel: () => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded, onCancel }) => {
  const { videoRef, isActive, startCamera, stopCamera, error: cameraError, switchCamera, facingMode } = useCamera();
  const { predictions, isModelLoaded, modelError } = useHandpose(isActive ? videoRef.current : null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const landmarksSequenceRef = useRef<{
    leftHand: number[][][];
    rightHand: number[][][];
    bothHands: number[][][];
  }>({ leftHand: [], rightHand: [], bothHands: [] });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  // Inicializar cámara cuando el componente se monta
  useEffect(() => {
    const initializeCamera = async () => {
      console.log('🎥 Inicializando VideoRecorder...');
      setIsInitializing(true);
      
      try {
        // Verificar permisos de cámara primero
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('📹 Permisos de cámara:', permissions.state);
        
        if (permissions.state === 'denied') {
          toast.error('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.');
          return;
        }
        
        // Verificar disponibilidad de MediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error('La cámara no está disponible en este dispositivo o navegador.');
          return;
        }
        
        // Iniciar cámara
        await startCamera();
        console.log('✅ Cámara inicializada correctamente');
        
      } catch (error) {
        console.error('❌ Error inicializando cámara:', error);
        toast.error('Error al inicializar la cámara: ' + (error as Error).message);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCamera();

    return () => {
      console.log('🛑 VideoRecorder desmontado, limpiando...');
      stopCamera();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Función para cambiar de cámara con mejor manejo de errores
  const handleSwitchCamera = useCallback(async () => {
    if (isRecording) {
      toast.warning('No se puede cambiar de cámara mientras se está grabando');
      return;
    }

    if (!isActive) {
      toast.warning('La cámara debe estar activa para cambiar');
      return;
    }

    try {
      console.log('🔄 Cambiando cámara...');
      const success = await switchCamera();
      
      if (success) {
        toast.success(`Cámara ${facingMode === 'user' ? 'trasera' : 'frontal'} activada`);
      } else {
        toast.error('No se pudo cambiar de cámara');
      }
    } catch (error) {
      console.error('❌ Error al cambiar cámara:', error);
      toast.error('Error al cambiar de cámara');
    }
  }, [isRecording, isActive, switchCamera, facingMode]);

  const drawLandmarks = useCallback(() => {
    if (!canvasRef.current || !predictions.length || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    if (!ctx) return;
    
    // Ajustar canvas al tamaño del video
    const videoRect = video.getBoundingClientRect();
    canvas.width = videoRect.width;
    canvas.height = videoRect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let leftHandLandmarks: number[][] | null = null;
    let rightHandLandmarks: number[][] | null = null;
    
    predictions.forEach((prediction, index) => {
      if (prediction.landmarks) {
        // Determinar color según la mano
        const isLeft = prediction.handedness === 'Left';
        const handColor = isLeft ? '#3B82F6' : '#EF4444';
        const jointColor = isLeft ? '#1D4ED8' : '#DC2626';
        
        // Guardar landmarks según la mano
        if (isLeft) {
          leftHandLandmarks = prediction.landmarks;
        } else {
          rightHandLandmarks = prediction.landmarks;
        }
        
        // Conexiones básicas
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20]
        ];
        
        // Dibujar líneas
        ctx.strokeStyle = handColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        connections.forEach(([start, end]) => {
          if (prediction.landmarks[start] && prediction.landmarks[end]) {
            const startPoint = prediction.landmarks[start];
            const endPoint = prediction.landmarks[end];
            
            const startX = startPoint[0] * canvas.width;
            const startY = startPoint[1] * canvas.height;
            const endX = endPoint[0] * canvas.width;
            const endY = endPoint[1] * canvas.height;
            
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
          }
        });
        ctx.stroke();
        
        // Dibujar puntos
        prediction.landmarks.forEach((landmark: number[], pointIndex: number) => {
          const x = landmark[0] * canvas.width;
          const y = landmark[1] * canvas.height;
          const isJoint = [0, 4, 8, 12, 16, 20].includes(pointIndex);
          
          ctx.beginPath();
          ctx.arc(x, y, isJoint ? 6 : 4, 0, 2 * Math.PI);
          ctx.fillStyle = isJoint ? jointColor : handColor;
          ctx.fill();
          
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        
        // Etiqueta de mano
        const labelX = prediction.landmarks[0][0] * canvas.width;
        const labelY = prediction.landmarks[0][1] * canvas.height - 20;
        
        ctx.fillStyle = handColor;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(isLeft ? 'IZQ' : 'DER', labelX - 15, labelY);
      }
    });
    
    // Guardar landmarks solo si está grabando
    if (isRecording) {
      if (leftHandLandmarks) {
        landmarksSequenceRef.current.leftHand.push(leftHandLandmarks);
      }
      if (rightHandLandmarks) {
        landmarksSequenceRef.current.rightHand.push(rightHandLandmarks);
      }
      if (leftHandLandmarks && rightHandLandmarks) {
        const combinedLandmarks = [...leftHandLandmarks, ...rightHandLandmarks];
        landmarksSequenceRef.current.bothHands.push(combinedLandmarks);
      }
    }
  }, [predictions, isRecording]);

  useEffect(() => {
    if (isModelLoaded && !modelError) {
      drawLandmarks();
    }
  }, [predictions, isModelLoaded, modelError, drawLandmarks]);

  const startRecording = useCallback(async () => {
    console.log('🎬 Intentando iniciar grabación...');
    
    if (!isActive) {
      toast.error('La cámara no está activa');
      return;
    }

    if (!isModelLoaded) {
      toast.error('El modelo de detección aún se está cargando...');
      return;
    }

    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('Video no disponible');
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      recordedChunksRef.current = [];
      landmarksSequenceRef.current = { leftHand: [], rightHand: [], bothHands: [] };
      setRecordingTime(0);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        const landmarks = landmarksSequenceRef.current;
        const hasLeftHand = landmarks.leftHand.length > 0;
        const hasRightHand = landmarks.rightHand.length > 0;
        const hasBothHands = landmarks.bothHands.length > 0;
        
        if (!hasLeftHand && !hasRightHand) {
          toast.error('No se detectaron manos durante la grabación');
          return;
        }
        
        let handType: 'left' | 'right' | 'both';
        if (hasBothHands && hasLeftHand && hasRightHand) {
          handType = 'both';
        } else if (hasLeftHand) {
          handType = 'left';
        } else {
          handType = 'right';
        }
        
        onVideoRecorded(videoBlob, landmarks, handType);
        
        const totalFrames = landmarks.leftHand.length + landmarks.rightHand.length + landmarks.bothHands.length;
        console.log(`✅ Video grabado: ${totalFrames} frames totales`);
        toast.success(`¡Grabación exitosa! ${totalFrames} frames capturados para ${handType === 'both' ? 'ambas manos' : `mano ${handType === 'left' ? 'izquierda' : 'derecha'}`}`);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 5) {
            stopRecording();
            return 5;
          }
          return newTime;
        });
      }, 1000);
      
      toast.success('¡Grabación iniciada!');

    } catch (error) {
      console.error('❌ Error iniciando grabación:', error);
      toast.error('Error al iniciar grabación: ' + (error as Error).message);
    }
  }, [isActive, isModelLoaded, videoRef, onVideoRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Estado del sistema mejorado
  const getSystemStatus = () => {
    if (isInitializing) return { 
      icon: Camera, 
      color: 'text-blue-500', 
      text: 'Inicializando cámara...',
      canRecord: false
    };
    
    if (cameraError) return { 
      icon: AlertCircle, 
      color: 'text-red-500', 
      text: 'Error de cámara: ' + cameraError,
      canRecord: false
    };
    
    if (!isActive) return {
      icon: AlertCircle, 
      color: 'text-yellow-500', 
      text: 'Cámara no activa',
      canRecord: false
    };
    
    if (modelError) return { 
      icon: AlertCircle, 
      color: 'text-red-500', 
      text: 'Error del modelo: ' + modelError,
      canRecord: false
    };
    
    if (!isModelLoaded) return { 
      icon: AlertCircle, 
      color: 'text-blue-500', 
      text: 'Cargando detección de manos...',
      canRecord: false
    };
    
    return { 
      icon: CheckCircle, 
      color: 'text-green-500', 
      text: '¡Listo para grabar!',
      canRecord: true
    };
  };

  const status = getSystemStatus();
  const StatusIcon = status.icon;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Estado del sistema */}
      <div className="text-center p-2 sm:p-4">
        <div className={`flex items-center justify-center space-x-2 ${status.color} mb-2`}>
          <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-xs sm:text-sm">{status.text}</span>
        </div>
        {predictions.length > 0 && (
          <div className="text-xs sm:text-sm space-y-1">
            <p className="text-green-600">
              ✋ {predictions.length} mano(s) detectada(s)
            </p>
            {predictions.map((pred, idx) => (
              <p key={idx} className={`text-xs ${pred.handedness === 'Left' ? 'text-blue-600' : 'text-red-600'}`}>
                {pred.handedness === 'Left' ? '👈 Izquierda' : '👉 Derecha'} ({pred.landmarks?.length || 0} puntos)
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Video container */}
      <div className="flex-1 relative w-full max-w-full overflow-hidden">
        <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-300 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          
          {/* Botón para cambiar cámara */}
          {isActive && !isRecording && (
            <button
              onClick={handleSwitchCamera}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/70 text-white p-2 sm:p-3 rounded-full hover:bg-black/90 transition-colors backdrop-blur-sm shadow-lg"
              title={`Cambiar a cámara ${facingMode === 'user' ? 'trasera' : 'frontal'}`}
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Indicador de cámara activa */}
          {isActive && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <div className="bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-semibold backdrop-blur-sm shadow-lg">
                📷 {facingMode === 'user' ? 'Frontal' : 'Trasera'}
              </div>
            </div>
          )}
          
          {/* Indicador de grabación */}
          {isRecording && (
            <div className="absolute top-10 left-2 right-2 sm:top-12 sm:left-3 sm:right-3 space-y-2">
              <div className="bg-red-600 text-white px-3 py-2 rounded text-center font-bold animate-pulse backdrop-blur-sm shadow-lg">
                <span className="text-xs sm:text-sm">🔴 GRABANDO - {5 - recordingTime}s</span>
              </div>
              <div className="bg-black/70 text-white px-2 py-1 rounded text-xs text-center backdrop-blur-sm shadow-lg space-y-1">
                <div>Frames: I:{landmarksSequenceRef.current.leftHand.length} D:{landmarksSequenceRef.current.rightHand.length} A:{landmarksSequenceRef.current.bothHands.length}</div>
              </div>
            </div>
          )}

          {(!isActive && !isInitializing) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center p-4">
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-red-400" />
                <p className="text-xs sm:text-sm">Error: Cámara no disponible</p>
                <p className="text-xs text-gray-300 mt-1">Verifica los permisos de cámara</p>
              </div>
            </div>
          )}

          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center p-4">
                <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 animate-pulse" />
                <p className="text-xs sm:text-sm">Inicializando cámara...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 p-2 sm:p-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={!status.canRecord}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold"
          >
            <Video className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Grabar Seña (5s)</span>
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold"
          >
            <Square className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Detener</span>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold"
        >
          Cancelar
        </Button>
      </div>

      {/* Información */}
      <div className="text-center text-xs sm:text-sm text-gray-600 px-2 space-y-1 sm:space-y-2 bg-blue-50 p-2 sm:p-4 rounded-lg">
        <p className="font-medium text-blue-700 text-xs sm:text-sm">📋 Instrucciones para 2 manos:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
          <p>🔵 Azul: mano izquierda</p>
          <p>🔴 Rojo: mano derecha</p>
          <p>📹 Detecta 1 o 2 manos automáticamente</p>
          <p>🔄 Botón superior derecho para cambiar cámara</p>
        </div>
      </div>
    </div>
  );
};
