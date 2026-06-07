import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTe2eNxqIfQQXdTDWFXPeJl1uNfH1k3_IXxUjXT31HyzShXt-5HS1sFZZP3AfN_F6Ky7CAGC_YGntS6/pub?gid=1712904557&single=true&output=csv';
const PLAYERS_FILE_PATH = path.join(__dirname, '../src/data/players.ts');

const TARGET_TEAMS = new Set([
  'Mexico', 'South Africa', 'South Korea', 'Czech Republic', 'Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland',
  'Brazil', 'Morocco', 'Haiti', 'Scotland', 'United States', 'Paraguay', 'Australia', 'Turkey', 'Germany', 'Curacao',
  'Ivory Coast', 'Ecuador', 'Netherlands', 'Japan', 'Sweden', 'Tunisia', 'Belgium', 'Egypt', 'Iran', 'New Zealand',
  'Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay', 'France', 'Senegal', 'Iraq', 'Norway', 'Argentina', 'Algeria',
  'Austria', 'Jordan', 'Portugal', 'DR Congo', 'Uzbekistan', 'Colombia', 'England', 'Croatia', 'Ghana', 'Panama'
]);

const TEAM_MAP = {
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Türkiye': 'Turkey',
  'Curaçao': 'Curacao'
};

// Helper to clean and map team names
function cleanTeamName(name) {
  if (!name) return null;
  const trimmed = name.trim();
  return TEAM_MAP[trimmed] || trimmed;
}

// Fetch helper using node built-in https with redirect support
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchCSV(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch: Status ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Simple CSV line parser that handles quotes if any
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function run() {
  console.log('Fetching player data from Google Sheets...');
  try {
    const csvContent = await fetchCSV(SHEET_CSV_URL);
    const lines = csvContent.split(/\r?\n/);
    
    const rosters = {};
    let activeTeams = []; // array of { name, colIndex }
    
    // Parse line by line
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (!line || line.trim() === '') continue;
      
      const cells = parseCSVLine(line);
      
      // Check if this row is a team header row.
      // We look at candidate columns: 1, 4, 7, 10, 13, 16, 19, 22.
      // A row is a team header if at least one cell in these columns matches a known team name (direct or mapped).
      let isHeaderRow = false;
      const parsedHeaderTeams = [];
      
      for (let col = 1; col < cells.length; col += 3) {
        const cellVal = cells[col];
        if (cellVal && cellVal.trim() !== '') {
          const cleanedName = cleanTeamName(cellVal);
          if (TARGET_TEAMS.has(cleanedName)) {
            isHeaderRow = true;
            parsedHeaderTeams.push({ name: cleanedName, colIndex: col });
          }
        }
      }
      
      if (isHeaderRow) {
        activeTeams = parsedHeaderTeams;
        // Initialize rosters for these teams if they don't exist
        for (const t of activeTeams) {
          if (!rosters[t.name]) {
            rosters[t.name] = [];
          }
        }
        console.log(`Found team group: ${activeTeams.map(t => t.name).join(', ')}`);
        continue;
      }
      
      // If we have active teams, extract player data from subsequent rows until next group/header
      if (activeTeams.length > 0) {
        // If the row starts with a federation header, clear active teams
        const firstCellCleaned = cleanTeamName(cells[1]);
        if (firstCellCleaned && ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].includes(firstCellCleaned.toUpperCase())) {
          activeTeams = [];
          continue;
        }
        
        // Extract players for each active team
        for (const team of activeTeams) {
          const nameCol = team.colIndex;
          const posCol = team.colIndex + 1;
          
          if (nameCol < cells.length) {
            const pName = cells[nameCol] ? cells[nameCol].trim() : '';
            const pPos = posCol < cells.length && cells[posCol] ? cells[posCol].trim().toUpperCase() : '';
            
            // Validate position
            const validPositions = ['GK', 'DF', 'MF', 'FW'];
            if (pName && pName !== '' && validPositions.includes(pPos)) {
              rosters[team.name].push({ name: pName, position: pPos });
            }
          }
        }
      }
    }
    
    // Verify we got rosters for all 48 teams
    const missingTeams = [];
    for (const team of TARGET_TEAMS) {
      if (!rosters[team] || rosters[team].length === 0) {
        missingTeams.push(team);
      }
    }
    
    if (missingTeams.length > 0) {
      console.warn(`Warning: Missing player data for teams: ${missingTeams.join(', ')}`);
    } else {
      console.log('Successfully crawled all 48 teams!');
    }
    
    // Generate REAL_TEAM_ROSTERS code representation
    let codeStr = 'const REAL_TEAM_ROSTERS: Record<string, BasePlayer[]> = {\n';
    
    // Sort teams alphabetically for clean diffs
    const sortedTeams = Object.keys(rosters).sort();
    for (const teamName of sortedTeams) {
      const players = rosters[teamName];
      const gk = players.filter(p => p.position === 'GK').map(p => p.name);
      const df = players.filter(p => p.position === 'DF').map(p => p.name);
      const mf = players.filter(p => p.position === 'MF').map(p => p.name);
      const fw = players.filter(p => p.position === 'FW').map(p => p.name);
      
      const formatList = (list) => list.map(name => `'${name.replace(/'/g, "\\'")}'`).join(', ');
      
      codeStr += `  '${teamName}': makeTeam(\n`;
      codeStr += `    [${formatList(gk)}],\n`;
      codeStr += `    [${formatList(df)}],\n`;
      codeStr += `    [${formatList(mf)}],\n`;
      codeStr += `    [${formatList(fw)}],\n`;
      codeStr += `  ),\n`;
    }
    codeStr += '};';
    
    // Read current players.ts content
    console.log(`Reading players file from ${PLAYERS_FILE_PATH}...`);
    const fileContent = fs.readFileSync(PLAYERS_FILE_PATH, 'utf8');
    
    // Find the start of REAL_TEAM_ROSTERS
    const startStr = 'const REAL_TEAM_ROSTERS: Record<string, BasePlayer[]> = {';
    const startIndex = fileContent.indexOf(startStr);
    if (startIndex === -1) {
      throw new Error('Could not find const REAL_TEAM_ROSTERS in players.ts');
    }
    
    // Find the end of REAL_TEAM_ROSTERS. We know it ends with }; followed by const FIRST_NAMES
    const endStr = 'const FIRST_NAMES = [';
    const endIndex = fileContent.indexOf(endStr);
    if (endIndex === -1) {
      throw new Error('Could not find const FIRST_NAMES in players.ts');
    }
    
    // Extract everything before start and after end (including 'const FIRST_NAMES')
    const beforeBlock = fileContent.substring(0, startIndex);
    const afterBlock = fileContent.substring(endIndex);
    
    // Combine to get the new file content (ensure proper spacing)
    const newFileContent = beforeBlock + codeStr + '\n\n' + afterBlock;
    
    // Write back to players.ts
    console.log('Writing updated player rosters back to players.ts...');
    fs.writeFileSync(PLAYERS_FILE_PATH, newFileContent, 'utf8');
    console.log('Done! src/data/players.ts successfully updated.');
    
  } catch (error) {
    console.error('Error in player crawler:', error);
    process.exit(1);
  }
}

run();
