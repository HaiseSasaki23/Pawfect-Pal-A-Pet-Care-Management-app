const passInput = document.getElementById('password');
const toggleBtn = document.getElementById('toggle-check');
const petImg = document.getElementById('main-pet-img');
const bubble = document.getElementById('speech-bubble');
const usernameInput = document.querySelector('input[type="text"]');

function updatePasswordState() {
    if (toggleBtn.checked) {
        passInput.type = 'text';
        petImg.src = 'login-img/peeking.png';
        bubble.innerText = "I'm watching!";
    } else {
        passInput.type = 'password';
        petImg.src = 'login-img/covered-eyes.png';
        bubble.innerText = "I'm not looking!";
    }
}

toggleBtn.addEventListener('change', updatePasswordState);

passInput.addEventListener('focus', updatePasswordState);

usernameInput.addEventListener('focus', () => {
    petImg.src = 'login-img/sit.png';
    bubble.innerText = "Paws-itively Organized Pet Care";
});

document.addEventListener('click', (e) => {
    if (!passInput.contains(e.target) && !usernameInput.contains(e.target) && !toggleBtn.contains(e.target) && !document.querySelector('.toggle-label').contains(e.target)) {
        petImg.src = 'login-img/sit.png';
        bubble.innerText = "Paws-itively Organized Pet Care";
    }
});
