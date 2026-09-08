#
Museum of Fine Arts Houston (MFAH) Web App and Database

##
```bash
npm init -y
npm install dotenv mssql
npm run db:init
```

Remove from package.json (unless tests are added)    
```bash
"test": "echo \"Error: no test specified\" && exit 1"
```
Add to package.json
```bash
"db:init": "node scripts/init-db.js"
```