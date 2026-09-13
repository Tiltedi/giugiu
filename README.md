# Pack a bag, Giulia

A one-page gift: Giulia opens the link, learns she's going on a surprise weekend,
picks the weekends that work for her, taps a few preferences, and hits send.
Her answers are emailed to us. When she reopens the same link she sees her stamped
ticket and a set of countdowns.

No build step, no framework, no login. Plain `index.html` + `styles.css` + `app.js`,
with the fonts self-hosted in `fonts/`.

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

## Handy URL parameters

| Parameter | What it does |
| --- | --- |
| `?reset` | Clears the saved answers on that device and shows the flow from the start. |
| `?go=2026-10-24` | Locks the countdowns to the confirmed departure date. Send her the link with this once you've picked the weekend; the page remembers it. Add a time with `?go=2026-10-24T07:30`. |

Her answers and the confirmed date are stored in her browser's local storage, so the
countdowns only show on the device she used to answer.

## Local preview

Any static server works, for example:

```
npx http-server -p 8080 -c-1 .
```

then open `http://localhost:8080/?reset`.
