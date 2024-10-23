import express, { Request, Response } from "express";
import { scrapeShopifyPage } from "./scraper";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/scrape", (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  scrapeShopifyPage(url)
    .then((scrapedData) => {
      return res.json(scrapedData); // Ensure you're returning the response here
    })
    .catch((error: Error) => {
      return res.status(500).json({ error: error.message });
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
