// IMPORT PACKAGES
import express from "express";
import easyinvoice from "easyinvoice";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import qrcode from "qrcode";

const app = express();
let imgPath = path.resolve("img", "invoice.png");
function base64_encode(img) {
  let png = fs.readFileSync(img);
  return new Buffer.from(png).toString("base64");
}

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/send-invoice", async (req, res) => {
  const generateQrCode = async (data) => {
    try {
      const img = await qrcode.toDataURL(data);
      let base64result = img.split(",")[1];
      return base64result;
    } catch (err) {
      console.log(err);
      console.log("error disini banggg");
      return undefined;
    }
  };
  // `${base64_encode(imgPath)}`
  let today = new Date();
  let date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

  let data = {
    currency: "IDR",
    taxNotation: "vat", //or gst
    marginTop: 25,
    marginRight: 25,
    marginLeft: 25,
    marginBottom: 25,
    logo: `${await generateQrCode(req.body.qrData)}`, //or base64
    sender: {
      company: "Diskominfo Sragen",
      address:
        "H2FF+J62, Karang Duwo, Sragen Tengah, Kec. Sragen, Kabupaten Sragen, Jawa Tengah",
      zip: "57211",
      city: "Sragen",
      country: "Indonesia",
    },
    client: {
      company: req.body.username,
      address: req.body.address,
      zip: req.body.email,
      city: req.body.phoneNumber,
      country: "",
    },
    invoiceNumber: req.body.paymentNumber,
    invoiceDate: date,
    products: req.body.item.map((e) => ({
      quantity: e.count,
      description: `${e.title}, ${e.date}`,
      price: e.price,
      tax: 1,
    })),
    bottomNotice: "Terimakasih telah melakukan pembayaran.",
  };

  const invoicePdf = async () => {
    let result = await easyinvoice.createInvoice(data);
    let date = Date.now();
    fs.writeFileSync(`./invoice/invoice${date}.pdf`, result.pdf, "base64");
    let fileName = path.basename(`./invoice/invoice${date}.pdf`);
    console.log(fileName);
    if (fileName) {
      sendEmail(fileName);
    } else {
      console.log("file not found");
    }
  };
  invoicePdf();

  const sendEmail = async (fileName) => {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    let mailOptions = {
      from: "laravelbeautiful@gmail.com",
      to: "fluffyfuffy1@gmail.com",
      subject: "test email",
      text: "test attachment",
      attachments: [
        {
          filename: fileName,
          path: `./invoice/${fileName}`,
        },
      ],
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log("error", err);
      } else {
        console.log("success");
      }
    });
  };
});

let PORT = process.env.PORT || 3301;

app.get("/", (req, res) => {
  res.json({
    message: `Build succeeded on port ${PORT}`,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
