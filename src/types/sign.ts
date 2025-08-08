
export interface Sign {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  videoBlob?: Blob;
  landmarks: {
    leftHand?: number[][][]; // Array de frames para mano izquierda
    rightHand?: number[][][]; // Array de frames para mano derecha
    bothHands?: number[][][]; // Array de frames cuando se detectan ambas manos
  };
  handType: 'left' | 'right' | 'both'; // Tipo de seña según las manos usadas
  confidence: number;
  createdAt: Date;
  voiceAlert?: string;
}

export interface DetectionResult {
  sign: Sign;
  confidence: number;
  timestamp: Date;
}
