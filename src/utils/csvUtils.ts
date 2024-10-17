export function processCSV(text: string): number[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => 
    line.split(',').map(Number).filter((_, index) => index > 1 && index <= 16)
  );
}