import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
}

export const ImageUploader = ({ onImagesChange }: ImageUploaderProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file as any));
    setPreviews(prev => [...prev, ...newPreviews]);
    
    onImagesChange(newFiles);
  }, [files, onImagesChange]);

  const removeImage = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    onImagesChange(newFiles);
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
  }, [files, previews, onImagesChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square rounded-xl border border-gray-200 overflow-hidden group">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur rounded-full text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs font-semibold text-gray-500">Adicionar Imagem</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
      
      {previews.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-gray-500 text-sm italic">
          <ImageIcon className="w-5 h-5" />
          <span>Mínimo de uma imagem obrigatória</span>
        </div>
      )}
    </div>
  );
};
