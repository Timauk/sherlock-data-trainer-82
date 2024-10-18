import React from 'react';

interface BoardDisplayProps {
  numbers: number[];
  concursoNumber: number;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({ numbers, concursoNumber }) => {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Quadro (Banca) - Concurso #{concursoNumber}</h3>
      <div className="bg-gray-100 p-4 rounded-lg">
        {numbers.map((number, index) => (
          <span key={index} className="inline-block bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
            {number}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BoardDisplay;