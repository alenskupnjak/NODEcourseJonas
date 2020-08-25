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
console.log(mapBox, userDataForm, loginForm, logOutBtn, updatePassword);

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
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photofile = document.getElementById('photo').files[0]; 
    console.log('userDataForm', photofile);
      
    // if (photofile) {
    //   console.log(photo);
    //   let photo = photofile.name;
    //   console.log(photo);
    //   updateData({ name, email, photo, photofile});
    // } else {
    //   updateData({ name, email });
    // }
    updateData(form)
  });
}

if (updatePasswordBtn) {
  updatePasswordBtn.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').innerHTML = 'Updating...';

    const passOld = document.getElementById('password-current').value;
    const passNew = document.getElementById('password').value;
    const passNewRepaet = document.getElementById('password-confirm').value;
    await updatePassword(passOld, passNew, passNewRepaet);

    document.querySelector('.btn--save-password').innerHTML = 'Save password';
  });
}
