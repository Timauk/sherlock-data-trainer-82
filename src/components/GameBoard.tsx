import React from 'react';
import BoardDisplay from './BoardDisplay';
import PlayerList from './PlayerList';
import EvolutionChart from './EvolutionChart';

interface GameBoardProps {
  boardNumbers: number[];
  players: { id: number; score: number; predictions: number[] }[];
  evolutionData: any[];
}

const GameBoard: React.FC<GameBoardProps> = ({ boardNumbers, players, evolutionData }) => {
  return (
    <div>
      <BoardDisplay numbers={boardNumbers} />
      <PlayerList players={players} />
      <EvolutionChart data={evolutionData} />
    </div>
  );
};

export default GameBoard;