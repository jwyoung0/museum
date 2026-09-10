const { createEmployee, readEmployee } = require("../database/employee");
const { readJsonBody } = require("../utils/http");

async function createEmployeeHandler(req, res) {
    const body = await readJsonBody(req);

    const employee = {
        name: body.name,
        position: body.position,
        salary: Number(body.salary),
        startDate: parseUsDate(body.startDate)
    };

    const createdEmployee = await createEmployee(employee);

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(createdEmployee));
}

async function readEmployeeHandler(req, res, id) {
    const employee = await readEmployee(id);

    if (!employee) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Employee not found"
        }));

        return;
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(employee));
}


function parseUsDate(value) {
    if (typeof value !== "string") {
        throw new TypeError("startDate is required.");
    }

    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        throw new TypeError("startDate must use MM/DD/YYYY.");
    }

    const [, month, day, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    const isValid =
        date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1 &&
        date.getDate() === Number(day);

    if (!isValid) {
        throw new TypeError("startDate must be a valid date.");
    }

    return date;
}

module.exports = { 
    createEmployeeHandler, 
    readEmployeeHandler 
};
