import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import uploadRouter from "./routes/upload.ts";
import { engine } from "express-handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const BASE_PATH = process.env.BASE_PATH || "";
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(BASE_PATH, express.static(path.join(__dirname, "../public")));

// Render and serve templated pages
app.engine('html', engine());
app.set('view engine', 'html');
app.set('views', './public/templates');

app.get(BASE_PATH, (req, res) => res.render('importer', { layout: false, BASE_PATH }));

// Routes
app.use(`${BASE_PATH}/upload`, uploadRouter);

app.get('/', (req, res) => {{{ BASE_PATH }}
  res.redirect(BASE_PATH);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
