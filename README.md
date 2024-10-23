# Shopify Store Scraper

This project is a Shopify store scraper built using TypeScript, Express, Cheerio, and Axios. The scraper allows users to enter the URL of a Shopify product page, and it returns the font information and button styles used on that page.

## Features

- Scrapes fonts from Google Fonts and `@font-face` rules in CSS files.
- Extracts font properties such as font-family, font-weight, letter-spacing, and font variants.
- Retrieves button styles (inline and external) from the product page.
- Filters and returns unique fonts used across the page.

## Requirements

- Node.js (v14 or higher)
- NPM or Yarn

## Installation

1. Clone the repository:

   ```bash
   https://github.com/artemb315/shopify-scraper.git
   cd shopify-scraper
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

Or, for development with hot reloading:

```bash
npm run dev
```

## API Usage

### POST `/scrape`

This endpoint accepts a URL to a Shopify product page and returns the fonts and button styles used on that page.

#### Request Body:

```json
{
  "url": "https://example-shopify-store.com/products/product-name"
}
```

#### Response Example:

```json
{
  "fonts": [
    {
      "family": "Montserrat",
      "variants": "400",
      "fontWeight": "400",
      "letterSpacings": "normal",
      "url": "https://fonts.googleapis.com/css2?family=Montserrat:wght@400&display=swap"
    },
    {
      "family": "Playfair Display",
      "variants": "400",
      "fontWeight": "400",
      "letterSpacings": "normal",
      "url": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&family=Lato:wght@400&display=swap"
    }
  ],
  "primaryButton": {
    "font-family": "Helvetica",
    "font-size": "16px",
    "background-color": "#000",
    "color": "#fff",
    "border-radius": "4px"
  }
}
```

## Project Structure

```
├── src/
│   ├── scraper.ts        # The scraping logic
│   └── index.ts          # Express API server
├── dist/                 # Compiled JavaScript files
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Scripts

- `npm run dev`: Starts the server using `ts-node` for development.
- `npm run build`: Compiles TypeScript into JavaScript in the `dist/` folder.
- `npm run start`: Starts the compiled JavaScript server.
- `npm run serve`: Builds the project and starts the server.

## Dependencies

- [Axios](https://www.npmjs.com/package/axios) - HTTP client for making requests to external CSS files.
- [Cheerio](https://www.npmjs.com/package/cheerio) - jQuery-like HTML parser for Node.js.
- [Express](https://www.npmjs.com/package/express) - Web framework for building the API.

## Development Dependencies

- [TypeScript](https://www.npmjs.com/package/typescript) - TypeScript compiler.
- [ts-node](https://www.npmjs.com/package/ts-node) - TypeScript execution environment.
- [@types](https://www.npmjs.com/package/@types) - TypeScript type definitions for Cheerio and Express.

## How It Works

1. **Scraping Fonts**: The scraper retrieves Google Fonts from `link[rel="stylesheet"]` tags and extracts `@font-face` rules from external CSS files linked on the page.
2. **Extracting Button Styles**: It also scrapes inline button styles and class-based styles from external CSS files.
3. **Unique Fonts**: The scraper filters out duplicate fonts based on the `family` property, ensuring the output contains only unique fonts.
4. **Express API**: The Express server exposes the `/scrape` endpoint for users to input a Shopify product URL and receive the scraped data.

## License

This project is licensed under the MIT License.
