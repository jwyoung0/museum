const { sql, getPool } = require("./connection");

async function createEmployee({ name, position, salary, startDate }) {
    if (typeof name !== "string" || !name.trim()) {
        throw new TypeError("name is required");
    }

    if (typeof position !== "string" || !position.trim()) {
        throw new TypeError("position is required");
    }

    if (!Number.isSafeInteger(salary) || salary < 0) {
        throw new TypeError("salary must be a non-negative whole number");
    }

    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
        throw new TypeError("startDate must be a valid Date");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("name", sql.NVarChar(255), name.trim())
        .input("position", sql.NVarChar(255), position.trim())
        .input("salary", sql.Int, salary)
        .input("startDate", sql.DateTime2, startDate)
        .query(`
            INSERT INTO dbo.test_employees (name, position, salary, start_date)
            OUTPUT
                inserted.id,
                inserted.name,
                inserted.position,
                inserted.salary,
                inserted.start_date,
                inserted.created_at
            VALUES (@name, @position, @salary, @startDate);
        `);

    return result.recordset[0];
}

async function readEmployee(id) {

    if (typeof id !== "string" || !id.trim()) {
        throw new TypeError("id is required");
    }

    const employeeId = Number(id);

    if (!Number.isInteger(employeeId)) {
        throw new TypeError("id must be a valid integer");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("id", sql.Int, employeeId)
        .query(`
            SELECT id, name, position, salary, start_date
            FROM dbo.test_employees
            WHERE id=@id; 
        `);

    return result.recordset[0] ?? null;

}

module.exports = {
    createEmployee,
    readEmployee
};