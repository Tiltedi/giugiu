/* ------------------------------------------------------------------
   Everything you might want to change lives here.
   Edit, save, push. No other file needs touching.
   ------------------------------------------------------------------ */
window.GIUGIU = {
  name: "Giulia",
  companion: "Luca",                  // who actually travels with her
  givers: "Marijke, Luca, Mamma & Papa",    // everyone the gift is from: named on the first screen
  from: "Marijke, Luca, Mamma, and Papa",   // who signs off the last screen
  email: "luca.pilurzu@hotmail.com",  // where her answers are emailed
  preview: false,                     // true = complete the flow without emailing (for test builds)

  // The weekends she can choose from. She sees each as "Fri 9 – Sun 11 Oct".
  weekends: [
    { from: "2026-10-09", to: "2026-10-11" },
    { from: "2026-11-20", to: "2026-11-22" },
    { from: "2026-12-04", to: "2026-12-06" },
    { from: "2027-01-15", to: "2027-01-17" },
    { from: "2027-01-22", to: "2027-01-24" },
  ],

  // After she submits, her page counts down to your next message.
  // The shorter wait applies when she picked the first weekend in the list above.
  nextNews: { days: 25, daysIfEarliest: 10 },

  // Countdowns assume you leave at this hour (her local time) on the first day.
  departureHour: 8,

  // Optional: her birthday as YYYY-MM-DD adds a "Your 40th" countdown. null hides it.
  birthday: null,

  // Countdowns she can expand once the weekend is confirmed. daysBefore counts back from departure.
  // "detail" is the teaser; your real note for each key goes in trip.js.
  milestones: [
    { key: "weather", title: "Weather check", daysBefore: 7, detail: "One week out we tell you what the sky's doing. Pack for it." },
    { key: "packing", title: "Packing note",  daysBefore: 3, detail: "What to bring, what to leave." },
    { key: "meeting", title: "Where to be",   daysBefore: 1, detail: "Meeting point and time. Still not the place." },
    { key: "reveal",  title: "The reveal",    daysBefore: 0, detail: "You'll know when you arrive. Not before." },
  ],
};
