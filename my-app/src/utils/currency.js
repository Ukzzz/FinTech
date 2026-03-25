// src/utils/currency.js
export const formatPKR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'PKR 0';
  }
  
  const number = parseFloat(amount);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatPKRWithDecimals = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'PKR 0.00';
  }
  
  const number = parseFloat(amount);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

export const parsePKR = (pkrString) => {
  if (!pkrString) return 0;
  return parseFloat(pkrString.replace(/[^\d.-]/g, ''));
};

export const formatLargeNumber = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'PKR 0';
  }
  
  const number = parseFloat(amount);
  
  if (number >= 10000000) { // 1 Crore
    return `PKR ${(number / 10000000).toFixed(1)}Cr`;
  } else if (number >= 100000) { // 1 Lakh
    return `PKR ${(number / 100000).toFixed(1)}L`;
  } else if (number >= 1000) { // 1 Thousand
    return `PKR ${(number / 1000).toFixed(1)}K`;
  }
  
  return formatPKR(number);
};
