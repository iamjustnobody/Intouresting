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
        /*
        const email=emailEl.value;
        const name=nameEl.value;
       // updateData(name,email);//ok
        updateSettings({name,email},'data');
        //{name:name,email:email}
         */ //before 202; but now using form to upload/update images (change photo label/input in account.pug) now need to make api call
        const form=new FormData();
        //form.append('name',document.getElementById('name').value); //ok
        //form.append('email',document.getElementById('email').value);//ok
        form.append('name',nameEl.value);
        form.append('email',emailEl.value);
        form.append('photo',document.getElementById('photo').files[0]);
        //name in User doc (so key 'photo' form-data in postman & field name multer is expecting //name & id (both photo) in account.pug
        console.log('form -: ',form);
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
        //updateSettings({currentPassword:passwordCurrent,password,passwordConfirm},'password'); //ok but now need to empty inputs on page
        // n await this promise (updateSettins) so set async e
        //{passwordCurrent:passwordCurrent,password:password,passwordConfirm:passwordConfirm} //compared to postman inputs
        await updateSettings({currentPassword:passwordCurrent,password,passwordConfirm},'password');
        pwdCurEl.value='';//textContent?
        passwordEl.value='';
        pwdConfirmEl.value='';
        savePwdBtn.innerHTML='Save password';//innerHTML or textContent //not .value
    })
}



if(bookBtn)
    bookBtn.addEventListener('click',e=>{

        e.target.textContent='Processing...'; //or innerHTML
        //const tourId=e.target.dataset.tourId; //ok
        // e is #book-tour from button.btn.btn--green.span-all-rows#book-tour//data attribute inside e or button -> data-tour-id=`${tour.id}` from tourdetail.pug;
        const {tourId}=e.target.dataset;
console.log('tourId=',tourId,typeof tourId); //cast to string no matter its data-tour-id=`${tour.id}` or data-tour-id=`${tour._id}` at the end of tourdetails.pug
        bookTour(tourId)
    })