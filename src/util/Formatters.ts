export const dateFormatter = (year: number, month: number, day: number) => {
    return `${year}-${month + 1}-${day}`;
};

export const currencyFormatter = (n: number) => {
    return `$${n.toFixed(2)}`;
};