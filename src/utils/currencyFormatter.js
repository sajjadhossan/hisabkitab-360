/**
 * Smart Currency & Number Formatter
 * ---------------------------------
 * Formats numbers into clean localized currency (৳) with tabular alignment.
 * Safely parses dirty inputs (e.g., '1,250৳', '  ৫০.০০ ') into standard numbers.
 */

const BN_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumerals(num) {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (digit) => BN_NUMERALS[Number(digit)] || digit);
}

export function fromBengaliNumerals(str) {
  if (!str) return '';
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(BN_NUMERALS[i], String(i));
  }
  return res;
}

export function parseCleanAmount(input) {
  if (input === null || input === undefined || input === '') return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : input;

  const normalized = fromBengaliNumerals(String(input))
    .replace(/[^0-9.-]/g, '');

  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
}

export function formatCurrency(amount, { lang = 'bn', showSymbol = true, decimals = 0 } = {}) {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  const displayNum = lang === 'bn' ? toBengaliNumerals(formatted) : formatted;
  const symbol = showSymbol ? (lang === 'bn' ? '৳ ' : 'BDT ') : '';

  return `${symbol}${displayNum}`;
}
