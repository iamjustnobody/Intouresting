const nodemailer=require('nodemailer');

const sendEmail= async options=>{
    //create transporter - service to send email
    const transporter=nodemailer.createTransport({
     //   service:'gamil',
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD
        }
        //ACTUATE LESS SECURE APP
        //SENDGRID OR MAILGUN
    })

    //define email options
    const  mailOption={
        from: 'anyone <anyone@exe.com>',
        to: options.email,
        subject:options.subject,
        text:options.message,
        //html
    }

    //actually send the email
  await  transporter.sendMail(mailOption);//return promise -> async
}
module.exports=sendEmail;