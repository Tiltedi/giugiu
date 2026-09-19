# Pack a bag, Giulia

A one-page gift: Giulia opens the link, learns she's going on a surprise weekend,
picks the weekends that work for her, and hits send.
Her answers are emailed to us. When she reopens the same link she sees her stamped
ticket and a set of countdowns, and as the trip approaches, our notes.

No build step, no framework, no login. Plain `index.html` + `styles.css` + `app.js`.
The two typefaces (Fraunces and DM Mono) load from Google Fonts.

## Before you send her the link

1. **Check `config.js`.** The weekends, the names and the milestone copy all live there.
   Each weekend is a `from` and `to` date.
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

From then on the link opens straight to her ticket and countdown, on her phone, her
laptop, or anywhere else, and the form never shows again. The "Start over" link
disappears too.

Until the weekend is confirmed, her page counts down to your next message: 25 days
from her submission, or 10 if she picked the first weekend in the list (both numbers
are `nextNews` in `config.js`). The milestone cards are listed without dates until then.

## Updating her page over time

Everything below is also in `trip.js`. Edit, push, and she sees it on her next reload.

| Field | What it does |
| --- | --- |
| `confirmed` | The weekend you picked, as its Friday: `"2026-11-20"` or `"2026-11-20T07:30"` in her local time. The ticket gets a "Confirmed" stamp, the countdown switches to departure, and the milestone cards get dates. |
| `message` | A short line from you two, shown on a yellow note above the countdowns. |
| `notes.weather`, `notes.packing`, `notes.meeting`, `notes.reveal` | Your real note for each milestone. Each appears inside its card when the countdown reaches zero (7, 3 and 1 days before, and on the day). Line breaks are kept, so a packing list works as one item per line. |
| `showEarly` | Keys of notes to show before their date, for example `["weather"]`. |

Write notes ahead of time if you like: a note stays hidden until its date unless you
list it in `showEarly`.

## Handy URL parameters

| Parameter | What it does |
| --- | --- |
| `?reset` | Clears the saved answers on that device and shows the flow from the start. |
| `?go=2026-11-20` | Sets the departure date on that device only. `confirmed` in `trip.js` does the same for every device and is the better way once her answers are in the file. |

Before `trip.js` is filled in, her answers are stored in her browser's local storage,
so her page only shows on the device she used to answer.

## Local preview

Any static server works, for example:

```
npx http-server -p 8080 -c-1 .
```

then open `http://localhost:8080/?reset`.

## The printed page

`print/giulia-a4.pdf` is an A4 page to hand her: the headline, her ticket with a QR
code on the stub that opens the site, the address in case the camera sulks, and the
sign-off. Print it at 100% on A4 with margins off and background graphics on. Once
deployed it's also at `/print/giulia-a4.pdf` on the site.

`print/giulia-a4.html` is the source. Edit it, open it in Chrome, and print to PDF with
the same settings to regenerate.
