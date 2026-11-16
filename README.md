# Museum of Fine Arts Houston (MFAH) Web App and Database

---

## Project Files

- `server.js` starts the web server.
- `router.js` routes requests to the appropriate handlers.
- `public/` contains the website pages, styles, scripts, and images.
- `handlers/` processes web requests.
- `database/` contains database access code and SQL query files.
- `utils/` contains shared server utilities.
- `package.json` and `package-lock.json` list and lock the Node.js dependencies.

---

## Installation

1. Install Node.js.
2. Clone or download this project and open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```
---

## Environment Configuration

Create a file named `.env` in the root directory and add your SQL Server database credentials. Make sure `.env` is added to your `.gitignore` file.

```env
DB_USER     = your_database_username
DB_PASSWORD = your_database_password
DB_SERVER   = your_database_server
DB_NAME     = your_database_name
```

**Important:** Double check to make sure you added `.env` to `.gitignore` so that your environment variables aren't committed to GitHub. 


---

## Run

To run a local instance, run the following in the terminal:

```bash
npm start
```

or

```bash
node server.js
```

Open `http://localhost:3000` in your browser.