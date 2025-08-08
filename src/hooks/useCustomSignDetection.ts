
import { useCallback } from 'react';
import { Sign } from '@/types/sign';

interface HandPrediction {
  landmarks: number[][];
  handedness: 'Left' | 'Right';
  handInViewConfidence: number;
}

export const useCustomSignDetection = () => {
  
  const detectCustomSign = useCallback((predictions: HandPrediction[], storedSigns: Sign[]) => {
    if (!predictions || predictions.length === 0) {
      console.log('❌ No hay predicciones de manos');
      return { detected: false, confidence: 0, signName: '', matchedSign: null };
    }
    
    console.log(`🔍 Comparando ${predictions.length} mano(s) detectada(s) con ${storedSigns.length} señas almacenadas`);
    
    let bestMatch = { confidence: 0, signName: '', matchedSign: null as Sign | null };
    
    // Separar manos por lateralidad y ordenar por confianza
    const leftHands = predictions.filter(p => p.handedness === 'Left').sort((a, b) => b.handInViewConfidence - a.handInViewConfidence);
    const rightHands = predictions.filter(p => p.handedness === 'Right').sort((a, b) => b.handInViewConfidence - a.handInViewConfidence);
    
    const leftHand = leftHands[0]; // Tomar la mano con mayor confianza
    const rightHand = rightHands[0]; // Tomar la mano con mayor confianza
    
    console.log('👋 Manos detectadas:', {
      izquierda: leftHand ? `${(leftHand.handInViewConfidence * 100).toFixed(0)}%` : 'No',
      derecha: rightHand ? `${(rightHand.handInViewConfidence * 100).toFixed(0)}%` : 'No',
      total: predictions.length
    });
    
    // Comparar con cada seña almacenada
    for (const sign of storedSigns) {
      if (!sign.landmarks) continue;
      
      let maxSimilarity = 0;
      
      console.log(`🔍 Comparando con seña "${sign.name}" (${sign.handType})`);
      
      // Estrategia mejorada para detección de múltiples manos
      if (sign.handType === 'both') {
        if (leftHand && rightHand && sign.landmarks.bothHands && sign.landmarks.bothHands.length > 0) {
          // Caso ideal: ambas manos detectadas para seña de ambas manos
          for (const frameData of sign.landmarks.bothHands) {
            const combinedLandmarks = [...leftHand.landmarks, ...rightHand.landmarks];
            const similarity = compareHandLandmarks(combinedLandmarks, frameData);
            maxSimilarity = Math.max(maxSimilarity, similarity);
            console.log(`  📊 Similitud frame (ambas manos):`, similarity.toFixed(3));
          }
        } else if ((leftHand || rightHand) && sign.landmarks.bothHands && sign.landmarks.bothHands.length > 0) {
          // Solo una mano detectada para seña de ambas manos - comparar con las mitades
          const availableHand = leftHand || rightHand;
          const isLeftAvailable = !!leftHand;
          
          for (const frameData of sign.landmarks.bothHands) {
            if (frameData.length >= 42) { // Asegurar que tenemos landmarks para ambas manos
              // Dividir en dos manos (21 landmarks cada una)
              const firstHalf = frameData.slice(0, 21);
              const secondHalf = frameData.slice(21, 42);
              
              // Comparar con la mano apropiada según lateralidad
              let similarity = 0;
              if (isLeftAvailable) {
                // Probar con ambas mitades para ver cuál encaja mejor
                const sim1 = compareHandLandmarks(availableHand.landmarks, firstHalf);
                const sim2 = compareHandLandmarks(availableHand.landmarks, secondHalf);
                similarity = Math.max(sim1, sim2);
              } else {
                // Mano derecha disponible
                const sim1 = compareHandLandmarks(availableHand.landmarks, firstHalf);
                const sim2 = compareHandLandmarks(availableHand.landmarks, secondHalf);
                similarity = Math.max(sim1, sim2);
              }
              
              // Penalizar ligeramente por no tener ambas manos
              similarity *= 0.8;
              maxSimilarity = Math.max(maxSimilarity, similarity);
              console.log(`  📊 Similitud frame (una mano de dos):`, similarity.toFixed(3));
            }
          }
        }
      } else if (sign.handType === 'left' && leftHand) {
        // Seña de mano izquierda
        if (sign.landmarks.leftHand && sign.landmarks.leftHand.length > 0) {
          for (const frameData of sign.landmarks.leftHand) {
            const similarity = compareHandLandmarks(leftHand.landmarks, frameData);
            maxSimilarity = Math.max(maxSimilarity, similarity);
            console.log(`  📊 Similitud frame (mano izq):`, similarity.toFixed(3));
          }
        }
      } else if (sign.handType === 'right' && rightHand) {
        // Seña de mano derecha
        if (sign.landmarks.rightHand && sign.landmarks.rightHand.length > 0) {
          for (const frameData of sign.landmarks.rightHand) {
            const similarity = compareHandLandmarks(rightHand.landmarks, frameData);
            maxSimilarity = Math.max(maxSimilarity, similarity);
            console.log(`  📊 Similitud frame (mano der):`, similarity.toFixed(3));
          }
        }
      }
      
      console.log(`📊 Similitud máxima con "${sign.name}" (${sign.handType}):`, maxSimilarity.toFixed(3));
      
      if (maxSimilarity > bestMatch.confidence) {
        bestMatch = {
          confidence: maxSimilarity,
          signName: sign.name,
          matchedSign: sign
        };
      }
    }
    
    // Umbrales ajustados según el número de manos detectadas y tipo de seña
    let threshold = 0.55; // Umbral base más permisivo
    
    if (bestMatch.matchedSign?.handType === 'both') {
      if (predictions.length >= 2) {
        threshold = 0.6; // Ambas manos detectadas para seña de ambas manos
      } else {
        threshold = 0.5; // Solo una mano detectada para seña de ambas manos
      }
    } else {
      threshold = 0.6; // Señas de una sola mano
    }
    
    console.log(`🎯 Mejor coincidencia: "${bestMatch.signName}" con ${(bestMatch.confidence * 100).toFixed(1)}% (umbral: ${(threshold * 100).toFixed(0)}%)`);
    
    if (bestMatch.confidence > threshold) {
      console.log(`✅ Seña detectada: ${bestMatch.signName} con ${(bestMatch.confidence * 100).toFixed(1)}% de confianza`);
      return { 
        detected: true, 
        confidence: bestMatch.confidence, 
        signName: bestMatch.signName,
        matchedSign: bestMatch.matchedSign 
      };
    }
    
    return { detected: false, confidence: bestMatch.confidence, signName: '', matchedSign: null };
  }, []);
  
  // Función mejorada para comparar landmarks de manos
  const compareHandLandmarks = useCallback((current: number[][], stored: number[][]) => {
    if (!current || !stored || current.length !== stored.length) {
      console.log(`⚠️ Tamaños diferentes: current=${current?.length}, stored=${stored?.length}`);
      return 0;
    }
    
    // Normalizar ambos conjuntos de landmarks de manera más robusta
    const normalizedCurrent = normalizeLandmarksRobust(current);
    const normalizedStored = normalizeLandmarksRobust(stored);
    
    if (!normalizedCurrent || !normalizedStored) {
      console.log('⚠️ Error en normalización');
      return 0;
    }
    
    // Calcular similitud usando distancia euclidiana promedio mejorada
    let totalDistance = 0;
    let validPoints = 0;
    const pointsToCompare = Math.min(normalizedCurrent.length, normalizedStored.length);
    
    for (let i = 0; i < pointsToCompare; i++) {
      if (normalizedCurrent[i] && normalizedStored[i]) {
        const distance = euclideanDistanceRobust(normalizedCurrent[i], normalizedStored[i]);
        if (!isNaN(distance) && isFinite(distance)) {
          totalDistance += distance;
          validPoints++;
        }
      }
    }
    
    if (validPoints === 0) {
      console.log('⚠️ No hay puntos válidos para comparar');
      return 0;
    }
    
    const averageDistance = totalDistance / validPoints;
    
    // Función de similitud mejorada con escala ajustada
    const maxDistance = 0.3; // Ajustado para landmarks normalizados
    const similarity = Math.max(0, Math.min(1, 1 - (averageDistance / maxDistance)));
    
    return similarity;
  }, []);
  
  // Normalización más robusta
  const normalizeLandmarksRobust = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length === 0) return null;
    
    try {
      const wrist = landmarks[0]; // Punto de referencia (muñeca)
      
      if (!wrist || wrist.length < 2) {
        console.log('⚠️ Muñeca inválida');
        return null;
      }
      
      // Calcular boundingbox para escala
      let minX = wrist[0], maxX = wrist[0];
      let minY = wrist[1], maxY = wrist[1];
      
      landmarks.forEach(point => {
        if (point && point.length >= 2) {
          minX = Math.min(minX, point[0]);
          maxX = Math.max(maxX, point[0]);
          minY = Math.min(minY, point[1]);
          maxY = Math.max(maxY, point[1]);
        }
      });
      
      const scaleX = maxX - minX;
      const scaleY = maxY - minY;
      const scale = Math.max(scaleX, scaleY, 0.01); // Evitar división por cero
      
      return landmarks.map(point => {
        if (!point || point.length < 2) return [0, 0, 0];
        
        return [
          (point[0] - wrist[0]) / scale, // Normalizado por escala
          (point[1] - wrist[1]) / scale, // Normalizado por escala
          point[2] || 0                  // Z si existe
        ];
      });
    } catch (error) {
      console.log('⚠️ Error en normalización:', error);
      return null;
    }
  }, []);
  
  // Distancia euclidiana más robusta
  const euclideanDistanceRobust = useCallback((point1: number[], point2: number[]) => {
    if (!point1 || !point2 || point1.length < 2 || point2.length < 2) {
      return Infinity;
    }
    
    try {
      const dx = point1[0] - point2[0];
      const dy = point1[1] - point2[1];
      const dz = (point1[2] || 0) - (point2[2] || 0);
      
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.1); // Reducir peso de Z
      
      return isNaN(distance) || !isFinite(distance) ? Infinity : distance;
    } catch (error) {
      return Infinity;
    }
  }, []);
  
  return { detectCustomSign };
};
