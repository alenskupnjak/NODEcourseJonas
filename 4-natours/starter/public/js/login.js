/* eslint-disable */
import axios from 'axios';
import {showAlert} from './alerts';

export const login = async (email, password) => {  
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3100/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in uspješno')
      // alert('Logged in uspješno');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    showAlert('Neuspješno logiranje', err);
  }
};

export const logout = async () => {
  console.log('logout');
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3100/api/v1/users/logout',
    });
    if(res.data.status === 'success') {
      console.log('logout success');
      // location.reload(true)
      location.assign('/')
    }
  } catch (error) {
    // showAlert('error','Error logging out')
    console.log('Greska');
  }
} 