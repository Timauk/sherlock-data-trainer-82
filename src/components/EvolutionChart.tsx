import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface EvolutionChartProps {
  data: any[];
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ data }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Evolução das Gerações</h3>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="generation" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};

export default EvolutionChart;