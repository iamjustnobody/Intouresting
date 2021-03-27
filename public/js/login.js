//import -> type module in public package.json or mjs; frontend-> script type module
//as comment out script cdn axios.min.js so need to import
//import axios from 'axios'; //not display map // but need ./ reference
//import axios from './node_modules/axios';
//or get net err aborted 404 error tring to get from node_model
//need boundle or webpack & script boundle.js in index.mjs
import axios from "axios"; //parcel require not defined & not showing map
//remove package json in public folder & return mjs to js

import {showAlert} from "./alerts";

//export const login=async (email,password)=>{
export async function login (email,password){ console.log(email,password); //for testing but usually not logging sensitive data to console
//http request for login //cdn or npm axios
    try{
        const res=await axios({
            method:'POST',
            url:'http://localhost:3001/api/v1/users/login',
            data:{
                email,
                password
            }
        });
        console.log(res); //res.data is our data response - json
        if(res.data.status==='success'){
            alert('Log in successfully!');
            window.setTimeout(()=>{
                location.assign('/');//location.reload(true); but deprecated (so plus window.) but also dont wanna stay in current login page so redirect to home page
            },1500);
        }
    }catch(err){
        //  console.log(err.response.data);//err.response.data is our data response - json
        // alert(err.response.data.message);
       console.log(err);
       showAlert('error',err.response.data.message);
    }

}

/*document.querySelector('.form').addEventListener('submit',e=>{
    e.preventDefault();
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    login(email,password);
})*/ //move to index.mjs now index.js



export async function logout(){
    try{
        const res=await axios({
            method:'GET',
            url:'http://localhost:3001/api/v1/users/logout',
        });
        console.log("to log out")
      //  if(res.data.status==='success') window.location.reload(true) //= or == or === all seem ok; === definitely ok
        //but if in '/me' page when click logout jwt cookie='loggedout' if stay at /me page this cookie wont pass auth protect promise verify so jwt mal error
        if(res.data.status==='success'){window.setTimeout(()=>{location.assign('/');},1500);} //so when logout redirect to home page
    }catch(err){
        showAlert("error","Error logging out! Please try it again.")
    }
}