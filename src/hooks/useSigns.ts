
import { useState, useEffect } from 'react';
import { Sign } from '@/types/sign';
import { supabaseSignsService } from '@/services/supabaseSignsService';
import { toast } from 'sonner';

interface NewSignData {
  name: string;
  description: string;
  voiceAlert?: string;
  videoBlob: Blob | null;
  landmarks: {
    leftHand?: number[][][];
    rightHand?: number[][][];
    bothHands?: number[][][];
  };
  handType: 'left' | 'right' | 'both';
}

interface EditSignData {
  id: string;
  name: string;
  description: string;
  voiceAlert?: string;
}

export const useSigns = () => {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar señas al inicializar
  useEffect(() => {
    const loadSignsFromSupabase = async () => {
      try {
        setLoading(true);
        
        // Probar conexión primero
        const connectionTest = await supabaseSignsService.testConnection();
        if (!connectionTest.connected) {
          console.error('❌ Sin conexión a Supabase:', connectionTest.error);
          toast.error('Sin conexión a la base de datos', {
            description: connectionTest.error || 'Verifica tu conexión a internet'
          });
          return;
        }
        
        await supabaseSignsService.createSignsTable();
        const loadedSigns = await supabaseSignsService.getAllSigns();
        setSigns(loadedSigns);
        console.log('✅ Señas cargadas desde Supabase:', loadedSigns.length);
      } catch (error) {
        console.error('❌ Error cargando señas:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast.error('Error cargando las señas guardadas', {
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    loadSignsFromSupabase();
  }, []);

  const addSign = async (signData: NewSignData) => {
    try {
      if (!signData.videoBlob) {
        throw new Error('Video es requerido');
      }

      // Verificar que hay landmarks para el tipo de mano especificado
      const hasLandmarks = 
        (signData.handType === 'left' && signData.landmarks.leftHand?.length) ||
        (signData.handType === 'right' && signData.landmarks.rightHand?.length) ||
        (signData.handType === 'both' && signData.landmarks.bothHands?.length);

      if (!hasLandmarks) {
        throw new Error('No se detectaron landmarks para el tipo de mano especificado');
      }

      // Probar conexión antes de intentar guardar
      const connectionTest = await supabaseSignsService.testConnection();
      if (!connectionTest.connected) {
        throw new Error(`Sin conexión a la base de datos: ${connectionTest.error}`);
      }

      const newSign = await supabaseSignsService.addSign({
        name: signData.name,
        description: signData.description,
        voiceAlert: signData.voiceAlert || '',
        videoBlob: signData.videoBlob,
        landmarks: signData.landmarks,
        handType: signData.handType,
        confidence: 1.0
      });
      
      // Actualizar estado local
      setSigns(prev => [...prev, newSign]);
      
      const totalFrames = Object.values(newSign.landmarks).reduce(
        (total, frames) => total + (frames?.length || 0), 0
      );
      
      toast.success(`Seña "${newSign.name}" guardada exitosamente`, {
        description: `${totalFrames} frames capturados para ${newSign.handType === 'both' ? 'ambas manos' : `mano ${newSign.handType === 'left' ? 'izquierda' : 'derecha'}`}${newSign.voiceAlert ? ' con alerta de voz' : ''}`
      });

      console.log('✅ Seña guardada en Supabase:', newSign);
    } catch (error) {
      console.error('❌ Error guardando seña:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error guardando la seña', {
        description: errorMessage,
        duration: 5000
      });
      throw error;
    }
  };

  const editSign = async (signData: EditSignData) => {
    try {
      // Probar conexión antes de intentar actualizar
      const connectionTest = await supabaseSignsService.testConnection();
      if (!connectionTest.connected) {
        throw new Error(`Sin conexión a la base de datos: ${connectionTest.error}`);
      }

      await supabaseSignsService.updateSign(signData.id, {
        name: signData.name,
        description: signData.description,
        voiceAlert: signData.voiceAlert || '',
      });
      
      // Actualizar estado local
      setSigns(prev => prev.map(sign => 
        sign.id === signData.id 
          ? { ...sign, name: signData.name, description: signData.description, voiceAlert: signData.voiceAlert || '' }
          : sign
      ));
      
      toast.success(`Seña "${signData.name}" actualizada exitosamente`);
      console.log('✅ Seña actualizada en Supabase');
    } catch (error) {
      console.error('❌ Error actualizando seña:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error actualizando la seña', {
        description: errorMessage
      });
      throw error;
    }
  };

  const deleteSign = async (signId: string) => {
    try {
      const signToDelete = signs.find(sign => sign.id === signId);
      if (!signToDelete) return;

      // Probar conexión antes de intentar eliminar
      const connectionTest = await supabaseSignsService.testConnection();
      if (!connectionTest.connected) {
        throw new Error(`Sin conexión a la base de datos: ${connectionTest.error}`);
      }

      await supabaseSignsService.deleteSign(signId);
      
      // Actualizar estado local
      setSigns(prev => prev.filter(sign => sign.id !== signId));
      
      toast.success(`Seña "${signToDelete.name}" eliminada`);
      console.log('✅ Seña eliminada de Supabase:', signToDelete.name);
    } catch (error) {
      console.error('❌ Error eliminando seña:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error eliminando la seña', {
        description: errorMessage
      });
    }
  };

  const clearAllSigns = async () => {
    try {
      // Probar conexión antes de intentar eliminar
      const connectionTest = await supabaseSignsService.testConnection();
      if (!connectionTest.connected) {
        throw new Error(`Sin conexión a la base de datos: ${connectionTest.error}`);
      }

      const signIds = signs.map(sign => sign.id);
      await supabaseSignsService.deleteSigns(signIds);
      
      setSigns([]);
      toast.success('Todas las señas han sido eliminadas');
      console.log('✅ Todas las señas eliminadas de Supabase');
    } catch (error) {
      console.error('❌ Error eliminando todas las señas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error eliminando las señas', {
        description: errorMessage
      });
    }
  };

  return {
    signs,
    loading,
    addSign,
    editSign,
    deleteSign,
    clearAllSigns
  };
};
