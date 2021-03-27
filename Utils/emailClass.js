const nodemailer=require('nodemailer');
const pug=require('pug')
const html2Text=require('html-to-text')

//new Emailer(user,url).sendWelcome()
module.exports=class Emailer{
    constructor(user,url) {
        this.to=user.email;
        this.firstname=user.name.split(' ')[0];
        this.url=url;
        this.from=`CEO XW <${process.env.EMAIL_FROM}>`;
    }
    newTransport(){
        if(process.env.NODE_ENV==='production'){
            return nodemailer.createTransport({
                service:'SendGrid',
                auth:{
                    user:process.env.SENDGRID_USERNAME,
                    password:process.env.SENDGRID_PASSWORD,
                }
            });
        }
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
        return transporter;
    }

    async send(template,subject){
        //create html
   //     const html=pug.renderFile(`${__dirname}/../vision/email/${template}.pug`); //__dirname is the currently running script - which is the Utils
        const html=pug.renderFile(`${__dirname}/../vision/emails/${template}.pug`,{
            firstName:this.firstname,
            url:this.url,
            subject
        }); //pass these (firstname, url, subject) into template

        const  mailOptions={
            from: this.from,
            to: this.to,
            subject,
            html,
            text:html2Text.fromString(html)
        }

        await this.newTransport().sendMail(mailOptions)
    }
    async sendWelcome(){
        await this.send('welcome','Welcome to Intouresting Family!') //'this' is current obj
    }
    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid for only 10 min)')
    }
}