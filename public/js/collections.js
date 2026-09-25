const addObjectForm     = document.querySelector('add-object-form');
const addObjectMessage  = document.querySelector('add-object-message');

// add-object-form handler. Here we collect the user's input 
// and use await fetch(...) to send an HTTP request and receive 
// the HTTP response
addObjectForm.addEventListener(`submit`, async (event) => {
    event.preventDefault();
    addObjectMessage.textContent = '';

    const formData = new FormData(addObjectForm);
    const object = {
        title: formData.get('title').trim(),
        producer: formData.get('producer'),
        placeOfProduction: formData.get('placeOfProduction'),
        dateOfProduction: Number(formData.get('dateOfProduction'))
    };

    try {
        const response = await fetch('/api/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: object.title,
                producer: object.producer,
                placeOfProduction: object.placeOfProduction,
                dateOfProduction: object.dateOfProduction
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Unable to add object.');
        }

        message.textContent = `${result.name} was added successfully.`;
        addObjectForm.reset();
    } catch (error) {
        addObjectMessage.textContent = error.message;
    }
});