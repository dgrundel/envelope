const DECIMAL_SEPARATOR = '.';

export const dateFormatter = (year: number, month: number, day: number) => {
    return `${year}-${month + 1}-${day}`;
};

export const currencyFormatter = (whole: number, fractional: number) => {
    const cents = Math.ceil(fractional / 10);

    return `$${whole}${DECIMAL_SEPARATOR}${cents}`;
};