/**
 * Google Sheet lead log for visionbotix.com (S6). api/contact.js POSTs every lead here when LEAD_WEBHOOK_URL is set.
 *
 * Setup (5 minutes, owner):
 *  1. Create a Google Sheet, e.g. "Website leads". Extensions → Apps Script. Replace the code with this file. Save.
 *  2. Project Settings → Script properties → add SECRET = a long random string (the same value goes in Vercel).
 *  3. Deploy → New deployment → type "Web app". Execute as: Me. Who has access: Anyone. Deploy, authorise, and copy
 *     the web app URL (https://script.google.com/macros/s/…/exec).
 *  4. Vercel → visionbotix-site → Settings → Environment Variables (Production):
 *       LEAD_WEBHOOK_URL    = that URL
 *       LEAD_WEBHOOK_SECRET = the same SECRET
 *     then redeploy. Send a test from /contact/ and check that a row appears.
 * The sheet gets a header row on the first lead. Leads keep arriving by email too if RESEND_API_KEY is set.
 */
const COLUMNS = ['receivedAt', 'form', 'name', 'email', 'company', 'country', 'topic', 'budget', 'range', 'call', 'timezone', 'source', 'landing', 'message'];

function doPost(e) {
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  let lead;
  try {
    lead = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad json' });
  }
  if (!secret || lead.secret !== secret) return reply({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    // Prefix values that a spreadsheet would run as a formula (CSV/formula injection).
    sheet.appendRow(COLUMNS.map((k) => {
      const v = lead[k] === undefined || lead[k] === null ? '' : String(lead[k]);
      return /^[=+\-@]/.test(v) ? `'${v}` : v;
    }));
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
