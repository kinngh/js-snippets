const formatPrice = (price, currencyCode, locale = "en-US") => {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  });
  return formatter.format(price);
};

// Example usage
const price = 200.0;
const currency = "USD";
console.log(`Final Price is ${formatPrice(price, currency)}`);

export default formatPrice;
