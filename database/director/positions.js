
const { sql, getPool } = require("../connection");

async function listPositions() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                PositionID,
                PositionName,
                Description,
                EmploymentType,
                Salary
            FROM dbo.POSITION
            ORDER BY PositionName;
        `);

    return result.recordset;
}

async function createPosition({
    positionName,
    description,
    employmentType,
    salary
}) {
    if (
        typeof positionName !== "string" ||
        !positionName.trim()
    ) {
        throw new TypeError("Position name is required");
    }

    if (positionName.trim().length > 50) {
        throw new TypeError(
            "Position name must not exceed 50 characters"
        );
    }

    if (
        description != null &&
        description.length > 250
    ) {
        throw new TypeError(
            "Description must not exceed 250 characters"
        );
    }

    if (
        employmentType != null &&
        employmentType.length > 50
    ) {
        throw new TypeError(
            "Employment type must not exceed 50 characters"
        );
    }

    if (
        salary != null &&
        (
            typeof salary !== "number" ||
            !Number.isFinite(salary) ||
            salary < 0 ||
            salary > 99999999.99 ||
            Math.round(salary * 100) !== salary * 100
        )
    ) {
        throw new TypeError(
            "Salary must be a non-negative amount with up to two decimal places"
        );
    }

    const pool = await getPool();

    const result = await pool.request()
        .input(
            "PositionName",
            sql.NVarChar(50),
            positionName.trim()
        )
        .input(
            "Description",
            sql.VarChar(250),
            description?.trim() || null
        )
        .input(
            "EmploymentType",
            sql.VarChar(50),
            employmentType?.trim() || null
        )
        .input(
            "Salary",
            sql.Decimal(10, 2),
            salary ?? null
        )
        .query(`
            INSERT INTO dbo.POSITION
            (
                PositionName,
                Description,
                EmploymentType,
                Salary
            )
            OUTPUT
                INSERTED.PositionID AS PositionID
            VALUES
            (
                @PositionName,
                @Description,
                @EmploymentType,
                @Salary
            );
        `);

    return result.recordset[0];
}

module.exports = {
    listPositions,
    createPosition
};
