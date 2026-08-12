// Human-friendly, sortable order number e.g. AB-20260711-4821
export const generateOrderNumber = () => {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AB-${ymd}-${rand}`;
};
