import axios from 'axios';
import {showAlert} from "./alerts";

export async function updateData(name,email) { console.log('how come',name,email);
    try{
        const res=await axios({
            method:'PATCH',
            url:'http://localhost:3001/api/v1/users/updateMe',
            data:{
                name,
                email
            },
            headers:{
           //     'content-type':'application/json'
            }
        });
        if(res.data.status==='success'){
            showAlert('success','Data updated successfully')
        }
    }catch(err){
        showAlert("error",err.response.data.message) //message propert is whats defined in our server
    }
}

export async function updateSettings(data,type) {
    try{
        const url= (type==='password'?'http://localhost:3001/api/v1/users/updateMyPassword'
            :'http://localhost:3001/api/v1/users/updateMe');
        const res=await axios({
            method:'PATCH',
            url,
            data,
        });
        if(res.data.status==='success'){
            showAlert('success',`${type.toUpperCase()} updated successfully`)
        }
    }catch(err){
        showAlert("error",err.response.data.message) //message propert is whats defined in our server
    }
} //async func returns promise