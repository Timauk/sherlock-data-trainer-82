export function processarCSV(text: string) {
  const linhas = text.trim().split("\n").slice(1); // Ignorar cabeçalho
  const dados = [];

  for (const linha of linhas) {
    const valores = linha.split(",");
    const numeroConcurso = Number(valores[0]);  
    const dataSorteio = new Date(valores[1].split("/").reverse().join("-")).getTime();  
    const bolas = valores.slice(2, 17).map(Number);  

    if (bolas.length === 15 && bolas.every(num => !isNaN(num))) {
      dados.push({ numeroConcurso, dataSorteio, bolas });
    }
  }

  if (dados.length === 0) {
    throw new Error("Nenhum dado válido encontrado!");
  }

  return normalizarDados(dados);
}

export function normalizarDados(dados: any[]) {
  const maxConcurso = Math.max(...dados.map(d => d.numeroConcurso));
  const minData = Math.min(...dados.map(d => d.dataSorteio));
  const maxData = Math.max(...dados.map(d => d.dataSorteio));

  return dados.map(d => ({
    bolas: d.bolas.map(bola => bola / 25), // Normaliza as bolas
    numeroConcurso: d.numeroConcurso / maxConcurso, // Normaliza o número do concurso
    dataSorteio: (d.dataSorteio - minData) / (maxData - minData) // Normaliza a data
  }));
}