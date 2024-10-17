import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionChartProps {
  data: any[];
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ data }) => {
  const playerIds = [...new Set(data.map(item => item.playerId))];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Evolução das Gerações por Jogador</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis />
          <Tooltip />
          <Legend />
          {playerIds.map((playerId, index) => (
            <Line
              key={playerId}
              type="monotone"
              dataKey="score"
              data={data.filter(item => item.playerId === playerId)}
              name={`Jogador ${playerId}`}
              stroke={colors[index % colors.length]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvolutionChart;