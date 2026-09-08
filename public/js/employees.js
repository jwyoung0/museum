const form = document.querySelector('#employee-form');
const message = document.querySelector('#message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const formData = new FormData(form);
    const employee = {
        name: formData.get('name').trim(),
        position: formData.get('position'),
        startDate: formData.get('startDate'),
        salary: Number(formData.get('salary'))
    };

    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: employee.name,
                position: employee.position,
                salary: employee.salary,
                startDate: employee.startDate
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Unable to add employee.');
        }

        message.textContent = `${result.name} was added successfully.`;
        form.reset();
    } catch (error) {
        message.textContent = error.message;
    }
});