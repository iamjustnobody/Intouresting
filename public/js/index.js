import {login} from "./login.js";
import {displayMap} from "./mapbox.js";
import '@babel/polyfill'
import {logout} from "./login.js";
import {updateData,updateSettings} from "./updateSettings";

import {bookTour} from "./stripe";

//DOM element
const mapBox=document.getElementById('map');
const loginForm=document.querySelector('.form--login'); //replacing '.form'
const emailEl=document.getElementById('email');
const passwordEl=document.getElementById('password');

const logOutBtn=document.querySelector('.nav__el--logout');

const userDataForm=document.querySelector('.form-user-data');
const nameEl=document.getElementById('name');
const userPwdForm=document.querySelector('.form-user-password');//.form-user-settings
const pwdCurEl=document.getElementById('password-current');
const pwdConfirmEl=document.getElementById('password-confirm');

const savePwdBtn=document.querySelector('.btn--save-password');

const bookBtn=document.getElementById('book-tour');//button.btn.btn--green.span-all-rows#book-tour in tourdetails.pug

//delegation
if(mapBox){ //render when page loading --- no addeventlistener
    const locations=JSON.parse(mapBox.dataset.locations);
    console.log(mapBox);
    displayMap(locations);
}

if(loginForm){
    loginForm.addEventListener('submit',e=>{
        e.preventDefault();
        const email=emailEl.value;
        const password=passwordEl.value;
        login(email,password);
    })
}

if(logOutBtn) logOutBtn.addEventListener('click',logout)

//API CALL
if(userDataForm){
    userDataForm.addEventListener('submit',e=>{
        e.preventDefault();
        const form=new FormData();
        form.append('name',nameEl.value);
        form.append('email',emailEl.value);
        form.append('photo',document.getElementById('photo').files[0]);
        updateSettings(form,'data');
    })
}

//API CALL
if(userPwdForm){
    userPwdForm.addEventListener('submit',async e=>{
        e.preventDefault();
        const passwordCurrent=pwdCurEl.value;
        const password=passwordEl.value;
        const passwordConfirm=pwdConfirmEl.value;
        console.log(passwordCurrent,password,passwordConfirm);
        savePwdBtn.textContent='Updating...'; //or innerHTML
        await updateSettings({currentPassword:passwordCurrent,password,passwordConfirm},'password');
        pwdCurEl.value='';
        passwordEl.value='';
        pwdConfirmEl.value='';
        savePwdBtn.innerHTML='Save password';//innerHTML or textContent //not .value
    })
}



if(bookBtn)
    bookBtn.addEventListener('click',e=>{

        e.target.textContent='Processing...'; 
        const {tourId}=e.target.dataset;
        bookTour(tourId)
    })
