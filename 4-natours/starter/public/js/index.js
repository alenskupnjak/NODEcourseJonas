/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateData, updatePassword } from './updateSettings';
import { showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const updatePasswordBtn = document.querySelector('.form-user-password');
console.log(mapBox ,userDataForm,loginForm, logOutBtn, updatePassword);




if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {  
  userDataForm.addEventListener('submit', e=> {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateData(name, email)
  })
}

if (updatePasswordBtn) {  
  updatePasswordBtn.addEventListener('submit', e=> {
    e.preventDefault();
    const passOld = document.getElementById('password-current').value;
    const passNew = document.getElementById('password').value;
    const passNewRepaet = document.getElementById('password-confirm').value;
    updatePassword(passOld, passNew, passNewRepaet )
  })
}
