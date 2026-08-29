/**
 * Premier League Squad Crawler (EPL 26/27 Season)
 *
 * Requirements:
 *   npm install axios cheerio
 *
 * Usage:
 *   node scripts/crawl_epl_squads.js
 *
 * Description:
 *   Crawls official Premier League club squad pages for the 20 clubs
 *   competing in the 2026/27 EPL season. Extracts player names and positions
 *   (GK, DF, MF, FW) and saves structured data to scripts/output/epl_2627_squads.json
 *   in a schema matching the Team interface used by the Football Prediction Tool.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================

const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'epl_2627_squads.json');

const REQUEST_DELAY_MS = 2000; // 2 seconds delay between requests for rate limiting
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 15000;

// Browser-like HTTP headers to prevent anti-bot false positives
const HTTP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

/**
 * 20 EPL 26/27 Clubs with their official Premier League IDs and Slugs
 * URL format: https://www.premierleague.com/clubs/{id}/{slug}/squad
 */
const EPL_2627_CLUBS = [
  {
    id: 'arsenal',
    plClubId: 1,
    slug: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    rating: 91
  },
  {
    id: 'aston-villa',
    plClubId: 2,
    slug: 'aston-villa',
    name: 'Aston Villa',
    shortName: 'AVL',
    rating: 85
  },
  {
    id: 'afc-bournemouth',
    plClubId: 127,
    altClubIds: [2],
    slug: 'afc-bournemouth',
    name: 'AFC Bournemouth',
    shortName: 'BOU',
    rating: 80
  },
  {
    id: 'brentford',
    plClubId: 130,
    slug: 'brentford',
    name: 'Brentford',
    shortName: 'BRE',
    rating: 84
  },
  {
    id: 'brighton-and-hove-albion',
    plClubId: 131,
    slug: 'brighton-and-hove-albion',
    name: 'Brighton & Hove Albion',
    shortName: 'BHA',
    rating: 84
  },
  {
    id: 'chelsea',
    plClubId: 4,
    slug: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    rating: 89
  },
  {
    id: 'coventry-city',
    plClubId: 9,
    altClubIds: [5],
    slug: 'coventry-city',
    name: 'Coventry City',
    shortName: 'COV',
    rating: 74
  },
  {
    id: 'crystal-palace',
    plClubId: 6,
    slug: 'crystal-palace',
    name: 'Crystal Palace',
    shortName: 'CRY',
    rating: 82
  },
  {
    id: 'everton',
    plClubId: 7,
    slug: 'everton',
    name: 'Everton',
    shortName: 'EVE',
    rating: 76
  },
  {
    id: 'fulham',
    plClubId: 34,
    altClubIds: [42],
    slug: 'fulham',
    name: 'Fulham',
    shortName: 'FUL',
    rating: 81
  },
  {
    id: 'hull-city',
    plClubId: 41,
    altClubIds: [34],
    slug: 'hull-city',
    name: 'Hull City',
    shortName: 'HUL',
    rating: 73
  },
  {
    id: 'ipswich-town',
    plClubId: 40,
    altClubIds: [8],
    slug: 'ipswich-town',
    name: 'Ipswich Town',
    shortName: 'IPS',
    rating: 75
  },
  {
    id: 'leeds-united',
    plClubId: 24,
    altClubIds: [9],
    slug: 'leeds-united',
    name: 'Leeds United',
    shortName: 'LEE',
    rating: 75
  },
  {
    id: 'liverpool',
    plClubId: 10,
    slug: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    rating: 91
  },
  {
    id: 'manchester-city',
    plClubId: 11,
    altClubIds: [50],
    slug: 'manchester-city',
    name: 'Manchester City',
    shortName: 'MCI',
    rating: 92
  },
  {
    id: 'manchester-united',
    plClubId: 12,
    slug: 'manchester-united',
    name: 'Manchester United',
    shortName: 'MUN',
    rating: 88
  },
  {
    id: 'newcastle-united',
    plClubId: 23,
    slug: 'newcastle-united',
    name: 'Newcastle United',
    shortName: 'NEW',
    rating: 86
  },
  {
    id: 'nottingham-forest',
    plClubId: 15,
    slug: 'nottingham-forest',
    name: 'Nottingham Forest',
    shortName: 'NFO',
    rating: 79
  },
  {
    id: 'sunderland',
    plClubId: 29,
    altClubIds: [45],
    slug: 'sunderland',
    name: 'Sunderland AFC',
    shortName: 'SUN',
    rating: 74
  },
  {
    id: 'tottenham-hotspur',
    plClubId: 21,
    altClubIds: [33],
    slug: 'tottenham-hotspur',
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    rating: 88
  }
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalizes raw position strings to standard project types: 'GK' | 'DF' | 'MF' | 'FW'
 */
function normalizePosition(rawPos) {
  if (!rawPos) return 'MF';
  const clean = rawPos.trim().toLowerCase();

  if (
    clean === 'gk' ||
    clean === 'gkp' ||
    clean.includes('goal') ||
    clean.includes('keeper')
  ) {
    return 'GK';
  }
  if (
    clean === 'df' ||
    clean === 'def' ||
    clean.includes('defen') ||
    clean.includes('back') ||
    clean.includes('centre-back') ||
    clean.includes('fullback')
  ) {
    return 'DF';
  }
  if (
    clean === 'mf' ||
    clean === 'mid' ||
    clean.includes('midfield') ||
    clean.includes('winger')
  ) {
    return 'MF';
  }
  if (
    clean === 'fw' ||
    clean === 'fwd' ||
    clean.includes('forw') ||
    clean.includes('strik') ||
    clean.includes('attack')
  ) {
    return 'FW';
  }

  return 'MF'; // Default fallback
}

/**
 * Cleans and formats player names
 */
function cleanPlayerName(rawName) {
  if (!rawName) return '';
  return rawName
    .replace(/\s+/g, ' ')
    .replace(/^\d+\s+/, '') // Strip squad number prefix if present
    .trim();
}

/**
 * Builds standard player ID conforming to project convention (e.g. ars-gk1, mci-fw2)
 */
function generatePlayerId(teamShortCode, position, index) {
  return `${teamShortCode.toLowerCase()}-${position.toLowerCase()}${index}`;
}

// ==========================================
// HTTP REQUEST HANDLER WITH RETRIES
// ==========================================

/**
 * Fetches HTML from a URL with retry logic and backoff
 */
async function fetchWithRetry(url, attempt = 1) {
  try {
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: (status) => status === 200
    });
    return response.data;
  } catch (error) {
    const statusCode = error.response ? error.response.status : null;
    const isClientError = statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429;

    // Do not retry 404 or client errors unless it's rate limited (429)
    if (isClientError && statusCode !== 429) {
      throw error;
    }

    if (attempt < MAX_RETRIES) {
      const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(
        `\x1b[33m  [WARN] Attempt ${attempt} failed (${error.message}). Retrying in ${backoffDelay / 1000}s...\x1b[0m`
      );
      await sleep(backoffDelay);
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

// ==========================================
// CHEERIO & DOM PARSER STRATEGIES
// ==========================================

/**
 * Extracts player data from Premier League squad page HTML using multiple fallback strategies
 */
function parseSquadHtml(html) {
  const players = [];
  const seenNames = new Set();

  function addPlayer(name, rawPos) {
    const cleanedName = cleanPlayerName(name);
    if (!cleanedName || cleanedName.length < 2) return;
    if (seenNames.has(cleanedName.toLowerCase())) return;

    // Filter out common UI strings that might be accidentally selected
    const excludedKeywords = [
      'position', 'squad', 'player', 'first team', 'under-21', 'view profile',
      'club', 'premier league', 'stats', 'filter', 'all positions'
    ];
    if (excludedKeywords.includes(cleanedName.toLowerCase())) return;

    const position = normalizePosition(rawPos);
    seenNames.add(cleanedName.toLowerCase());
    players.push({
      name: cleanedName,
      position
    });
  }

  // Strategy 1: Check for Next.js / Initial State JSON embedded in page
  try {
    const $ = cheerio.load(html);
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript);
      const pageProps = nextData?.props?.pageProps;
      const squadList =
        pageProps?.squad ||
        pageProps?.players ||
        pageProps?.club?.squad ||
        pageProps?.team?.squad;

      if (Array.isArray(squadList) && squadList.length > 0) {
        for (const p of squadList) {
          const name = p.name?.display || p.name?.full || `${p.name?.first || ''} ${p.name?.last || ''}`.trim() || p.name;
          const pos = p.info?.positionInfo || p.position || p.info?.position;
          if (name) {
            addPlayer(name, pos);
          }
        }
        if (players.length >= 10) return players;
      }
    }
  } catch {
    // Continue to DOM selectors
  }

  const $ = cheerio.load(html);

  // Strategy 2: Position Sections (e.g. Goalkeepers, Defenders, Midfielders, Forwards)
  $('section, div.squad-list, div.squadList, ul.squadList, .squad-section').each((_, section) => {
    const sectionTitle = $(section)
      .find('header, h2, h3, h4, .squad-list__header, .squadListHeader')
      .first()
      .text()
      .trim();

    let sectionPos = 'MF';
    if (/goalkeeper|keeper|gk/i.test(sectionTitle)) sectionPos = 'GK';
    else if (/defender|back|df/i.test(sectionTitle)) sectionPos = 'DF';
    else if (/midfield|mf/i.test(sectionTitle)) sectionPos = 'MF';
    else if (/forward|striker|attacker|fw/i.test(sectionTitle)) sectionPos = 'FW';

    // Find all player cards/items in this section
    $(section)
      .find('.player-card, .squadList__item, .squad-list__item, li.player, .playerCard, .stats-card')
      .each((_, card) => {
        const nameEl = $(card).find('.name, .player-name, .playerCard__name, h4, h3, a.name, .stats-card__name, .player-card__name');
        const posEl = $(card).find('.position, .playerCard__position, .player-position, .info, .stats-card__position');

        const playerName = nameEl.first().text().trim();
        const playerPos = posEl.first().text().trim() || sectionPos;

        if (playerName) {
          addPlayer(playerName, playerPos);
        }
      });
  });

  if (players.length >= 10) return players;

  // Strategy 3: Global Player Card Selectors
  const playerCardSelectors = [
    '.player-overview-card',
    '.squad-player',
    '.player-card',
    '.squadList__item',
    '.squad-list__item',
    '.playerCard',
    '[data-player]',
    'li.player',
    '.stats-card'
  ];

  $(playerCardSelectors.join(', ')).each((_, card) => {
    const nameEl = $(card).find(
      '.name, .player-name, .playerCard__name, h4, h3, a.name, .stats-card__name, .player-card__name, .player-name-container'
    );
    const posEl = $(card).find(
      '.position, .playerCard__position, .player-position, .info, .stats-card__position, .player-role'
    );

    const playerName = nameEl.first().text().trim();
    const playerPos = posEl.first().text().trim();

    if (playerName) {
      addPlayer(playerName, playerPos);
    }
  });

  if (players.length >= 10) return players;

  // Strategy 4: Table Rows (e.g. table.squad-table)
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      const name = $(cells[0]).text().trim() || $(cells[1]).text().trim();
      const pos = $(cells[1]).text().trim() || $(cells[2]).text().trim();
      if (name && name.length > 2) {
        addPlayer(name, pos);
      }
    }
  });

  return players;
}

