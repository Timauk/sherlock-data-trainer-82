import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';

interface DataUploaderProps {
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, binFile: File) => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onCsvUpload, onModelUpload }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="csvInput" className="block mb-2">Carregar CSV de Jogos:</label>
        <input
          type="file"
          id="csvInput"
          accept=".csv"
          onChange={(e) => e.target.files && onCsvUpload(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div>
        <label htmlFor="modelInput" className="block mb-2">Carregar Modelo Treinado:</label>
        <input
          type="file"
          id="modelJsonInput"
          accept=".json"
          onChange={(e) => e.target.files && onModelUpload(e.target.files[0], null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <input
          type="file"
          id="modelBinInput"
          accept=".bin"
          onChange={(e) => e.target.files && onModelUpload(null, e.target.files[0])}
          className="block w-full mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
};

export default DataUploader;