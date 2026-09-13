/* ------------------------------------------------------------------
   Giulia's trip. The page reads this file on every load.

   1. When her answers arrive by email, paste them into "answers".
      From then on the link shows her ticket and countdowns on any
      device, and never the form. The email contains a ready-made
      snippet under "paste_into_trip_js".
   2. Once you've picked the weekend, set "confirmed".
   3. Write the notes as the trip approaches. Each one appears when its
      countdown unlocks (7, 3 and 1 days before, and on the day), or
      straight away if you list its key under "showEarly".
   ------------------------------------------------------------------ */
window.GIUGIU_TRIP = {
  // Paste her answers here. Example:
  // answers: {
  //   weekends: ["2026-10-17", "2026-11-07"],
  //   direction: "South",
  //   kind: "Sea",
  //   vibe: "Slow & cosy",
  //   avoid: "",
  //   submittedAt: "2026-09-20T10:12:00.000Z",
  // },
  answers: null,

  // The weekend you picked: "YYYY-MM-DD", or "YYYY-MM-DDTHH:MM" in her local time.
  confirmed: null,

  // A short line from you two, shown on her page. null hides it.
  message: null,

  // Notes she can expand. Keys match the milestones in config.js.
  // Line breaks are kept, so a packing list can be one item per line.
  notes: {
    weather: null,
    packing: null,
    meeting: null,
    reveal: null,
  },

  // Keys of notes to show before their countdown unlocks, e.g. ["weather"].
  showEarly: [],
};
