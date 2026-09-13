# Pack a bag, Giulia

A one-page gift: Giulia opens the link, learns she's going on a surprise weekend,
picks the weekends that work for her, taps a few preferences, and hits send.
Her answers are emailed to us. When she reopens the same link she sees her stamped
ticket and a set of countdowns, and as the trip approaches, our notes.

No build step, no framework, no login. Plain `index.html` + `styles.css` + `app.js`.
The two typefaces (Fraunces and DM Mono) load from Google Fonts.

## Before you send her the link

1. **Edit `config.js`.** The weekends in there are placeholders. Set the Saturdays you
   already know work for you, and tweak the options or milestone copy if you like.
2. **Deploy it anywhere static.** GitHub Pages, Vercel, Netlify: any of them serves this
   folder as-is. Open the deployed URL on your own phone once.
3. **Activate the email delivery.** Answers are sent through
   [FormSubmit](https://formsubmit.co) to the address in `config.js`, with no account
   needed. The first submission triggers a one-time activation email to that inbox
   (check junk). Click the activate link, then run through the page once more using
   `?reset` on the URL to make sure the answers arrive. After that every submission is
   delivered straight to the inbox.

If the email service ever fails on her phone, the page still completes and offers her a
one-tap "send by email" button with her answers pre-filled.

## After she submits

Until you do this step, her answers live only in the browser she used. To make the
page hers on any device:

1. Open the email. The last row, `paste_into_trip_js`, is her answers in the exact
   shape the page expects.
2. In `trip.js`, replace `answers: null` with `answers: { ...that snippet... }`.
3. Commit and push. Vercel redeploys in under a minute.

From then on the link opens straight to her ticket and countdowns, on her phone, her
laptop, or anywhere else, and the form never shows again. The "Start over" link
disappears too.

## Updating her page over time

Everything below is also in `trip.js`. Edit, push, and she sees it on her next reload.

| Field | What it does |
| --- | --- |
| `confirmed` | The weekend you picked, `"2026-11-07"` or `"2026-11-07T07:30"` in her local time. The ticket gets a "Confirmed" stamp and every countdown locks to that date. |
| `message` | A short line from you two, shown on a yellow note above the countdowns. |
| `notes.weather`, `notes.packing`, `notes.meeting`, `notes.reveal` | Your real note for each milestone. Each appears inside its card when the countdown reaches zero (7, 3 and 1 days before, and on the day). Line breaks are kept, so a packing list works as one item per line. |
| `showEarly` | Keys of notes to show before their date, for example `["weather"]`. |

Write notes ahead of time if you like: a note stays hidden until its date unless you
list it in `showEarly`.

## Handy URL parameters

| Parameter | What it does |
| --- | --- |
| `?reset` | Clears the saved answers on that device and shows the flow from the start. |
| `?go=2026-10-24` | Locks the countdowns to a departure date on that device only. `confirmed` in `trip.js` does the same for every device and is the better way once her answers are in the file. |

Before `trip.js` is filled in, her answers are stored in her browser's local storage,
so the countdowns only show on the device she used to answer.

## Local preview

Any static server works, for example:

```
npx http-server -p 8080 -c-1 .
```

then open `http://localhost:8080/?reset`.
