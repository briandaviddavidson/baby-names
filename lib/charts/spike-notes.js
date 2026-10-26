// Likely pop-culture triggers for spikes in insights/spikes.json. Editorial: the
// SSA data shows only the jump, not its cause. Only well-documented cases are
// listed; a name without an entry shows no trigger. Keyed by "Name:sex:year".
export const SPIKE_NOTES = {
  'Kizzy:F:1977': 'Kizzy in the TV miniseries Roots (1977)',
  'Nakia:F:1974': 'the TV series Nakia (1974)',
  'Aaliyah:F:1994': 'the singer Aaliyah’s debut album (1994)',
  'Deanna:F:1937': 'the actress Deanna Durbin’s first hit films (1936–37)',
  'Tammy:F:1957': 'the film Tammy and the Bachelor and its hit song “Tammy” (1957)',
  'Nevaeh:F:2001': '“heaven” spelled backward, after the singer Sonny Sandoval named his daughter Nevaeh on MTV (2000)',
  'Ashanti:F:2002': 'the singer Ashanti’s debut album (2002)',
  'Dawson:M:1998': 'the TV series Dawson’s Creek (1998)',
  'Marlene:F:1931': 'the actress Marlene Dietrich’s first Hollywood films (1930–31)',
  'Jaime:F:1976': 'Jaime Sommers in the TV series The Bionic Woman (1976)',
};

export const spikeNote = (s) => SPIKE_NOTES[`${s.name}:${s.sex}:${s.year}`] ?? null;
