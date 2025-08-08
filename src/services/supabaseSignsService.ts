
import { supabase } from '@/lib/supabase';
import { Sign } from '@/types/sign';

export class SupabaseSignsService {
  
  async createSignsTable() {
    try {
      const { error } = await supabase.rpc('create_signs_table_if_not_exists');
      if (error) {
        console.log('Tabla ya existe o se creó exitosamente');
      }
    } catch (error) {
      console.error('❌ Error creando tabla:', error);
      throw error;
    }
  }

  async addSign(sign: Omit<Sign, 'id' | 'createdAt'>): Promise<Sign> {
    console.log('🚀 Iniciando proceso de guardado de seña:', sign.name);
    
    // Subir video a storage si existe
    let videoUrl = sign.videoUrl;
    
    if (sign.videoBlob) {
      try {
        console.log('📁 Subiendo video a Supabase Storage...');
        const fileName = `${Date.now()}-${sign.name.replace(/\s+/g, '-')}.webm`;
        
        // Verificar conexión con Supabase antes de subir
        const { data: healthCheck, error: healthError } = await supabase
          .from('signs')
          .select('count')
          .limit(1);
        
        if (healthError && healthError.code !== 'PGRST116') { // PGRST116 = tabla no existe, es normal
          console.error('❌ Error de conectividad con Supabase:', healthError);
          throw new Error(`Error de conexión con Supabase: ${healthError.message}`);
        }
        
        console.log('✅ Conexión con Supabase verificada');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sign-videos')
          .upload(fileName, sign.videoBlob, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('❌ Error subiendo video:', uploadError);
          throw new Error(`Error subiendo video: ${uploadError.message}`);
        } else {
          console.log('✅ Video subido exitosamente:', uploadData.path);
          const { data: { publicUrl } } = supabase.storage
            .from('sign-videos')
            .getPublicUrl(fileName);
          videoUrl = publicUrl;
          console.log('🔗 URL pública generada:', videoUrl);
        }
      } catch (error) {
        console.error('❌ Error en proceso de subida de video:', error);
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            throw new Error('Sin conexión a internet o Supabase no disponible. Verifica tu conexión.');
          } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            throw new Error('No se puede conectar a Supabase. Verifica la configuración de red.');
          }
        }
        throw error;
      }
    }

    const newSign = {
      name: sign.name,
      description: sign.description,
      video_url: videoUrl,
      landmarks: sign.landmarks,
      hand_type: sign.handType,
      confidence: sign.confidence,
      voice_alert: sign.voiceAlert || ''
    };

    console.log('💾 Guardando datos de seña en base de datos...');

    try {
      const { data, error } = await supabase
        .from('signs')
        .insert([newSign])
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando en base de datos:', error);
        throw new Error(`Error guardando en base de datos: ${error.message}`);
      }

      console.log('✅ Seña guardada exitosamente en base de datos:', data.id);

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        videoUrl: data.video_url,
        landmarks: data.landmarks,
        handType: data.hand_type,
        confidence: data.confidence,
        voiceAlert: data.voice_alert,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('❌ Error en proceso de guardado en BD:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Sin conexión a internet o Supabase no disponible. Verifica tu conexión.');
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('No se puede conectar a Supabase. Verifica la configuración de red.');
        }
      }
      throw error;
    }
  }

  async getAllSigns(): Promise<Sign[]> {
    try {
      console.log('📖 Cargando señas desde base de datos...');
      const { data, error } = await supabase
        .from('signs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando señas:', error);
        throw new Error(`Error cargando señas: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} señas cargadas exitosamente`);

      return data.map(sign => ({
        id: sign.id,
        name: sign.name,
        description: sign.description,
        videoUrl: sign.video_url,
        landmarks: sign.landmarks,
        handType: sign.hand_type,
        confidence: sign.confidence,
        voiceAlert: sign.voice_alert,
        createdAt: new Date(sign.created_at)
      }));
    } catch (error) {
      console.error('❌ Error en proceso de carga:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Sin conexión a internet o Supabase no disponible. Verifica tu conexión.');
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('No se puede conectar a Supabase. Verifica la configuración de red.');
        }
      }
      throw error;
    }
  }

  async deleteSign(id: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando seña:', id);
      const { error } = await supabase
        .from('signs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando seña:', error);
        throw new Error(`Error eliminando seña: ${error.message}`);
      }

      console.log('✅ Seña eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error en proceso de eliminación:', error);
      throw error;
    }
  }

  async updateSign(id: string, updates: Partial<Sign>): Promise<void> {
    try {
      console.log('✏️ Actualizando seña:', id);
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.voiceAlert !== undefined) updateData.voice_alert = updates.voiceAlert;

      const { error } = await supabase
        .from('signs')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Error actualizando seña:', error);
        throw new Error(`Error actualizando seña: ${error.message}`);
      }

      console.log('✅ Seña actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error en proceso de actualización:', error);
      throw error;
    }
  }

  async deleteSigns(ids: string[]): Promise<void> {
    try {
      console.log('🗑️ Eliminando múltiples señas:', ids.length);
      const { error } = await supabase
        .from('signs')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('❌ Error eliminando señas:', error);
        throw new Error(`Error eliminando señas: ${error.message}`);
      }

      console.log('✅ Señas eliminadas exitosamente');
    } catch (error) {
      console.error('❌ Error en proceso de eliminación múltiple:', error);
      throw error;
    }
  }

  // Método para diagnosticar conexión
  async testConnection(): Promise<{ connected: boolean, error?: string }> {
    try {
      console.log('🔍 Probando conexión con Supabase...');
      const { data, error } = await supabase
        .from('signs')
        .select('count')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        return { connected: false, error: error.message };
      }
      
      console.log('✅ Conexión con Supabase exitosa');
      return { connected: true };
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }
}

export const supabaseSignsService = new SupabaseSignsService();
