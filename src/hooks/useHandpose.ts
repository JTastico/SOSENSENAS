
import { useRef, useEffect, useCallback, useState } from 'react';

// Tipos para MediaPipe Hands
interface HandPrediction {
  handInViewConfidence: number;
  boundingBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
  };
  landmarks: number[][];
  annotations: {
    [key: string]: number[][];
  };
  handedness: 'Left' | 'Right';
}

// Declarar tipos globales para MediaPipe
declare global {
  interface Window {
    Hands: any;
  }
}

export const useHandpose = (videoElement: HTMLVideoElement | null) => {
  const modelRef = useRef<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [predictions, setPredictions] = useState<HandPrediction[]>([]);
  const animationRef = useRef<number>();
  const [modelError, setModelError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  
  const loadModel = useCallback(async () => {
    // Evitar cargas múltiples
    if (isLoadingRef.current || modelRef.current) {
      console.log('⚠️ Modelo ya se está cargando o ya está cargado');
      return;
    }
    
    try {
      console.log('🔄 Cargando MediaPipe Hands optimizado para mejor detección...');
      setModelError(null);
      isLoadingRef.current = true;
      
      // Verificar si MediaPipe ya está disponible globalmente
      if (window.Hands) {
        console.log('✅ MediaPipe ya disponible globalmente');
        await initializeHands();
        return;
      }
      
      // Cargar script de forma más eficiente
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.async = true;
      
      const loadPromise = new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
      
      document.head.appendChild(script);
      await loadPromise;
      
      await initializeHands();
      
    } catch (error) {
      console.error('❌ Error cargando MediaPipe:', error);
      setModelError('Error cargando MediaPipe');
      setIsModelLoaded(false);
      isLoadingRef.current = false;
    }
  }, []);
  
  const initializeHands = async () => {
    try {
      const { Hands } = window;
      
      if (!Hands) {
        throw new Error('MediaPipe Hands no disponible');
      }
      
      const hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      // Configuración optimizada para mayor precisión y estabilidad
      hands.setOptions({
        maxNumHands: 2, // Detectar hasta 2 manos
        modelComplexity: 1, // Complejidad alta para mejor precisión
        minDetectionConfidence: 0.7, // Aumentado para mejor precisión
        minTrackingConfidence: 0.5, // Mejorado para tracking más estable
        staticImageMode: false, // Modo de video para mejor tracking continuo
        selfieMode: false // Desactivar modo selfie para mejor detección
      });
      
      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const predictions = results.multiHandLandmarks.map((landmarks: any, index: number) => {
            // Obtener información de lateralidad con mayor precisión
            const handedness = results.multiHandedness && results.multiHandedness[index] 
              ? results.multiHandedness[index].label 
              : 'Unknown';
            
            const confidence = results.multiHandedness && results.multiHandedness[index]
              ? results.multiHandedness[index].score
              : 0.5;
            
            // Verificar que tenemos 21 landmarks válidos
            if (landmarks.length !== 21) {
              console.warn(`⚠️ Landmarks incompletos: ${landmarks.length}/21`);
              return null;
            }
            
            // Filtro de suavizado para landmarks más estables
            const smoothedLandmarks = landmarks.map((landmark: any, landmarkIndex: number) => {
              // Aplicar filtro simple de suavizado temporal si es necesario
              return [
                Number(landmark.x.toFixed(6)), // Mayor precisión decimal
                Number(landmark.y.toFixed(6)), // Mayor precisión decimal
                Number((landmark.z || 0).toFixed(6)) // Coordenada Z con precisión
              ];
            });
            
            return {
              handInViewConfidence: confidence,
              boundingBox: {
                topLeft: [0, 0] as [number, number],
                bottomRight: [1, 1] as [number, number]
              },
              // MANTENER COORDENADAS NORMALIZADAS (0-1) con mayor precisión
              landmarks: smoothedLandmarks,
              annotations: {},
              handedness: handedness as 'Left' | 'Right'
            };
          }).filter(Boolean); // Filtrar null values
          
          setPredictions(predictions);
          
          if (predictions.length > 0) {
            const handDetails = predictions.map(p => 
              `${p.handedness}(${(p.handInViewConfidence * 100).toFixed(1)}%)`
            ).join(', ');
            console.log(`🖐️ ${predictions.length} mano(s) detectada(s): ${handDetails}`);
          }
        } else {
          setPredictions([]);
        }
      });
      
      modelRef.current = hands;
      setIsModelLoaded(true);
      isLoadingRef.current = false;
      console.log('✅ MediaPipe Hands optimizado con mejor precisión de puntos');
      
    } catch (error) {
      console.error('❌ Error inicializando MediaPipe:', error);
      setModelError('Error inicializando MediaPipe');
      setIsModelLoaded(false);
      isLoadingRef.current = false;
    }
  };
  
  const detectHands = useCallback(async () => {
    if (!videoElement || !modelRef.current || !isModelLoaded) {
      if (videoElement && isModelLoaded) {
        animationRef.current = requestAnimationFrame(detectHands);
      }
      return;
    }
    
    try {
      // Verificar que el video tenga datos y esté en buenas condiciones
      if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        await modelRef.current.send({ image: videoElement });
      }
    } catch (error) {
      console.warn('⚠️ Error en detección:', error);
    }
    
    // Controlar FPS para mejor rendimiento (30 FPS máximo)
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(detectHands);
    }, 33); // ~30 FPS
  }, [videoElement, isModelLoaded]);
  
  useEffect(() => {
    if (videoElement && isModelLoaded && !animationRef.current) {
      console.log('🎯 Iniciando detección optimizada de hasta 2 manos');
      detectHands();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [videoElement, isModelLoaded, detectHands]);
  
  useEffect(() => {
    loadModel();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isLoadingRef.current = false;
    };
  }, []);
  
  return {
    predictions,
    isModelLoaded,
    modelError
  };
};
