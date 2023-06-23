import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import routes from './routes/index.js';

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';

/**
 * Init for Google Calendar
 * You have to add your credentials.json file. Will auth and generate token.js for future auth
 */
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Reads previously authorised credentials
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

// Serializes credentials to a file compatible with GoogleAUth.fromJSON
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

// Load or request authorisation to call APIs
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

const auth = await authorize();

const app = express();
app.use(express.json());
app.use(cors());

const token = process.env.WHATSAPP_TOKEN;

app.use('/availabilities', routes.availabilities);
app.use('/employees', routes.employees);
app.use('/roles', routes.roles);
app.use('/shifts', routes.shifts);

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get('/webhook/whatsapp', async (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  console.log(mode, token, challenge);

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Accepts POST requests at /webhook endpoint
app.post('/webhook/whatsapp', async (req, res) => {
  // Parse the request body from the POST
  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumberId =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      const msgBody = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

      // // msgBody will be
      // // date,Shift Name 1,Shift Name 2 or date,Shift Name 1
      // // TODO: UPDATE THIS BASED ON THE RESPONSE YOU PLAN TO RECEIVE
      // if (msgBody === '2023/06/18, Morning Shift') {
      //   axios({
      //     method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
      //     url:
      //       'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
      //     data: {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       to: from,
      //       type: 'text',
      //       text: { preview_url: false, body: 'Shift availability recorded!' },
      //     },
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer ' + token,
      //     },
      //   });

      //   // sleep for 5 seconds
      //   await new Promise((resolve) => setTimeout(resolve, 5000));

      //   axios({
      //     method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
      //     url:
      //       'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
      //     data: {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       to: from,
      //       type: 'text',
      //       text: {
      //         preview_url: false,
      //         // TODO: UPDATE THIS BASED ON THE RESPONSE YOU PLAN TO RECEIVE
      //         // this is when the manager accepts the assignment of shifts for everyone
      //         body: 'You have been assigned to Morning Shift on 2023/06/18',
      //       },
      //     },
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer ' + token,
      //     },
      //   });
      // }

      // if (msgBody === 'I would like to cancel my shift on 2023/06/18') {
      //   // send message saying that a replacement will be arranged for the shift
      //   axios({
      //     method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
      //     url:
      //       'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
      //     data: {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       to: from,
      //       type: 'text',
      //       text: {
      //         preview_url: false,
      //         // TODO: UPDATE THIS BASED ON THE DATE
      //         body: 'A replacement will be arranged for your shift on 2023/06/18',
      //       },
      //     },
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer ' + token,
      //     },
      //   });

      //   // sleep for 5 seconds
      //   await new Promise((resolve) => setTimeout(resolve, 5000));

      //   // send message to employee 2 to ask for their availability
      //   axios({
      //     method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
      //     url:
      //       'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
      //     data: {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       // TODO: UPDATE THIS BASED ON THE PHONE NUMBER OF EMPLOYEE 2
      //       to: '+60167668686',
      //       type: 'text',
      //       text: {
      //         preview_url: false,
      //         // TODO: UPDATE THIS BASED ON THE DATE AND TIME OF SHIFT
      //         body: 'Hi Mike, would you be able to cover the shift on 2023/06/18 from 10:00 AM - 2:00 PM?',
      //       },
      //     },
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer ' + token,
      //     },
      //   });
      // }

      // if (msgBody === 'Yes I can replace the shift on 2023/06/18') {
      //   // send message saying that a replacement will be arranged for the shift
      //   axios({
      //     method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
      //     url:
      //       'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
      //     data: {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       to: from,
      //       type: 'text',
      //       text: {
      //         preview_url: false,
      //         // TODO: UPDATE THIS BASED ON THE DATE AND TIME OF SHIFT
      //         body: 'Great! You have been assigned to the shift on 2023/06/18 from 10:00 AM - 2:00 PM',
      //       },
      //     },
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer ' + token,
      //     },
      //   });

      //   // sleep for 5 seconds
      //   await new Promise((resolve) => setTimeout(resolve, 5000));

      //   // send message to employee 1 to inform them that a replacement has been found
      //   axios({
      //     method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
      //     url:
      //       'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
      //     data: {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       // TODO: UPDATE THIS BASED ON THE PHONE NUMBER OF EMPLOYEE 1
      //       to: '+60175015966',
      //       type: 'text',
      //       text: {
      //         preview_url: false,
      //         // TODO: UPDATE THIS BASED ON THE DATE
      //         body: 'Hi, we have found a replacement for your shift on 2023/06/24 from 10:00 AM - 2:00 PM',
      //       },
      //     },
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: 'Bearer ' + token,
      //     },
      //   });
      // }

      // ? =============================== flow chart for availability request ===============================

      if (msgBody.toLowerCase() === "morning pls") {
        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO ZHENG JIE'S PHONE NUMBER
            to: "+60175015966",
            type: 'text',
            text: {
              preview_url: false,
              body: 'You have stated your availability is on \n- Morning, 8:00 am - 6:00 pm, "Waiter"\n\nWould you like to confirm?',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
      }

      if (msgBody.toLowerCase() === "yes") {
        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO ZHENG JIE'S PHONE NUMBER
            to: "+60175015966",
            type: 'text',
            text: {
              preview_url: false,
              body: 'Shift availability recorded!',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });

        // sleep for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO ZHENG JIE'S PHONE NUMBER
            to: "+60175015966",
            type: 'text',
            text: {
              preview_url: false,
              body: 'You have been assigned to the morning shift, 8:00 am - 6:00 pm on 25/06/2023, as "Waiter"',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
      }
      // ? =============================== flow chart for availability request end ===============================

      // ? =============================== flow chart for shift cancellation =====================================

      if (msgBody.toLowerCase() === "i would like to cancel my afternoon shift on 25th of june") {
        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO KAI'S PHONE NUMBER
            to: "+60168892811",
            type: 'text',
            text: {
              preview_url: false,
              body: 'A replacement will be arranged for your shift on 25/06/2023',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
        
        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO MIKE'S PHONE NUMBER
            to: "+60167668686",
            type: 'text',
            text: {
              preview_url: false,
              body: 'Hi Mike, would you be able to cover the shift on 25/06/2023 from 12:00 pm - 10:00 pm?',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
      }

      if (msgBody.toLowerCase() === "yes im ok") {
        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO MIKE'S PHONE NUMBER
            to: "+60167668686",
            type: 'text',
            text: {
              preview_url: false,
              body: 'Great! You have been assigned to the shift on 25/06/2023 from 12:00 pm - 10:00 pm',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
        
        axios({
          method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
          url:
            'https://graph.facebook.com/v17.0/' + phoneNumberId + '/messages',
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            // TODO: UPDATE THIS TO KAI'S PHONE NUMBER
            to: "+60168892811",
            type: 'text',
            text: {
              preview_url: false,
              body: 'Hi, we have found a replacement for your shift',
            },
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
      }

      // ? =============================== flow chart for shift cancellation end =====================================
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts POST requests at the /calendar endpoint
app.post('/calendar/insert', async (req, res) => {
  const body = req.body;

  try {
    const calendar = google.calendar({ version: 'v3', auth });

    body.shifts.forEach(async (shift) => {
      const calendarRes = await calendar.events.insert({
        calendarId: 'primary',
        sendNotifications: true,
        requestBody: {
          summary: shift.title,
          location: shift.location,
          description: shift.description,
          start: {
            dateTime: shift.startTime,
            timeZone: 'Singapore',
          },
          end: {
            dateTime: shift.endTime,
            timeZone: 'Singapore',
          },
          attendees: shift.emails.map((email) => ({ email })),
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 },
            ],
          },
        },
      });
      console.log('Event added: ' + calendarRes.data.htmlLink);
    });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post('/requestAvailabilities', async (req, res) => {
  const msgBody = `Here are the available shifts for 25/06/2023 \n\n- Morning, 8:00 am - 6:00 pm, "Waiter"\n- Afternoon, 12:00 pm - 10:00 pm, "Cashier"\n- Full Shift, 8:00 am - 10:00 pm, "Waiter"`

  axios({
    method: "POST", // Required, HTTP method, a string, e.g. POST, GET
    url: `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      // TODO: UPDATE THIS TO ZHENG JIE'S PHONE NUMBER
      to: "+60175015966",
      type: "text",
      text: { preview_url: false, body: msgBody },
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.WHATSAPP_TOKEN,
    },
  });

  res.status(200).send({ data: { success: true } });
});

app.get('/', (req, res) => {
  res.send('welcome to SHIFTSYNC');
});

app.listen(process.env.PORT, () => {
  console.log(`SHIFTSYNC listening on port ${process.env.PORT}!`);
});
