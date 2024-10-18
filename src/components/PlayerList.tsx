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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {players.map(player => {
        const lastScore = player.predictions.length > 0 ? player.predictions.filter(num => player.predictions.includes(num)).length : 0;
        return (
          <div key={player.id} className="bg-gray-100 p-4 rounded-lg shadow">
            <h4 className="font-semibold text-lg mb-2">Jogador {player.id}</h4>
            <p className="mb-1">Pontuação Total: {player.score.toFixed(2)}</p>
            <p className="mb-1">Última Pontuação: {lastScore}</p>
            <p className="mb-1">Previsões: {player.predictions.join(', ') || 'Nenhuma previsão ainda'}</p>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;