// ==========================================
// MAIN CRAWLER EXECUTION
// ==========================================

async function crawlEplSquads() {
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[36m        Premier League Squad Crawler (EPL 26/27)        \x1b[0m');
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log(`Targeting ${EPL_2627_CLUBS.length} clubs with a ${REQUEST_DELAY_MS / 1000}s rate limit...\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}\n`);
  }

  const results = [];
  let successCount = 0;
  let partialCount = 0;
  let failedCount = 0;

  for (let i = 0; i < EPL_2627_CLUBS.length; i++) {
    const club = EPL_2627_CLUBS[i];
    const clubIndex = `[${i + 1}/${EPL_2627_CLUBS.length}]`;
    console.log(`${clubIndex} Fetching \x1b[1m${club.name}\x1b[0m (slug: ${club.slug})...`);

    // Prepare candidate URLs (primary ID, plus any alternative IDs)
    const candidateIds = [club.plClubId, ...(club.altClubIds || [])];
    let extractedPlayers = [];
    let successfulUrl = null;

    for (const clubId of candidateIds) {
      const targetUrl = `https://www.premierleague.com/clubs/${clubId}/${club.slug}/squad`;
      try {
        console.log(`  Connecting: ${targetUrl}`);
        const html = await fetchWithRetry(targetUrl);
        const parsed = parseSquadHtml(html);

        if (parsed.length > 0) {
          extractedPlayers = parsed;
          successfulUrl = targetUrl;
          break;
        }
      } catch (err) {
        console.log(`  \x1b[33m[WARN] Failed connecting to ${targetUrl} (${err.message})\x1b[0m`);
      }
    }

    // Format players to match Team interface
    const positionCounters = { GK: 0, DF: 0, MF: 0, FW: 0 };
    const formattedPlayers = extractedPlayers.map((p) => {
      positionCounters[p.position] = (positionCounters[p.position] || 0) + 1;
      return {
        id: generatePlayerId(club.shortName, p.position, positionCounters[p.position]),
        name: p.name,
        position: p.position
      };
    });

    // Build Team object
    const teamData = {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      group: 'A',
      rating: club.rating,
      players: formattedPlayers
    };

    results.push(teamData);

    if (formattedPlayers.length >= 11) {
      console.log(
        `  \x1b[32m✓ Success:\x1b[0m Found ${formattedPlayers.length} players (${positionCounters.GK} GK, ${positionCounters.DF} DF, ${positionCounters.MF} MF, ${positionCounters.FW} FW)`
      );
      successCount++;
    } else if (formattedPlayers.length > 0) {
      console.log(
        `  \x1b[33m⚠ Partial data:\x1b[0m Found ${formattedPlayers.length} players`
      );
      partialCount++;
    } else {
      console.log(
        `  \x1b[31m✗ No squad data retrieved\x1b[0m (placeholder team object created)`
      );
      failedCount++;
    }

    // Rate limiting: wait before processing next club (except after the last one)
    if (i < EPL_2627_CLUBS.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  // Write output JSON
  console.log('\nWriting output file...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');

  console.log('\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[32m Crawl Completed!\x1b[0m');
  console.log(` Total Clubs Processed : ${results.length}`);
  console.log(` Full Squads Retrieved  : ${successCount}`);
  console.log(` Partial Squads         : ${partialCount}`);
  console.log(` Failed Squads          : ${failedCount}`);
  console.log(` Output File Saved To   : ${OUTPUT_FILE}`);
  console.log('\x1b[36m========================================================\x1b[0m');
}

// Execute the crawler
crawlEplSquads().catch((err) => {
  console.error('\x1b[31m[FATAL ERROR] Crawler execution failed:\x1b[0m', err);
  process.exit(1);
});
