
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sign, DetectionResult } from '@/types/sign';
import { useSigns } from '@/hooks/useSigns';
import { useHandpose } from '@/hooks/useHandpose';
import { useCustomSignDetection } from '@/hooks/useCustomSignDetection';
import { toast } from 'sonner';
import { safeAsync, safeSync } from '@/utils/errorHandler';

export const useSignDetection = (videoElement: HTMLVideoElement | null) => {
  const [detectedSign, setDetectedSign] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { signs } = useSigns();
  const { predictions, isModelLoaded } = useHandpose(videoElement);
  const { detectCustomSign } = useCustomSignDetection();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const detectionCountdownRef = useRef<number>(0);
  const detectionSamplesRef = useRef<Array<{signName: string, confidence: number, sign: Sign}>>([]);
  const countdownIntervalRef = useRef<number | null>(null);
  const isDestroyedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  
  const DETECTION_COOLDOWN = 200;
  const DETECTION_TIMEOUT = 10000;
  const SAMPLE_THRESHOLD = 2;
  const COUNTDOWN_DURATION = 3;

  const canDetect = useCallback(() => {
    const now = Date.now();
    return (now - lastDetectionRef.current) > DETECTION_COOLDOWN;
  }, []);

  // Función mejorada para obtener coordenadas precisas con manejo de errores
  const getPreciseCoordinates = useCallback((landmark: number[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    return safeSync(() => {
      if (!landmark || landmark.length < 2 || !canvas || !video) {
        return { x: 0, y: 0 };
      }

      const videoRect = video.getBoundingClientRect();
      
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const displayAspectRatio = videoRect.width / videoRect.height;
      
      let displayWidth = videoRect.width;
      let displayHeight = videoRect.height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (videoAspectRatio > displayAspectRatio) {
        displayHeight = videoRect.width / videoAspectRatio;
        offsetY = (videoRect.height - displayHeight) / 2;
      } else if (videoAspectRatio < displayAspectRatio) {
        displayWidth = videoRect.height * videoAspectRatio;
        offsetX = (videoRect.width - displayWidth) / 2;
      }
      
      const x = (landmark[0] * displayWidth) + offsetX;
      const y = (landmark[1] * displayHeight) + offsetY;
      
      return { x: Math.round(x), y: Math.round(y) };
    }, { x: 0, y: 0 }, 'Error en getPreciseCoordinates');
  }, []);

  // Función de dibujo con manejo de errores mejorado
  const drawPredictions = useCallback(() => {
    if (isDestroyedRef.current || processingRef.current) return;
    
    // Evitar procesamiento concurrente
    processingRef.current = true;
    
    try {
      if (!canvasRef.current || !predictions.length || !videoElement) {
        processingRef.current = false;
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || !videoElement) {
        processingRef.current = false;
        return;
      }
      
      // Limpiar canvas de forma segura
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.warn('Error limpiando canvas:', error);
        processingRef.current = false;
        return;
      }
      
      // Procesar predicciones de forma segura
      let hasValidPrediction = false;
      
      predictions.forEach((prediction) => {
        try {
          if (prediction.landmarks && prediction.landmarks.length === 21) {
            hasValidPrediction = true;
            
            const isLeftHand = prediction.handedness === 'Left';
            const primaryColor = isLeftHand ? '#10B981' : '#EF4444';
            const secondaryColor = isLeftHand ? '#059669' : '#DC2626';
            
            // Dibujar conexiones de forma segura
            try {
              drawHandConnections(ctx, prediction.landmarks, canvas, videoElement, primaryColor);
            } catch (error) {
              console.warn('Error dibujando conexiones:', error);
            }
            
            // Dibujar puntos de forma segura
            prediction.landmarks.forEach((landmark: number[], index: number) => {
              try {
                if (!landmark || landmark.length < 2) return;
                
                const coords = getPreciseCoordinates(landmark, canvas, videoElement);
                
                if (coords.x < 0 || coords.x > canvas.width || coords.y < 0 || coords.y > canvas.height) {
                  return;
                }
                
                const isWrist = index === 0;
                const isFingerTip = [4, 8, 12, 16, 20].includes(index);
                
                let radius = isWrist ? 8 : (isFingerTip ? 6 : 4);
                let fillColor = isWrist ? primaryColor : secondaryColor;
                
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
              } catch (error) {
                console.warn('Error dibujando punto:', error);
              }
            });
          }
        } catch (error) {
          console.warn('Error procesando predicción:', error);
        }
      });
      
      // Actualizar estado de detección de forma segura
      if (hasValidPrediction !== isDetecting) {
        setIsDetecting(hasValidPrediction);
      }

      // Procesar detección de señas de forma async para evitar bloqueos
      if (canDetect() && detectionCountdownRef.current > 0 && signs.length > 0 && predictions.length > 0) {
        // Usar setTimeout para evitar bloqueos del hilo principal
        setTimeout(() => {
          processSignDetection();
        }, 0);
      }
    } catch (error) {
      console.warn('Error general en drawPredictions:', error);
    } finally {
      processingRef.current = false;
    }
  }, [predictions, signs, videoElement, canDetect, isDetecting, getPreciseCoordinates]);

  // Función separada para procesar detección de señas
  const processSignDetection = useCallback(() => {
    if (isDestroyedRef.current || processingRef.current) return;
    
    try {
      const customResult = detectCustomSign(predictions, signs);
      
      if (customResult && customResult.detected && customResult.confidence > 0.5) {
        console.log('✅ Seña detectada!', customResult.signName, 'Confianza:', customResult.confidence);
        
        detectionSamplesRef.current.push({
          signName: customResult.signName,
          confidence: customResult.confidence,
          sign: customResult.matchedSign!
        });
        
        if (detectionSamplesRef.current.length > 4) {
          detectionSamplesRef.current.shift();
        }
        
        const recentSamples = detectionSamplesRef.current.slice(-SAMPLE_THRESHOLD);
        const consistentSign = checkConsistentDetection(recentSamples);
        
        if (consistentSign) {
          const avgConfidence = recentSamples.reduce((sum, sample) => sum + sample.confidence, 0) / recentSamples.length;
          
          // Procesar detección de forma completamente async
          requestAnimationFrame(() => {
            if (!isDestroyedRef.current) {
              detectSign(avgConfidence, consistentSign);
            }
          });
        }
        
        lastDetectionRef.current = Date.now();
      }
    } catch (error) {
      console.warn('Error en processSignDetection:', error);
    }
  }, [predictions, signs, detectCustomSign]);

  const drawHandConnections = useCallback((ctx: CanvasRenderingContext2D, landmarks: number[][], canvas: HTMLCanvasElement, video: HTMLVideoElement, color: string) => {
    try {
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
      ];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      connections.forEach(([start, end]) => {
        try {
          if (landmarks[start] && landmarks[end]) {
            const startCoords = getPreciseCoordinates(landmarks[start], canvas, video);
            const endCoords = getPreciseCoordinates(landmarks[end], canvas, video);

            ctx.beginPath();
            ctx.moveTo(startCoords.x, startCoords.y);
            ctx.lineTo(endCoords.x, endCoords.y);
            ctx.stroke();
          }
        } catch (error) {
          console.warn('Error dibujando conexión:', error);
        }
      });
    } catch (error) {
      console.warn('Error en drawHandConnections:', error);
    }
  }, [getPreciseCoordinates]);
  
  const checkConsistentDetection = useCallback((samples: Array<{signName: string, confidence: number, sign: Sign}>) => {
    try {
      if (samples.length < SAMPLE_THRESHOLD) return null;
      
      const signCounts: {[key: string]: {count: number, sign: Sign}} = {};
      samples.forEach(sample => {
        if (!signCounts[sample.signName]) {
          signCounts[sample.signName] = { count: 0, sign: sample.sign };
        }
        signCounts[sample.signName].count++;
      });
      
      const mostFrequent = Object.entries(signCounts).reduce((a, b) => 
        signCounts[a[0]].count > signCounts[b[0]].count ? a : b
      );
      
      return mostFrequent[1].count >= Math.ceil(SAMPLE_THRESHOLD / 2) ? mostFrequent[1].sign : null;
    } catch (error) {
      console.warn('Error en checkConsistentDetection:', error);
      return null;
    }
  }, []);
  
  const detectSign = useCallback(async (confidence: number, sign: Sign) => {
    try {
      if (isDestroyedRef.current) return;
      
      detectionCountdownRef.current = 0;
      detectionSamplesRef.current = [];
      
      const detection: DetectionResult = {
        sign,
        confidence,
        timestamp: new Date()
      };
      
      // Actualizar estado de forma segura
      requestAnimationFrame(() => {
        if (!isDestroyedRef.current) {
          setDetectedSign(detection);
        }
      });
      
      console.log(`🎯 Seña "${sign.name}" detectada:`, detection);
      
      // Mostrar toast de forma segura y async
      setTimeout(() => {
        if (!isDestroyedRef.current) {
          try {
            toast.success(`🎯 ¡SEÑA ${sign.name.toUpperCase()} DETECTADA!`, {
              description: `Coincidencia confirmada - Confianza: ${(confidence * 100).toFixed(1)}%`,
              duration: 4000
            });
          } catch (error) {
            console.warn('Error mostrando toast:', error);
          }
        }
      }, 100);
    } catch (error) {
      console.warn('Error en detectSign:', error);
    }
  }, []);

  const dismissAlert = useCallback(() => {
    try {
      setDetectedSign(null);
    } catch (error) {
      console.warn('Error en dismissAlert:', error);
    }
  }, []);

  const startDetection = useCallback(() => {
    try {
      if (!isModelLoaded) {
        toast.error('La cámara debe estar activa primero');
        return;
      }
      
      if (signs.length === 0) {
        toast.error('No hay señas guardadas en la base de datos para comparar');
        return;
      }
      
      setCountdown(COUNTDOWN_DURATION);
      
      toast.info('🚀 Preparándose para detectar...', {
        description: 'La detección comenzará en 3 segundos',
        duration: 3000
      });
      
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            
            detectionCountdownRef.current = DETECTION_TIMEOUT;
            detectionSamplesRef.current = [];
            lastDetectionRef.current = Date.now();
            
            console.log('🚀 Iniciando comparación con', signs.length, 'señas almacenadas');
            
            setTimeout(() => {
              if (!isDestroyedRef.current) {
                try {
                  toast.success('🔍 ¡Detección iniciada!', {
                    description: `Comparando con ${signs.length} señas guardadas`,
                    duration: 3000
                  });
                } catch (error) {
                  console.warn('Error mostrando toast de inicio:', error);
                }
              }
            }, 100);
            
            setTimeout(() => {
              detectionCountdownRef.current = 0;
              detectionSamplesRef.current = [];
            }, DETECTION_TIMEOUT);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.warn('Error en startDetection:', error);
    }
  }, [isModelLoaded, signs]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      isDestroyedRef.current = true;
      processingRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Dibujar con requestAnimationFrame más seguro
  useEffect(() => {
    const animate = () => {
      if (!isDestroyedRef.current && isModelLoaded && canvasRef.current && !processingRef.current) {
        try {
          drawPredictions();
        } catch (error) {
          console.warn('Error en animate:', error);
        }
      }
      if (!isDestroyedRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (isModelLoaded && !isDestroyedRef.current) {
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isModelLoaded, drawPredictions]);

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    console.log('🎨 Canvas ref establecido:', !!canvas);
  }, []);

  return {
    detectedSign,
    isDetecting: isDetecting && isModelLoaded,
    setCanvasRef,
    startDetection,
    dismissAlert,
    isDetectionActive: detectionCountdownRef.current > 0,
    timeRemaining: Math.ceil(detectionCountdownRef.current / 1000),
    countdown
  };
};
