const sumArray = (array: number[]) => {
  const sum = array.reduce((a, b) => a + b, 0);

  return sum;
};

const percentChange = (startpos: number, currentpos: number) => {
  let displacement = currentpos - startpos;
  let change = Math.round(displacement / Math.abs(startpos)) * 100;

  return change;
};

export { sumArray, percentChange };
