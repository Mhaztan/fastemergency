// middleware/i18nMiddleware.js
const fs = require('fs');
const path = require('path');

const defaultLocale = 'en'; // Default language
const supportedLocales = ['en', 'ha', 'yo', 'ig', 'pid']; // Supported languages
const translations = {}; // Store translations in memory

// Load translations from JSON files
supportedLocales.forEach(locale => {
  const filePath = path.join(__dirname, '../locales', `${locale}.json`);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    translations[locale] = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading translation file for ${locale}:`, error);
    translations[locale] = {}; // Load an empty object if there is an error
  }
});

// Middleware to set locale and translation function
const i18nMiddleware = (req, res, next) => {
  // Get locale from request headers, query parameters, or cookies
  let locale = req.headers['accept-language']?.split(',')[0] || req.query.lang || req.cookies?.lang || defaultLocale;
  locale = locale.substring(0, 2); //Get first two characters

  // Validate locale
  if (!supportedLocales.includes(locale)) {
    locale = defaultLocale;
  }

  // Set locale on request object
  req.locale = locale;

  // Translation function
  req.t = (key) => {
    const translatedText = translations[locale]?.[key] || translations[defaultLocale]?.[key] || key;
    return translatedText;
  };

  next();
};

module.exports = i18nMiddleware;