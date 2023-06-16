import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
// import routes from "./routes/index.js";

const app = express();
app.use(express.json());
app.use(cors());

const token = process.env.WHATSAPP_TOKEN;

// app.use("/budgets", routes.budgets);
// app.use("/categories", routes.categories);
// app.use("/piggy_banks", routes.piggyBanks);
// app.use("/transactions", routes.transactions);
// app.use("/wallets", routes.wallets);

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook/whatsapp", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  console.log(mode, token, challenge);

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Accepts POST requests at /webhook endpoint
app.post("/webhook/whatsapp", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));
  console.log(body);

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
      axios({
        method: "POST", // Required, HTTP method, a string, e.g. POST, GET
        url:
          "https://graph.facebook.com/v17.0/" + phone_number_id + "/messages",
        data: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: from,
          type: "text",
          text: { preview_url: false, body: "Ack: " + msg_body },
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

app.get("/", (req, res) => {
  res.send("welcome to whappo");
});

app.listen(process.env.PORT, () => {
  console.log(`WHAPPO listening on port ${process.env.PORT}!`);
});