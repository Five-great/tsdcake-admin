'use strict';
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs  = require('fs');
const path = require('path');

let config = {
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
}

if (process.env.SMTP_SERVICE != null) {
    config.service = process.env.SMTP_SERVICE;
} else {
    config.host = process.env.SMTP_HOST;
    config.port = parseInt(process.env.SMTP_PORT);
    config.secure = process.env.SMTP_SECURE === "false" ? false : true;
}

const transporter = nodemailer.createTransport(config);
let templateName = process.env.TEMPLATE_NAME ?  process.env.TEMPLATE_NAME : "default";
let noticeTemplate = ejs.compile(fs.readFileSync(path.resolve(process.cwd(), 'template', templateName, 'notice.ejs'), 'utf8'));
let sendTemplate = ejs.compile(fs.readFileSync(path.resolve(process.cwd(), 'template', templateName, 'send.ejs'), 'utf8'));
let codeTemplate = ejs.compile(fs.readFileSync(path.resolve(process.cwd(), 'template', templateName, 'sendCode.ejs'), 'utf8'));


// 邮箱验证码
exports.sendCode=(codeData)=>{
    
    let emailSubject = '👉 咚！「' + process.env.SITE_NAME + '」发来邮箱验证';
    let emailContent =  codeTemplate({
        siteLogo: process.env.SENDER_LOGO,
        siteName: process.env.SENDER_NAME,
        siteUrl: process.env.SITE_URL,
        name: codeData.name,
        codeNumber: codeData.codeNumber,
        url: process.env.SITE_URL
    });
    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
        to: codeData.mail,
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }

    });
}

// 提醒站长
exports.notice = (comment) => {

    // 站长自己发的评论不需要通知
    if (comment.get('mail')&&(comment.get('mail') === process.env.TO_EMAIL 
        || comment.get('mail') === process.env.SMTP_USER || comment.get('mail') === process.env.TO_EMAIL1 || comment.get('mail') === process.env.TO_EMAIL2 || comment.get('mail') === process.env.TO_EMAIL3)) {
        return;
    }

    let emailSubject = '👉 咚！「' + process.env.SITE_NAME + '」上有新评论了';
    let emailContent =  noticeTemplate({
                            siteLogo: process.env.SENDER_LOGO,
                            siteName: process.env.SENDER_NAME,
                            siteUrl: process.env.SITE_URL,
                            name: comment.get('nick'),
                            text: comment.get('comment'),
                            url: process.env.SITE_URL + comment.get('url')
                        });

    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
        to: process.env.SMTP_USER,
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        comment.set('isNotified', true);
        comment.save();
        console.log("收到一条评论, 已提醒站长");
    });

    if(process.env.TO_EMAIL){
        let mailOptions1 = {
            from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
            to: process.env.TO_EMAIL,
            subject: emailSubject,
            html: emailContent
        };
    
        transporter.sendMail(mailOptions1, (error, info) => {
            if (error) {
                return console.log(error);
            }
            comment.set('isNotified', true);
            comment.save();
            console.log("管理1号收到一条评论, 已提醒站长");
        });
    }
    if(process.env.TO_EMAIL1){
        let mailOptions2 = {
            from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
            to: process.env.TO_EMAIL1,
            subject: emailSubject,
            html: emailContent
        };
    
        transporter.sendMail(mailOptions2, (error, info) => {
            if (error) {
                return console.log(error);
            }
            // comment.set('isNotified', true);
            // comment.save();
            console.log("管理2号收到一条评论, 已提醒站长");
        });
    }

    if(process.env.TO_EMAIL2){
        let mailOptions3 = {
            from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
            to: process.env.TO_EMAIL2,
            subject: emailSubject,
            html: emailContent
        };
    
        transporter.sendMail(mailOptions3, (error, info) => {
            if (error) {
                return console.log(error);
            }
            // comment.set('isNotified', true);
            // comment.save();
            console.log("管理3号收到一条评论, 已提醒站长");
        });
    }  
    if(process.env.TO_EMAIL3){
        let mailOptions4 = {
            from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
            to: process.env.TO_EMAIL3,
            subject: emailSubject,
            html: emailContent
        };
    
        transporter.sendMail(mailOptions4, (error, info) => {
            if (error) {
                return console.log(error);
            }
            // comment.set('isNotified', true);
            // comment.save();
            console.log("管理4号收到一条评论, 已提醒站长");
        });
    }
}



// 发送邮件通知他人
exports.send = (currentComment, parentComment)=> {

    // 站长被 @ 不需要提醒
    if (parentComment.get('mail') === process.env.TO_EMAIL 
        || parentComment.get('mail') === process.env.SMTP_USER || parentComment.get('mail') === process.env.TO_EMAIL1 || parentComment.get('mail') === process.env.TO_EMAIL2 || parentComment.get('mail') === process.env.TO_EMAIL3) {
        return;
    }
    let emailSubject = '👉 叮咚！「' + process.env.SEND_NAME + '」上有人@了你';
    let emailContent = sendTemplate({
                            siteLogo: process.env.SENDER_LOGO,
                            siteName: process.env.SENDER_NAME,
                            siteUrl: process.env.SITE_URL,
                            pname: parentComment.get('nick'),
                            ptext: parentComment.get('comment'),
                            name: currentComment.get('nick'),
                            text: currentComment.get('comment'),
                            url: process.env.SITE_URL + currentComment.get('url') + "#" + currentComment.get('pid'),
                            staticUrl: process.env.SITE_STATIC_URL + currentComment.get('pid')
                        });
    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
        to: parentComment.get('mail'),
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        currentComment.set('isNotified', true);
        currentComment.save();
        console.log(currentComment.get('nick') + " @了" + parentComment.get('nick') + ", 已通知.");
    });
};

// 该方法可验证 SMTP 是否配置正确
exports.verify = function(){
    console.log("....");
    transporter.verify(function(error, success) {
        if (error) {
            console.log(error);
        }
        console.log("Server is ready to take our messages");
    });    
};
