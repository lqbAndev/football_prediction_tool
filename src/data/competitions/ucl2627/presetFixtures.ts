import type { LeagueMatch } from '../../../types/leagueConfig';

/**
 * Official 2026/27 UCL league-phase pairings, transcribed from Bongdaplus
 * (published 30 August 2026). One line is one matchday; home team is first.
 */
const OFFICIAL_FIXTURE_ROWS = [
  'aek|lask,club-brugge|aston-villa,dortmund|villarreal,porto|man-city,lille|real-betis,real-madrid|inter,barcelona|feyenoord,stuttgart|viking,liverpool|atletico,napoli|arsenal,psg|slovan-bratislava,sporting|galatasaray,fenerbahce|roma,psv|shakhtar,bayern|bodo-glimt,como|leipzig,man-united|sabah,slavia-praha|lens',
  'lens|sporting,sabah|slavia-praha,arsenal|lille,atletico|man-united,galatasaray|barcelona,inter|club-brugge,leipzig|psv,viking|bayern,feyenoord|como,lask|liverpool,roma|real-madrid,aston-villa|fenerbahce,real-betis|porto,bodo-glimt|dortmund,man-city|psg,shakhtar|aek,slovan-bratislava|stuttgart,villarreal|napoli',
  'fenerbahce|slavia-praha,sabah|dortmund,roma|slovan-bratislava,porto|psv,liverpool|villarreal,man-city|aek,napoli|bodo-glimt,psg|barcelona,stuttgart|atletico,como|man-united,lille|galatasaray,aston-villa|viking,bayern|arsenal,real-betis|feyenoord,club-brugge|lens,inter|shakhtar,real-madrid|leipzig,sporting|lask',
  'galatasaray|stuttgart,shakhtar|sporting,atletico|bayern,barcelona|aston-villa,bodo-glimt|lille,feyenoord|inter,lask|slovan-bratislava,man-united|roma,villarreal|psg,aek|real-madrid,fenerbahce|liverpool,dortmund|real-betis,porto|napoli,lens|como,psv|club-brugge,leipzig|man-city,slavia-praha|arsenal,viking|sabah',
  'bodo-glimt|lask,galatasaray|aston-villa,arsenal|dortmund,como|aek,feyenoord|porto,man-city|napoli,leipzig|lens,real-madrid|psv,slovan-bratislava|real-betis,sabah|barcelona,slavia-praha|villarreal,atletico|viking,club-brugge|liverpool,inter|stuttgart,lille|bayern,psg|roma,shakhtar|fenerbahce,sporting|man-united',
  'viking|feyenoord,villarreal|sabah,aek|galatasaray,roma|sporting,aston-villa|psg,barcelona|man-city,bayern|slavia-praha,man-united|leipzig,napoli|club-brugge,real-betis|como,slovan-bratislava|shakhtar,arsenal|real-madrid,dortmund|inter,lask|fenerbahce,lens|bodo-glimt,liverpool|porto,psv|atletico,stuttgart|lille',
  'bodo-glimt|atletico,galatasaray|feyenoord,aek|roma,aston-villa|dortmund,porto|slavia-praha,inter|liverpool,lille|slovan-bratislava,real-madrid|lask,stuttgart|club-brugge,fenerbahce|villarreal,sabah|napoli,real-betis|arsenal,como|psg,lens|man-city,man-united|bayern,leipzig|shakhtar,sporting|barcelona,viking|psv',
  'arsenal|sabah,roma|lille,atletico|fenerbahce,barcelona|como,bayern|real-betis,club-brugge|bodo-glimt,dortmund|aek,feyenoord|leipzig,lask|porto,liverpool|lens,man-city|sporting,napoli|viking,psg|galatasaray,psv|stuttgart,shakhtar|real-madrid,slavia-praha|aston-villa,slovan-bratislava|inter,villarreal|man-united',
] as const;

export const PRESET_UCL_FIXTURES: LeagueMatch[] = OFFICIAL_FIXTURE_ROWS.flatMap((row, matchweek) =>
  row.split(',').map((pair, index) => {
    const [homeTeamId, awayTeamId] = pair.split('|');
    return {
      id: `ucl-md${matchweek + 1}-m${index + 1}`,
      matchweek: matchweek + 1,
      homeTeamId,
      awayTeamId,
      homeScore: null,
      awayScore: null,
      status: 'pending',
      predictedAt: null,
    };
  }),
);
