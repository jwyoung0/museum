# Vertical CRUD Implementation Steps

## 1. Map the Vertical Slice

Before coding, understand the ownership chain for a resource:

```
employees.html
    ↓
js/employees.js
    ↓
POST /api/employees
    ↓
request handler
    ↓
database module
    ↓
SQL table
```

For a new resource such as collections, the same pattern applies:

```
collections.html
    ↓
js/collections.js
    ↓
POST /api/collections
    ↓
handlers/collections.js
    ↓
database/collection.js
    ↓
dbo.test_collections
```

## 2. Agree on the Resource Contract First

Decide the resource name, fields, database types, and API paths before coding.

### Example Mapping

| Layer | Employee | Collection |
|-------|----------|------------|
| Resource name | employee / employees | collection / collections |
| Page | /employees | /collections |
| API base | /api/employees | /api/collections |
| Page file | public/employees.html | public/collections.html |
| Client script | public/js/employees.js | public/js/collections.js |
| Handler | handlers/employees.js | handlers/collections.js |
| DB module | database/employee.js | database/collection.js |
| Table | dbo.test_employees | dbo.test_collections |

Document the JSON payload as part of the contract.

Example:
```json
{
  "name": "European Paintings",
  "description": "Works from the 15th through 19th centuries"
}
```

## 3. Add the Database Table

Update `database/schema.sql` with an idempotent table definition.

The table should be guarded with `IF OBJECT_ID(...) IS NULL`, following the pattern used by the employee table.

Example:
```sql
IF OBJECT_ID(N'dbo.test_collections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.test_collections (
        id INT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL
            CONSTRAINT DF_test_collections_created_at DEFAULT (SYSUTCDATETIME())
    );
END;
```

Initialize or update the database:
```bash
npm run db:init
```

## 4. Create the Database Module

Create:
```
database/collection.js
```

Model it after:
```
database/employee.js
```

The module should:
- Export `createCollection`
- Validate every field before querying the database
- Obtain a connection using `getPool()` from `database/connection.js`
- Use parameterized `.input(...)` values
- Never interpolate user data directly into SQL
- Insert the record
- Use `OUTPUT inserted...` to return the newly created row

Example structure:
```javascript
async function createCollection({ name, description }) {
  // Validate inputs.
  // Get the database pool.
  // Execute INSERT INTO dbo.test_collections.
  // OUTPUT inserted.id, inserted.name, ...
  // Return result.recordset[0].
}
```

## 5. Create the Request Handler

Create:
```
handlers/collections.js
```

Model it after:
```
handlers/employees.js
```

The handler should:
- Read and parse the JSON request body
- Convert values as needed, such as numeric strings to Number
- Map API field names to the names expected by the database module
- Call `createCollection`
- Return HTTP 201 with JSON representing the created item

### Reuse Existing Handler Protections

The employee handler already provides useful protections:
- 100 KB request-body limit
- Empty-body error handling
- Invalid JSON error handling
- Clear validation errors

## 6. Register the API and Page Routes

Update:
```
router.js
```

Add:
- Import for `createCollectionHandler`
- `POST /api/collections`
- `GET /collections` to serve `collections.html`
- `GET /js/collections.js` to serve the client script

Follow this route-ordering pattern:
```javascript
if (req.method === "POST" && req.url === "/api/collections") {
    await createCollectionHandler(req, res);
    return;
}

if (req.method === "GET" && req.url === "/collections") {
    sendPage(res, "collections.html", "text/html");
    return;
}

if (req.method === "GET" && req.url === "/js/collections.js") {
    sendPage(res, path.join("js", "collections.js"), "application/javascript");
    return;
}
```

## 7. Build the Collections Page

Create:
```
public/collections.html
```

Model it after:
```
public/employees.html
```

Update the following:
- Document title
- Page heading
- Form ID, such as `collection-form`
- Field labels
- Field IDs
- Field name values
- Submit button text
- Status message element
- Client-side script reference
- Navigation links

Use:
```html
<p id="message" role="status"></p>
```

Include Collections in the navigation across:
- `index.html`
- `employees.html`
- `base.html`
- The new `collections.html` page

### Use Browser Validation

Use built-in browser validation where appropriate:
- `required`
- `maxlength`
- `type`
- `min`
- `pattern`

This provides immediate feedback before the request reaches the server.

## 8. Add Browser-Side Submit Behavior

Create:
```
public/js/collections.js
```

Model it after:
```
public/js/employees.js
```

The script should:
- Select the form and message area
- Prevent normal form submission
- Read fields with `new FormData(form)`
- Send a POST request to `/api/collections`
- JSON-encode the request body
- Parse the JSON response
- Display either a success message or the API error
- Reset the form only after a successful response

Example request:
```javascript
fetch("/api/collections", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});
```

### Keep Field Names Consistent

Keep browser, API, and database field names aligned whenever possible.

## 9. Verify the Full Vertical Slice

Start the application:
```bash
npm start
```

Then verify the complete flow.

### Page

Visit:
```
/collections
```

Confirm that:
- The page loads
- CSS loads
- JavaScript loads
- The form is usable

### Successful Create

Submit a valid collection.

Expect:
- A success message
- HTTP 201
- The created item in the response
- A new row in SQL

### Validation

Submit missing or invalid fields.

Expect:
- HTTP 400
- A readable validation error

### Request Handling

Test:
- Empty request bodies
- Invalid JSON
- Oversized request bodies

Confirm that the handler returns clear errors.

### SQL Safety

Confirm that all user-supplied values are passed through SQL parameters.

Do not construct SQL by interpolating user input.

## 10. Extend Create into Full CRUD

Once Create Collection works, implement the remaining CRUD operations in this order:

### Read Collection List
`GET /api/collections`

Add:
- `database: listCollections`

Then render the results as a list or table.

### Read a Single Collection
`GET /api/collections/:id`

Add:
- `database: getCollectionById`

### Update a Collection
`PUT /api/collections/:id`

Add:
- Edit form
- `updateCollection`

### Delete a Collection
`DELETE /api/collections/:id`

Add:
- Delete control
- `deleteCollection`

## 11. Repeat the Ownership Chain for Every Operation

For each CRUD operation, follow the same ownership chain:

```
HTML interaction
    ↓
browser JavaScript fetch
    ↓
router method + path
    ↓
handler: parse + validate + HTTP response
    ↓
database module: parameterized query
    ↓
schema/data verification
```

This keeps responsibilities clear and makes each operation easier to build, test, and troubleshoot.

## 12. Important Team Framing

The current Employee work implements **C — Create** in CRUD. It does not yet implement all four CRUD operations.

Treat the Employee implementation as a reusable vertical-slice template:

```
Contract
  ↓
Database
  ↓
Database module
  ↓
Handler
  ↓
Router
  ↓
HTML
  ↓
Browser JavaScript
  ↓
End-to-end verification
```

Build and verify Create first.

Then apply the same pattern one CRUD operation at a time:

**Create → Read → Update → Delete**

The goal is to have each operation work end-to-end before moving on to the next one.
```