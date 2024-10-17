import React from 'react';

interface Player {
  id: number;
  score: number;
  predictions: number[];
}

interface PlayerListProps {
  players: Player[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  return (
    <div className="grid grid-cols-5 gap-4 mb-8">
      {players.map(player => (
        <div key={player.id} className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-semibold">Jogador {player.id}</h4>
          <p>Pontuação: {player.score}</p>
          <p>Previsões: {player.predictions.join(', ')}</p>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;