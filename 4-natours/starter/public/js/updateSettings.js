/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
// import showAlert  from './alerts';

export const updateData = async (name, email) => {
  console.log(name, email);

  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:3000/api/v1/users/updateMe',
      data: {
        name: name,
        email:email
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Update JE uspio');
    }
  } catch (error) {
    // showAlert('error', 'Update nije uspio');
    console.log(error);
  }
};


export const updatePassword = async (passOld, passNew, passNewRepaet) => {
  console.log(passOld, passNew, passNewRepaet);

  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:3000/api/v1/users/updatePassword',
      data: {
        passwordCurrent: passOld,
        password: passNew,
        passwordConfirm:passNewRepaet
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Update JE uspio');
    }
  } catch (error) {
    // showAlert('error', 'Update nije uspio');
    console.log(error, 'Update nije uspio');
  }
};
