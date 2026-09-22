const loginForm     = document.querySelector(`#login-form`);
const loginMessage  = document.querySelector(`#login-message`);
const submitButton  = loginForm.querySelector(`button[type="submit"]`);

loginForm.addEventListener(`submit`, async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const loginData = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };

    loginMessage.textContent = '';
    loginMessage.style.color = 'var(--ink)';
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: loginData.username,
                password: loginData.password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Unable to authenticate user')
        } 

        window.location.assign('/admin-dashboard');

    } catch (error) {
        loginMessage.style.color = '#dc2626';
        loginMessage.textContent = error.message;

        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
});
