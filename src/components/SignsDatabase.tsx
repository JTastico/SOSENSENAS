import React, { useState } from 'react';
import { useSigns } from '@/hooks/useSigns';
import { VideoRecorder } from '@/components/VideoRecorder';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Trash2, Plus, Video, Loader2, Volume2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Sign } from '@/types/sign';

export const SignsDatabase: React.FC = () => {
  const { signs, loading, addSign, editSign, deleteSign } = useSigns();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [viewVideoSign, setViewVideoSign] = useState<Sign | null>(null);
  const [editingSign, setEditingSign] = useState<Sign | null>(null);
  const [newSign, setNewSign] = useState({
    name: '',
    description: '',
    voiceAlert: '',
    videoBlob: null as Blob | null,
    landmarks: {
      leftHand: [] as number[][][],
      rightHand: [] as number[][][],
      bothHands: [] as number[][][]
    },
    handType: 'both' as 'left' | 'right' | 'both'
  });

  const handleAddSign = async () => {
    if (!newSign.name.trim() || !newSign.description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!newSign.videoBlob) {
      toast.error('Por favor graba un video de la seña');
      return;
    }

    // Verificar que hay landmarks para el tipo de mano especificado
    const hasLandmarks = 
      (newSign.handType === 'left' && newSign.landmarks.leftHand.length > 0) ||
      (newSign.handType === 'right' && newSign.landmarks.rightHand.length > 0) ||
      (newSign.handType === 'both' && newSign.landmarks.bothHands.length > 0);

    if (!hasLandmarks) {
      toast.error('No se detectaron landmarks para el tipo de mano especificado');
      return;
    }

    try {
      setIsSubmitting(true);
      await addSign(newSign);
      setIsDialogOpen(false);
      setShowVideoRecorder(false);
      setNewSign({ 
        name: '', 
        description: '', 
        voiceAlert: '', 
        videoBlob: null, 
        landmarks: { leftHand: [], rightHand: [], bothHands: [] },
        handType: 'both'
      });
    } catch (error) {
      console.error('Error adding sign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoRecorded = (
    videoBlob: Blob, 
    landmarks: { leftHand?: number[][][]; rightHand?: number[][][]; bothHands?: number[][][]; }, 
    handType: 'left' | 'right' | 'both'
  ) => {
    setNewSign({ 
      ...newSign, 
      videoBlob, 
      landmarks: {
        leftHand: landmarks.leftHand || [],
        rightHand: landmarks.rightHand || [],
        bothHands: landmarks.bothHands || []
      },
      handType 
    });
    setShowVideoRecorder(false);
    
    const totalFrames = (landmarks.leftHand?.length || 0) + 
                       (landmarks.rightHand?.length || 0) + 
                       (landmarks.bothHands?.length || 0);
    
    toast.success(`Video grabado con ${totalFrames} frames de landmarks para ${handType === 'both' ? 'ambas manos' : `mano ${handType === 'left' ? 'izquierda' : 'derecha'}`}`);
  };

  const handleEditSign = async () => {
    if (!editingSign || !editingSign.name.trim() || !editingSign.description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setIsSubmitting(true);
      await editSign({
        id: editingSign.id,
        name: editingSign.name,
        description: editingSign.description,
        voiceAlert: editingSign.voiceAlert || ''
      });
      setEditingSign(null);
    } catch (error) {
      console.error('Error editing sign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSign = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la seña "${name}"?`)) {
      await deleteSign(id);
    }
  };

  const getTotalFrames = (landmarks: { leftHand?: number[][][]; rightHand?: number[][][]; bothHands?: number[][][]; }) => {
    return (landmarks.leftHand?.length || 0) + 
           (landmarks.rightHand?.length || 0) + 
           (landmarks.bothHands?.length || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 sm:p-4 md:p-6 lg:p-8">
        <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm border border-blue-200 shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm sm:text-base text-gray-700">Cargando señas...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <Card className="p-4 sm:p-6 bg-white/90 backdrop-blur-sm border border-blue-200 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Base de Datos de Señas
              </h2>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg">
                  <Plus className="w-4 h-4" />
                  <span>Agregar Seña</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[98vw] sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] max-w-[1200px] h-[95vh] max-h-[95vh] mx-auto flex flex-col bg-gradient-to-br from-white to-blue-50">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Grabar Nueva Seña
                  </DialogTitle>
                </DialogHeader>
                
                {!showVideoRecorder ? (
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Nombre de la Seña
                        </label>
                        <Input
                          id="name"
                          value={newSign.name}
                          onChange={(e) => setNewSign({ ...newSign, name: e.target.value })}
                          placeholder="Ej: Hola, Amor, Paz"
                          className="w-full border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <Textarea
                          id="description"
                          value={newSign.description}
                          onChange={(e) => setNewSign({ ...newSign, description: e.target.value })}
                          placeholder="Describe cómo hacer la seña..."
                          className="w-full min-h-[80px] border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="voiceAlert" className="text-sm font-medium flex items-center space-x-2 text-gray-700">
                          <Volume2 className="w-4 h-4 text-purple-500" />
                          <span>Alerta de Voz</span>
                        </label>
                        <Textarea
                          id="voiceAlert"
                          value={newSign.voiceAlert}
                          onChange={(e) => setNewSign({ ...newSign, voiceAlert: e.target.value })}
                          placeholder="Mensaje que se reproducirá cuando se detecte esta seña..."
                          className="w-full min-h-[60px] border-blue-200 focus:border-blue-400"
                        />
                        <p className="text-xs text-gray-500">
                          Este mensaje se reproducirá por voz durante 15 segundos cuando se detecte la seña
                        </p>
                      </div>
                      
                      {newSign.videoBlob && (
                        <div className="mt-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2">
                            <Video className="w-5 h-5 text-green-600" />
                            <span className="text-green-800 font-medium text-sm sm:text-base">Video grabado exitosamente</span>
                          </div>
                          <p className="text-green-600 text-xs sm:text-sm mt-1">
                            {getTotalFrames(newSign.landmarks)} frames con landmarks capturados para {newSign.handType === 'both' ? 'ambas manos' : `mano ${newSign.handType === 'left' ? 'izquierda' : 'derecha'}`}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowVideoRecorder(true)}
                          className="flex items-center space-x-2 w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Video className="w-4 h-4" />
                          <span>{newSign.videoBlob ? 'Grabar de Nuevo' : 'Grabar Video'}</span>
                        </Button>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleAddSign} 
                            disabled={isSubmitting || !newSign.videoBlob}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              'Guardar Seña'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <VideoRecorder
                      onVideoRecorded={handleVideoRecorded}
                      onCancel={() => setShowVideoRecorder(false)}
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {signs.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Video className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-lg mb-2 text-gray-700 font-medium">No hay señas grabadas</p>
                <p className="text-sm text-gray-500">¡Graba tu primera seña con detección avanzada!</p>
              </div>
            ) : (
              signs.map((sign) => (
                <Card key={sign.id} className="p-4 border-l-4 border-l-gradient-to-b from-blue-500 to-purple-500 bg-gradient-to-r from-white to-blue-50/30 hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                      {sign.videoUrl && (
                        <div className="flex-shrink-0 mx-auto sm:mx-0">
                          <div className="relative">
                            <video
                              src={sign.videoUrl}
                              className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-md"
                              muted
                              loop
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">{sign.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{sign.description}</p>
                        {sign.voiceAlert && (
                          <div className="flex items-center space-x-2 mb-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <Volume2 className="w-4 h-4 text-purple-600" />
                            <p className="text-purple-800 text-sm italic">"{sign.voiceAlert}"</p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                            Confianza: {(sign.confidence * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                            {sign.createdAt.toLocaleDateString()}
                          </Badge>
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                            {getTotalFrames(sign.landmarks)} frames
                          </Badge>
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800">
                            {sign.handType === 'both' ? '2 Manos' : `Mano ${sign.handType === 'left' ? 'Izq' : 'Der'}`}
                          </Badge>
                          {sign.voiceAlert && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                              <Volume2 className="w-3 h-3 mr-1" />
                              Alerta de Voz
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 sm:flex-none border-blue-300 text-blue-600 hover:bg-blue-50"
                        onClick={() => setViewVideoSign(sign)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 sm:flex-none border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => setEditingSign(sign)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50 flex-1 sm:flex-none border-red-300"
                        onClick={() => handleDeleteSign(sign.id, sign.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal para ver video */}
      <Dialog open={!!viewVideoSign} onOpenChange={() => setViewVideoSign(null)}>
        <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto mx-auto bg-gradient-to-br from-white to-blue-50">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {viewVideoSign?.name} - Vista del Video
            </DialogTitle>
          </DialogHeader>
          
          {viewVideoSign && (
            <div className="space-y-4">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-blue-100 rounded-lg overflow-hidden shadow-inner">
                <video
                  src={viewVideoSign.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Descripción:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewVideoSign.description}</p>
                
                {viewVideoSign.voiceAlert && (
                  <>
                    <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-purple-500" />
                      <span>Alerta de Voz:</span>
                    </h4>
                    <p className="text-purple-800 italic bg-purple-50 p-3 rounded-lg">"{viewVideoSign.voiceAlert}"</p>
                  </>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                    Confianza: {(viewVideoSign.confidence * 100).toFixed(0)}%
                  </Badge>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {viewVideoSign.createdAt.toLocaleDateString()}
                  </Badge>
                  <Badge variant="default" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                    {getTotalFrames(viewVideoSign.landmarks)} frames
                  </Badge>
                  <Badge variant="default" className="bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800">
                    {viewVideoSign.handType === 'both' ? '2 Manos' : `Mano ${viewVideoSign.handType === 'left' ? 'Izquierda' : 'Derecha'}`}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para editar seña */}
      <Dialog open={!!editingSign} onOpenChange={() => setEditingSign(null)}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto bg-gradient-to-br from-white to-purple-50">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Editar Seña: {editingSign?.name}
            </DialogTitle>
          </DialogHeader>
          
          {editingSign && (
            <div className="grid gap-4 py-4 px-2 sm:px-0">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                  Nombre de la Seña
                </label>
                <Input
                  id="edit-name"
                  value={editingSign.name}
                  onChange={(e) => setEditingSign({ ...editingSign, name: e.target.value })}
                  placeholder="Ej: Hola, Amor, Paz"
                  className="w-full border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <Textarea
                  id="edit-description"
                  value={editingSign.description}
                  onChange={(e) => setEditingSign({ ...editingSign, description: e.target.value })}
                  placeholder="Describe cómo hacer la seña..."
                  className="w-full min-h-[80px] border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="edit-voiceAlert" className="text-sm font-medium flex items-center space-x-2 text-gray-700">
                  <Volume2 className="w-4 h-4 text-purple-500" />
                  <span>Alerta de Voz</span>
                </label>
                <Textarea
                  id="edit-voiceAlert"
                  value={editingSign.voiceAlert || ''}
                  onChange={(e) => setEditingSign({ ...editingSign, voiceAlert: e.target.value })}
                  placeholder="Mensaje que se reproducirá cuando se detecte esta seña..."
                  className="w-full min-h-[60px] border-blue-200 focus:border-blue-400"
                />
                <p className="text-xs text-gray-500">
                  Este mensaje se reproducirá por voz durante 15 segundos cuando se detecte la seña
                </p>
              </div>
              
              {editingSign.videoUrl && (
                <div className="mt-2">
                  <label className="text-sm font-medium text-gray-700">Video actual:</label>
                  <div className="mt-2 aspect-video bg-gradient-to-br from-gray-100 to-blue-100 rounded-lg overflow-hidden max-w-xs shadow-inner">
                    <video
                      src={editingSign.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    El video no se puede cambiar, solo los datos de texto
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="outline" onClick={() => setEditingSign(null)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEditSign} 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
