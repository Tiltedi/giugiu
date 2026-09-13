/* ------------------------------------------------------------------
   Everything you might want to change lives here.
   Edit, save, redeploy. No other file needs touching.
   ------------------------------------------------------------------ */
window.GIUGIU = {
  name: "Giulia",
  companion: "Luca",                  // who actually travels with her
  from: "the two of us",              // sign-off on the last screen (the gift-givers)
  email: "luca.pilurzu@hotmail.com",  // where her answers are emailed

  // Candidate weekends: the Saturday of each one, as YYYY-MM-DD.
  // She sees them as "Sat 17 – Sun 18 Oct". Add or remove freely.
  weekends: [
    "2026-10-17",
    "2026-10-24",
    "2026-11-07",
    "2026-11-14",
    "2026-11-28",
  ],

  // Countdowns assume you leave at this hour (her local time) on the Saturday.
  departureHour: 8,

  // Optional: her birthday as YYYY-MM-DD adds a "Your 40th" countdown. null hides it.
  birthday: null,

  // Tap-to-choose options. Keep them short so they fit on a phone.
  directions: ["North", "South", "East", "West", "Anywhere"],
  kinds: ["City", "Sea", "Mountains", "Countryside"],
  vibes: ["Slow & cosy", "Big nights", "Eat everything", "Explore all day"],

  // Countdowns she can expand after submitting. daysBefore counts back from departure.
  milestones: [
    { title: "Weather check", daysBefore: 7, detail: "One week out we tell you what the sky's doing. Pack for it." },
    { title: "Packing note",  daysBefore: 3, detail: "What to bring, what to leave." },
    { title: "Where to be",   daysBefore: 1, detail: "Meeting point and time. Still not the place." },
    { title: "The reveal",    daysBefore: 0, detail: "You'll know when you arrive. Not before." },
  ],
};
