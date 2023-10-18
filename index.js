const chromium = require('chrome-aws-lambda');
const nodemailer = require('nodemailer');
const { promisify } = require('util');
const moment = require('moment-timezone');
const AWS = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

exports.handler = async function (event, context) {
    AWS.config.update({
      secretAccessKey: process.env.secretAccessKey,
      accessKeyId: process.env.accessKeyId,
    });

// AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });

    const transporter = nodemailer.createTransport({
         SES: new AWS.SES({ region: "us-west-2" })
    });

    const istTime = moment.tz(new Date(), 'Asia/Kolkata');
    const formattedDateTime = istTime.format('MMMM Do YYYY, h:mm A z');

    const sendMailAsync = promisify(transporter.sendMail).bind(transporter);

    // const browser = await puppeteer.launch({
    //     headless: 'new', args: [
    //         '--no-sandbox',
    //         '--disable-setuid-sandbox',
    //     ]});
    const browser = await chromium.puppeteer
        .launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless
        });
    const page = await browser.newPage();
    await page.goto('http://54.71.21.145/');
    await page.evaluate(() => {
        return new Promise(resolve => {
            setTimeout(resolve, 8000);
        });
    });
    const screenshotBuffer = await page.screenshot();
    await browser.close();
    const screenshotDataUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
    const emailHtml = `
        <html>
            <body>
                <h3>Holiday Customs Monitoring Status</h3>
                <h4>${formattedDateTime}</h4>
                <img src="${screenshotDataUrl}" alt="Dashboard Screenshot">
            </body>
        </html>
    `;
    try {
        await sendMailAsync({
            from: "amit_kumar@vfc.com",
            to: ["rauxateam@newelevation.com","shashank_shekhar@vfc.com"],
            subject: "Holiday Customs Monitoring Status",
            html: emailHtml,
        });
        console.log("Email sent successfully",formattedDateTime);
    } catch (err) {
        console.log("Error", err);
    }
}

