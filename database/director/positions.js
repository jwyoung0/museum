
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
                HourlyRate
            FROM dbo.POSITION
            ORDER BY PositionID ASC;
        `);

    return result.recordset;
}

async function createPosition({
    positionName,
    description,
    employmentType,
    hourlyRate
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
        hourlyRate != null &&
        (
            typeof hourlyRate !== "number" ||
            !Number.isFinite(hourlyRate) ||
            hourlyRate < 0 ||
            hourlyRate > 99999999.99 ||
            Math.round(hourlyRate * 100) !== hourlyRate * 100
        )
    ) {
        throw new TypeError(
            "Hourly rate must be a non-negative amount with up to two decimal places"
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
            "HourlyRate",
            sql.Decimal(10, 2),
            hourlyRate ?? null
        )
        .query(`
            INSERT INTO dbo.POSITION
            (
                PositionName,
                Description,
                EmploymentType,
                HourlyRate
            )
            OUTPUT
                INSERTED.PositionID AS PositionID
            VALUES
            (
                @PositionName,
                @Description,
                @EmploymentType,
                @HourlyRate
            );
        `);

    return result.recordset[0];
}

module.exports = {
    listPositions,
    createPosition
};
