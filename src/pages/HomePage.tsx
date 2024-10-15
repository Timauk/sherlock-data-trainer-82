import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Treinamento de Sherlock</h1>
      <p className="mb-8">Aprenda a analisar dados como um verdadeiro detetive!</p>
      <Link to="/training" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Iniciar Treinamento
      </Link>
    </div>
  );
};

export default HomePage;