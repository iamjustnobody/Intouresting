
export function hideAlert(){
    const el=document.querySelector('.alert');
    if(el) el.parentElement.removeChild(el);
}
//type is success or error; different css
export function showAlert(type,msg){
    hideAlert();
    const markup=`<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin',markup); //inside body at the begiining
    window.setTimeout(hideAlert,5000);
}