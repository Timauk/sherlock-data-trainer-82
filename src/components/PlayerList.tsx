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
      {players.map(player => {
        const lastScore = player.predictions.filter(num => player.predictions.includes(num)).length;
        const bgColor = lastScore >= 13 ? 'bg-yellow-200' : 'bg-gray-100';
        return (
          <div key={player.id} className={`${bgColor} p-4 rounded-lg`}>
            <h4 className="font-semibold">Jogador {player.id}</h4>
            <p>Pontuação Total: {Math.round(player.score)}</p>
            <p>Última Pontuação: {lastScore}</p>
            <p>Previsões: {player.predictions.join(', ')}</p>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;