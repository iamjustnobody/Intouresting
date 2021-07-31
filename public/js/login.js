
import axios from "axios"; 

import {showAlert} from "./alerts";


export async function login (email,password){ 
    try{
        const res=await axios({
            method:'POST',
            url:'http://localhost:3001/api/v1/users/login',
            data:{
                email,
                password
            }
        });
        if(res.data.status==='success'){
            showAlert('success', 'Logged in successfully!');
            window.setTimeout(()=>{
                location.assign('/');
            },1500);
        }
    }catch(err){
       showAlert('error',err.response.data.message);
    }

}


export async function logout(){
    try{
        const res=await axios({
            method:'GET',
            url:'http://localhost:3001/api/v1/users/logout',
        });

        if(res.data.status==='success'){window.setTimeout(()=>{location.assign('/');},1500);} 
    }catch(err){
        showAlert("error","Error logging out! Please try it again.")
    }
}
