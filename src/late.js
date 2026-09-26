/* Runs the UI registrations queued by engine-side modules (LATE), now that UI exists. */
LATE.forEach(f => f());
