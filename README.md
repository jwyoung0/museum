# Museum of Fine Arts Houston (MFAH) Web App and Database

---

## Installation

In the command terminal, run:

```bash
npm init -y
npm install dotenv mssql
```

Make sure this is removed from [`package.json`](package.json) (unless tests are added).    
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

---

## Environment Configuration

Create a file named `.env` in the root directory and add your database credentials. Make sure `.env` is added to your `.gitignore` file.

```env
DB_USER     = your_database_username
DB_PASSWORD = your_database_password
DB_SERVER   = cloud_server_address.database.windows.net
DB_NAME     = your_database_name
```

**Important:** Double check to make sure you added `.env` to `.gitignore` so that your environment variables aren't committed to GitHub. 


---

## Run

To run a local instance, run the following in the terminal:

```bash
node server.js
```
