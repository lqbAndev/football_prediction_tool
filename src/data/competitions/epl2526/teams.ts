import type { Team } from '../../../types/tournament';

// Static logo imports to ensure Vite hashes and packages them correctly for production
import arsenalLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/arsenal.football-logos.cc.png';
import astonVillaLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/aston-villa.football-logos.cc.png';
import bournemouthLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/bournemouth.football-logos.cc.png';
import brentfordLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/brentford.football-logos.cc.png';
import brightonLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/brighton.football-logos.cc.png';
import burnleyLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/burnley.football-logos.cc.png';
import chelseaLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/chelsea.football-logos.cc.png';
import crystalPalaceLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/crystal-palace.football-logos.cc.png';
import evertonLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/everton.football-logos.cc.png';
import fulhamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/fulham.football-logos.cc.png';
import leedsLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/leeds-united.football-logos.cc.png';
import liverpoolLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/liverpool.football-logos.cc.png';
import manCityLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/manchester-city.football-logos.cc.png';
import manUtdLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/manchester-united.football-logos.cc.png';
import newcastleLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/newcastle.football-logos.cc.png';
import nottinghamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/nottingham-forest.football-logos.cc.png';
import sunderlandLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/sunderland.football-logos.cc.png';
import tottenhamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/tottenham.football-logos.cc.png';
import westHamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/west-ham.football-logos.cc.png';
import wolvesLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/wolves.football-logos.cc.png';

export const EPL_TEAMS: Team[] = [
  {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    group: 'A',
    rating: 91, // Tier S
    players: [
      { id: 'ars-gk1', name: 'David Raya', position: 'GK' },
      { id: 'ars-df1', name: 'William Saliba', position: 'DF' },
      { id: 'ars-df2', name: 'Gabriel Magalhaes', position: 'DF' },
      { id: 'ars-df3', name: 'Ben White', position: 'DF' },
      { id: 'ars-df4', name: 'Jurrien Timber', position: 'DF' },
      { id: 'ars-df5', name: 'Riccardo Calafiori', position: 'DF' },
      { id: 'ars-mf1', name: 'Martin Odegaard', position: 'MF' },
      { id: 'ars-mf2', name: 'Declan Rice', position: 'MF' },
      { id: 'ars-mf3', name: 'Thomas Partey', position: 'MF' },
      { id: 'ars-mf4', name: 'Mikel Merino', position: 'MF' },
      { id: 'ars-mf5', name: 'Ethan Nwaneri', position: 'MF' }, // Updated for 2026 breakout
      { id: 'ars-fw1', name: 'Bukayo Saka', position: 'FW' },
      { id: 'ars-fw2', name: 'Kai Havertz', position: 'FW' },
      { id: 'ars-fw3', name: 'Leandro Trossard', position: 'FW' },
      { id: 'ars-fw4', name: 'Gabriel Martinelli', position: 'FW' }
    ]
  },
  {
    id: 'man-city',
    name: 'Manchester City',
    shortName: 'MCI',
    group: 'A',
    rating: 92, // Tier S
    players: [
      { id: 'mci-gk1', name: 'Ederson', position: 'GK' },
      { id: 'mci-df1', name: 'Ruben Dias', position: 'DF' },
      { id: 'mci-df2', name: 'John Stones', position: 'DF' },
      { id: 'mci-df3', name: 'Kyle Walker', position: 'DF' },
      { id: 'mci-df4', name: 'Josko Gvardiol', position: 'DF' },
      { id: 'mci-df5', name: 'Manuel Akanji', position: 'DF' },
      { id: 'mci-mf1', name: 'Rodri', position: 'MF' },
      { id: 'mci-mf2', name: 'Kevin De Bruyne', position: 'MF' },
      { id: 'mci-mf3', name: 'Bernardo Silva', position: 'MF' },
      { id: 'mci-mf4', name: 'Phil Foden', position: 'MF' },
      { id: 'mci-mf5', name: 'Ilkay Gundogan', position: 'MF' }, // Updated for 2026 return
      { id: 'mci-fw1', name: 'Erling Haaland', position: 'FW' },
      { id: 'mci-fw2', name: 'Jeremy Doku', position: 'FW' },
      { id: 'mci-fw3', name: 'Jack Grealish', position: 'FW' },
      { id: 'mci-fw4', name: 'Savinho', position: 'FW' }
    ]
  },
  {
    id: 'man-utd',
    name: 'Manchester United',
    shortName: 'MUN',
    group: 'A',
    rating: 88, // Tier S
    players: [
      { id: 'mun-gk1', name: 'Andre Onana', position: 'GK' },
      { id: 'mun-df1', name: 'Matthijs de Ligt', position: 'DF' },
      { id: 'mun-df2', name: 'Lisandro Martinez', position: 'DF' },
      { id: 'mun-df3', name: 'Diogo Dalot', position: 'DF' },
      { id: 'mun-df4', name: 'Noussair Mazraoui', position: 'DF' },
      { id: 'mun-df5', name: 'Leny Yoro', position: 'DF' },
      { id: 'mun-mf1', name: 'Bruno Fernandes', position: 'MF' },
      { id: 'mun-mf2', name: 'Casemiro', position: 'MF' },
      { id: 'mun-mf3', name: 'Kobbie Mainoo', position: 'MF' },
      { id: 'mun-mf4', name: 'Amad Diallo', position: 'MF' }, // Updated for 2026
      { id: 'mun-mf5', name: 'Manuel Ugarte', position: 'MF' },
      { id: 'mun-fw1', name: 'Marcus Rashford', position: 'FW' },
      { id: 'mun-fw2', name: 'Rasmus Hojlund', position: 'FW' },
      { id: 'mun-fw3', name: 'Alejandro Garnacho', position: 'FW' },
      { id: 'mun-fw4', name: 'Joshua Zirkzee', position: 'FW' }
    ]
  },
  {
    id: 'aston-villa',
    name: 'Aston Villa',
    shortName: 'AVL',
    group: 'A',
    rating: 85, // Tier A
    players: [
      { id: 'avl-gk1', name: 'Emiliano Martinez', position: 'GK' },
      { id: 'avl-df1', name: 'Ezri Konsa', position: 'DF' },
      { id: 'avl-df2', name: 'Pau Torres', position: 'DF' },
      { id: 'avl-df3', name: 'Lucas Digne', position: 'DF' },
      { id: 'avl-df4', name: 'Matty Cash', position: 'DF' },
      { id: 'avl-df5', name: 'Diego Carlos', position: 'DF' },
      { id: 'avl-mf1', name: 'John McGinn', position: 'MF' },
      { id: 'avl-mf2', name: 'Youri Tielemans', position: 'MF' },
      { id: 'avl-mf3', name: 'Boubacar Kamara', position: 'MF' },
      { id: 'avl-mf4', name: 'Amadou Onana', position: 'MF' },
      { id: 'avl-mf5', name: 'Leon Bailey', position: 'MF' },
      { id: 'avl-fw1', name: 'Ollie Watkins', position: 'FW' },
      { id: 'avl-fw2', name: 'Jhon Duran', position: 'FW' },
      { id: 'avl-fw3', name: 'Morgan Rogers', position: 'FW' },
      { id: 'avl-fw4', name: 'Emiliano Buendia', position: 'FW' }
    ]
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    group: 'A',
    rating: 91, // Tier S
    players: [
      { id: 'liv-gk1', name: 'Alisson Becker', position: 'GK' },
      { id: 'liv-df1', name: 'Virgil van Dijk', position: 'DF' },
      { id: 'liv-df2', name: 'Ibrahima Konate', position: 'DF' },
      { id: 'liv-df3', name: 'Trent Alexander-Arnold', position: 'DF' },
      { id: 'liv-df4', name: 'Andy Robertson', position: 'DF' },
      { id: 'liv-df5', name: 'Joe Gomez', position: 'DF' },
      { id: 'liv-mf1', name: 'Alexis Mac Allister', position: 'MF' },
      { id: 'liv-mf2', name: 'Ryan Gravenberch', position: 'MF' },
      { id: 'liv-mf3', name: 'Dominik Szoboszlai', position: 'MF' },
      { id: 'liv-mf4', name: 'Wataru Endo', position: 'MF' },
      { id: 'liv-mf5', name: 'Federico Chiesa', position: 'MF' }, // Updated for 2026
      { id: 'liv-fw1', name: 'Mohamed Salah', position: 'FW' },
      { id: 'liv-fw2', name: 'Luis Diaz', position: 'FW' },
      { id: 'liv-fw3', name: 'Cody Gakpo', position: 'FW' },
      { id: 'liv-fw4', name: 'Darwin Nunez', position: 'FW' }
    ]
  },
  {
    id: 'bournemouth',
    name: 'Bournemouth',
    shortName: 'BOU',
    group: 'A',
    rating: 80, // Tier B
    players: [
      { id: 'bou-gk1', name: 'Kepa Arrizabalaga', position: 'GK' },
      { id: 'bou-df1', name: 'Illia Zabarnyi', position: 'DF' },
      { id: 'bou-df2', name: 'Marcos Senesi', position: 'DF' },
      { id: 'bou-df3', name: 'Milos Kerkez', position: 'DF' },
      { id: 'bou-df4', name: 'Julian Araujo', position: 'DF' },
      { id: 'bou-df5', name: 'Adam Smith', position: 'DF' },
      { id: 'bou-mf1', name: 'Lewis Cook', position: 'MF' },
      { id: 'bou-mf2', name: 'Ryan Christie', position: 'MF' },
      { id: 'bou-mf3', name: 'Marcus Tavernier', position: 'MF' },
      { id: 'bou-mf4', name: 'Alex Scott', position: 'MF' },
      { id: 'bou-mf5', name: 'Justin Kluivert', position: 'MF' },
      { id: 'bou-fw1', name: 'Antoine Semenyo', position: 'FW' },
      { id: 'bou-fw2', name: 'Evanilson', position: 'FW' },
      { id: 'bou-fw3', name: 'Luis Sinisterra', position: 'FW' },
      { id: 'bou-fw4', name: 'Enes Unal', position: 'FW' }
    ]
  },
  {
    id: 'brighton',
    name: 'Brighton',
    shortName: 'BHA',
    group: 'A',
    rating: 84, // Tier A
    players: [
      { id: 'bha-gk1', name: 'Bart Verbruggen', position: 'GK' },
      { id: 'bha-df1', name: 'Lewis Dunk', position: 'DF' },
      { id: 'bha-df2', name: 'Jan Paul van Hecke', position: 'DF' },
      { id: 'bha-df3', name: 'Joel Veltman', position: 'DF' },
      { id: 'bha-df4', name: 'Pervis Estupinian', position: 'DF' },
      { id: 'bha-df5', name: 'Tariq Lamptey', position: 'DF' },
      { id: 'bha-mf1', name: 'Carlos Baleba', position: 'MF' },
      { id: 'bha-mf2', name: 'Mats Wieffer', position: 'MF' },
      { id: 'bha-mf3', name: 'Jack Hinshelwood', position: 'MF' },
      { id: 'bha-mf4', name: 'Kaoru Mitoma', position: 'MF' },
      { id: 'bha-mf5', name: 'Solly March', position: 'MF' },
      { id: 'bha-fw1', name: 'Joao Pedro', position: 'FW' },
      { id: 'bha-fw2', name: 'Danny Welbeck', position: 'FW' },
      { id: 'bha-fw3', name: 'Yankuba Minteh', position: 'FW' },
      { id: 'bha-fw4', name: 'Evan Ferguson', position: 'FW' }
    ]
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    group: 'A',
    rating: 89, // Tier S
    players: [
      { id: 'che-gk1', name: 'Robert Sanchez', position: 'GK' },
      { id: 'che-df1', name: 'Levi Colwill', position: 'DF' },
      { id: 'che-df2', name: 'Wesley Fofana', position: 'DF' },
      { id: 'che-df3', name: 'Reece James', position: 'DF' },
      { id: 'che-df4', name: 'Marc Cucurella', position: 'DF' },
      { id: 'che-df5', name: 'Malo Gusto', position: 'DF' },
      { id: 'che-mf1', name: 'Enzo Fernandez', position: 'MF' },
      { id: 'che-mf2', name: 'Moises Caicedo', position: 'MF' },
      { id: 'che-mf3', name: 'Cole Palmer', position: 'MF' },
      { id: 'che-mf4', name: 'Christopher Nkunku', position: 'MF' },
      { id: 'che-mf5', name: 'Romeo Lavia', position: 'MF' },
      { id: 'che-fw1', name: 'Nicolas Jackson', position: 'FW' },
      { id: 'che-fw2', name: 'Noni Madueke', position: 'FW' },
      { id: 'che-fw3', name: 'Pedro Neto', position: 'FW' },
      { id: 'che-fw4', name: 'Jadon Sancho', position: 'FW' }
    ]
  },
  {
    id: 'brentford',
    name: 'Brentford',
    shortName: 'BRE',
    group: 'A',
    rating: 84, // Tier A
    players: [
      { id: 'bre-gk1', name: 'Mark Flekken', position: 'GK' },
      { id: 'bre-df1', name: 'Ethan Pinnock', position: 'DF' },
      { id: 'bre-df2', name: 'Nathan Collins', position: 'DF' },
      { id: 'bre-df3', name: 'Kristoffer Ajer', position: 'DF' },
      { id: 'bre-df4', name: 'Rico Henry', position: 'DF' },
      { id: 'bre-df5', name: 'Mads Roerslev', position: 'DF' },
      { id: 'bre-mf1', name: 'Christian Norgaard', position: 'MF' },
      { id: 'bre-mf2', name: 'Vitaly Janelt', position: 'MF' },
      { id: 'bre-mf3', name: 'Mathias Jensen', position: 'MF' },
      { id: 'bre-mf4', name: 'Mikkel Damsgaard', position: 'MF' },
      { id: 'bre-mf5', name: 'Keane Lewis-Potter', position: 'MF' },
      { id: 'bre-fw1', name: 'Bryan Mbeumo', position: 'FW' },
      { id: 'bre-fw2', name: 'Yoane Wissa', position: 'FW' },
      { id: 'bre-fw3', name: 'Igor Thiago', position: 'FW' },
      { id: 'bre-fw4', name: 'Kevin Schade', position: 'FW' }
    ]
  },
  {
    id: 'sunderland',
    name: 'Sunderland AFC',
    shortName: 'SUN',
    group: 'A',
    rating: 74, // Tier C
    players: [
      { id: 'sun-gk1', name: 'Anthony Patterson', position: 'GK' },
      { id: 'sun-df1', name: 'Luke O\'Nien', position: 'DF' },
      { id: 'sun-df2', name: 'Dan Ballard', position: 'DF' },
      { id: 'sun-df3', name: 'Trai Hume', position: 'DF' },
      { id: 'sun-df4', name: 'Dennis Cirkin', position: 'DF' },
      { id: 'sun-df5', name: 'Leo Hjelde', position: 'DF' },
      { id: 'sun-mf1', name: 'Dan Neil', position: 'MF' },
      { id: 'sun-mf2', name: 'Jobe Bellingham', position: 'MF' },
      { id: 'sun-mf3', name: 'Chris Rigg', position: 'MF' },
      { id: 'sun-mf4', name: 'Alan Browne', position: 'MF' },
      { id: 'sun-mf5', name: 'Patrick Roberts', position: 'MF' },
      { id: 'sun-fw1', name: 'Romaine Mundle', position: 'FW' },
      { id: 'sun-fw2', name: 'Wilson Isidor', position: 'FW' },
      { id: 'sun-fw3', name: 'Nazariy Rusyn', position: 'FW' },
      { id: 'sun-fw4', name: 'Eliezer Mayenda', position: 'FW' }
    ]
  },
  {
    id: 'newcastle',
    name: 'Newcastle',
    shortName: 'NEW',
    group: 'A',
    rating: 86, // Tier A
    players: [
      { id: 'new-gk1', name: 'Nick Pope', position: 'GK' },
      { id: 'new-df1', name: 'Kieran Trippier', position: 'DF' },
      { id: 'new-df2', name: 'Fabian Schaer', position: 'DF' },
      { id: 'new-df3', name: 'Sven Botman', position: 'DF' },
      { id: 'new-df4', name: 'Dan Burn', position: 'DF' },
      { id: 'new-df5', name: 'Lewis Hall', position: 'DF' },
      { id: 'new-mf1', name: 'Bruno Guimaraes', position: 'MF' },
      { id: 'new-mf2', name: 'Joelinton', position: 'MF' },
      { id: 'new-mf3', name: 'Sandro Tonali', position: 'MF' },
      { id: 'new-mf4', name: 'Sean Longstaff', position: 'MF' },
      { id: 'new-mf5', name: 'Joe Willock', position: 'MF' },
      { id: 'new-fw1', name: 'Alexander Isak', position: 'FW' },
      { id: 'new-fw2', name: 'Anthony Gordon', position: 'FW' },
      { id: 'new-fw3', name: 'Harvey Barnes', position: 'FW' },
      { id: 'new-fw4', name: 'Jacob Murphy', position: 'FW' }
    ]
  },
  {
    id: 'everton',
    name: 'Everton',
    shortName: 'EVE',
    group: 'A',
    rating: 76, // Tier C
    players: [
      { id: 'eve-gk1', name: 'Jordan Pickford', position: 'GK' },
      { id: 'eve-df1', name: 'James Tarkowski', position: 'DF' },
      { id: 'eve-df2', name: 'Jarrad Branthwaite', position: 'DF' },
      { id: 'eve-df3', name: 'Vitaliy Mykolenko', position: 'DF' },
      { id: 'eve-df4', name: 'Ashley Young', position: 'DF' },
      { id: 'eve-df5', name: 'Nathan Patterson', position: 'DF' },
      { id: 'eve-mf1', name: 'Idrissa Gueye', position: 'MF' },
      { id: 'eve-mf2', name: 'James Garner', position: 'MF' },
      { id: 'eve-mf3', name: 'Abdoulaye Doucoure', position: 'MF' },
      { id: 'eve-mf4', name: 'Orel Mangala', position: 'MF' },
      { id: 'eve-mf5', name: 'Dwight McNeil', position: 'MF' },
      { id: 'eve-fw1', name: 'Dominic Calvert-Lewin', position: 'FW' },
      { id: 'eve-fw2', name: 'Beto', position: 'FW' },
      { id: 'eve-fw3', name: 'Iliman Ndiaye', position: 'FW' },
      { id: 'eve-fw4', name: 'Jack Harrison', position: 'FW' }
    ]
  },
  {
    id: 'fulham',
    name: 'Fulham',
    shortName: 'FUL',
    group: 'A',
    rating: 81, // Tier B
    players: [
      { id: 'ful-gk1', name: 'Bernd Leno', position: 'GK' },
      { id: 'ful-df1', name: 'Joachim Andersen', position: 'DF' },
      { id: 'ful-df2', name: 'Calvin Bassey', position: 'DF' },
      { id: 'ful-df3', name: 'Kenny Tete', position: 'DF' },
      { id: 'ful-df4', name: 'Antonee Robinson', position: 'DF' },
      { id: 'ful-df5', name: 'Timothy Castagne', position: 'DF' },
      { id: 'ful-mf1', name: 'Andreas Pereira', position: 'MF' },
      { id: 'ful-mf2', name: 'Sander Berge', position: 'MF' },
      { id: 'ful-mf3', name: 'Emile Smith Rowe', position: 'MF' },
      { id: 'ful-mf4', name: 'Alex Iwobi', position: 'MF' },
      { id: 'ful-mf5', name: 'Harry Wilson', position: 'MF' },
      { id: 'ful-fw1', name: 'Rodrigo Muniz', position: 'FW' },
      { id: 'ful-fw2', name: 'Raul Jimenez', position: 'FW' },
      { id: 'ful-fw3', name: 'Adama Traore', position: 'FW' },
      { id: 'ful-fw4', name: 'Reiss Nelson', position: 'FW' }
    ]
  },
  {
    id: 'leeds',
    name: 'Leeds United',
    shortName: 'LEE',
    group: 'A',
    rating: 75, // Tier C
    players: [
      { id: 'lee-gk1', name: 'Illan Meslier', position: 'GK' },
      { id: 'lee-df1', name: 'Pascal Struijk', position: 'DF' },
      { id: 'lee-df2', name: 'Joe Rodon', position: 'DF' },
      { id: 'lee-df3', name: 'Junior Firpo', position: 'DF' },
      { id: 'lee-df4', name: 'Jayden Bogle', position: 'DF' },
      { id: 'lee-df5', name: 'Max Woeber', position: 'DF' },
      { id: 'lee-mf1', name: 'Ethan Ampadu', position: 'MF' },
      { id: 'lee-mf2', name: 'Ilia Gruev', position: 'MF' },
      { id: 'lee-mf3', name: 'Brenden Aaronson', position: 'MF' },
      { id: 'lee-mf4', name: 'Daniel James', position: 'MF' },
      { id: 'lee-mf5', name: 'Wilfried Gnonto', position: 'MF' },
      { id: 'lee-fw1', name: 'Patrick Bamford', position: 'FW' },
      { id: 'lee-fw2', name: 'Mateo Joseph', position: 'FW' },
      { id: 'lee-fw3', name: 'Joel Piroe', position: 'FW' },
      { id: 'lee-fw4', name: 'Manor Solomon', position: 'FW' }
    ]
  },
  {
    id: 'crystal-palace',
    name: 'Crystal Palace',
    shortName: 'CRY',
    group: 'A',
    rating: 82, // Tier B
    players: [
      { id: 'cry-gk1', name: 'Dean Henderson', position: 'GK' },
      { id: 'cry-df1', name: 'Marc Guehi', position: 'DF' },
      { id: 'cry-df2', name: 'Maxence Lacroix', position: 'DF' },
      { id: 'cry-df3', name: 'Daniel Munoz', position: 'DF' },
      { id: 'cry-df4', name: 'Tyrick Mitchell', position: 'DF' },
      { id: 'cry-df5', name: 'Chris Richards', position: 'DF' },
      { id: 'cry-mf1', name: 'Adam Wharton', position: 'MF' },
      { id: 'cry-mf2', name: 'Will Hughes', position: 'MF' },
      { id: 'cry-mf3', name: 'Daichi Kamada', position: 'MF' },
      { id: 'cry-mf4', name: 'Eberechi Eze', position: 'MF' },
      { id: 'cry-mf5', name: 'Jefferson Lerma', position: 'MF' },
      { id: 'cry-fw1', name: 'Jean-Philippe Mateta', position: 'FW' },
      { id: 'cry-fw2', name: 'Eddie Nketiah', position: 'FW' },
      { id: 'cry-fw3', name: 'Ismaila Sarr', position: 'FW' },
      { id: 'cry-fw4', name: 'Matheus Franca', position: 'FW' }
    ]
  },
  {
    id: 'nottingham',
    name: 'Nottingham',
    shortName: 'NFO',
    group: 'A',
    rating: 79, // Tier B
    players: [
      { id: 'nfo-gk1', name: 'Matz Sels', position: 'GK' },
      { id: 'nfo-df1', name: 'Murillo', position: 'DF' },
      { id: 'nfo-df2', name: 'Nikola Milenkovic', position: 'DF' },
      { id: 'nfo-df3', name: 'Ola Aina', position: 'DF' },
      { id: 'nfo-df4', name: 'Neco Williams', position: 'DF' },
      { id: 'nfo-df5', name: 'Alex Moreno', position: 'DF' },
      { id: 'nfo-mf1', name: 'Morgan Gibbs-White', position: 'MF' },
      { id: 'nfo-mf2', name: 'Ryan Yates', position: 'MF' },
      { id: 'nfo-mf3', name: 'Nicolas Dominguez', position: 'MF' },
      { id: 'nfo-mf4', name: 'Ibrahim Sangare', position: 'MF' },
      { id: 'nfo-mf5', name: 'Elliot Anderson', position: 'MF' },
      { id: 'nfo-fw1', name: 'Chris Wood', position: 'FW' },
      { id: 'nfo-fw2', name: 'Taiwo Awoniyi', position: 'FW' },
      { id: 'nfo-fw3', name: 'Anthony Elanga', position: 'FW' },
      { id: 'nfo-fw4', name: 'Callum Hudson-Odoi', position: 'FW' }
    ]
  },
  {
    id: 'tottenham',
    name: 'Tottenham',
    shortName: 'TOT',
    group: 'A',
    rating: 88, // Tier S
    players: [
      { id: 'tot-gk1', name: 'Guglielmo Vicario', position: 'GK' },
      { id: 'tot-df1', name: 'Cristian Romero', position: 'DF' },
      { id: 'tot-df2', name: 'Micky van de Ven', position: 'DF' },
      { id: 'tot-df3', name: 'Pedro Porro', position: 'DF' },
      { id: 'tot-df4', name: 'Destiny Udogie', position: 'DF' },
      { id: 'tot-df5', name: 'Radu Dragusin', position: 'DF' },
      { id: 'tot-mf1', name: 'James Maddison', position: 'MF' },
      { id: 'tot-mf2', name: 'Yves Bissouma', position: 'MF' },
      { id: 'tot-mf3', name: 'Rodrigo Bentancur', position: 'MF' },
      { id: 'tot-mf4', name: 'Dejan Kulusevski', position: 'MF' },
      { id: 'tot-mf5', name: 'Pape Matar Sarr', position: 'MF' },
      { id: 'tot-fw1', name: 'Son Heung-min', position: 'FW' },
      { id: 'tot-fw2', name: 'Dominic Solanke', position: 'FW' },
      { id: 'tot-fw3', name: 'Richarlison', position: 'FW' },
      { id: 'tot-fw4', name: 'Brennan Johnson', position: 'FW' }
    ]
  },
  {
    id: 'west-ham',
    name: 'West Ham',
    shortName: 'WHU',
    group: 'A',
    rating: 82, // Tier B
    players: [
      { id: 'whu-gk1', name: 'Alphonse Areola', position: 'GK' },
      { id: 'whu-df1', name: 'Max Kilman', position: 'DF' },
      { id: 'whu-df2', name: 'Jean-Clair Todibo', position: 'DF' },
      { id: 'whu-df3', name: 'Emerson Palmieri', position: 'DF' },
      { id: 'whu-df4', name: 'Aaron Wan-Bissaka', position: 'DF' },
      { id: 'whu-df5', name: 'Konstantinos Mavropanos', position: 'DF' },
      { id: 'whu-mf1', name: 'Tomas Soucek', position: 'MF' },
      { id: 'whu-mf2', name: 'Edson Alvarez', position: 'MF' },
      { id: 'whu-mf3', name: 'Lucas Paqueta', position: 'MF' },
      { id: 'whu-mf4', name: 'Guido Rodriguez', position: 'MF' },
      { id: 'whu-mf5', name: 'Carlos Soler', position: 'MF' },
      { id: 'whu-fw1', name: 'Jarrod Bowen', position: 'FW' },
      { id: 'whu-fw2', name: 'Mohammed Kudus', position: 'FW' },
      { id: 'whu-fw3', name: 'Michail Antonio', position: 'FW' },
      { id: 'whu-fw4', name: 'Niclas Fuellkrug', position: 'FW' }
    ]
  },
  {
    id: 'burnley',
    name: 'Burnley',
    shortName: 'BUR',
    group: 'A',
    rating: 74, // Tier C
    players: [
      { id: 'bur-gk1', name: 'James Trafford', position: 'GK' },
      { id: 'bur-df1', name: 'Maxime Esteve', position: 'DF' },
      { id: 'bur-df2', name: 'Jordan Beyer', position: 'DF' },
      { id: 'bur-df3', name: 'Connor Roberts', position: 'DF' },
      { id: 'bur-df4', name: 'Vitinho', position: 'DF' },
      { id: 'bur-df5', name: 'Hannes Delcroix', position: 'DF' },
      { id: 'bur-mf1', name: 'Josh Brownhill', position: 'MF' },
      { id: 'bur-mf2', name: 'Josh Cullen', position: 'MF' },
      { id: 'bur-mf3', name: 'Han-Noah Massengo', position: 'MF' },
      { id: 'bur-mf4', name: 'Mike Tresor', position: 'MF' },
      { id: 'bur-mf5', name: 'Luca Koleosho', position: 'MF' },
      { id: 'bur-fw1', name: 'Lyle Foster', position: 'FW' },
      { id: 'bur-fw2', name: 'Jay Rodriguez', position: 'FW' },
      { id: 'bur-fw3', name: 'Zian Flemming', position: 'FW' },
      { id: 'bur-fw4', name: 'Jaidon Anthony', position: 'FW' }
    ]
  },
  {
    id: 'wolves',
    name: 'Wolverhampton',
    shortName: 'WOL',
    group: 'A',
    rating: 76, // Tier C
    players: [
      { id: 'wol-gk1', name: 'Jose Sa', position: 'GK' },
      { id: 'wol-df1', name: 'Craig Dawson', position: 'DF' },
      { id: 'wol-df2', name: 'Santiago Bueno', position: 'DF' },
      { id: 'wol-df3', name: 'Toti Gomes', position: 'DF' },
      { id: 'wol-df4', name: 'Rayan Ait-Nouri', position: 'DF' },
      { id: 'wol-df5', name: 'Nelson Semedo', position: 'DF' },
      { id: 'wol-mf1', name: 'Mario Lemina', position: 'MF' },
      { id: 'wol-mf2', name: 'Joao Gomes', position: 'MF' },
      { id: 'wol-mf3', name: 'Tommy Doyle', position: 'MF' },
      { id: 'wol-mf4', name: 'Jean-Ricner Bellegarde', position: 'MF' },
      { id: 'wol-mf5', name: 'Rodrigo Gomes', position: 'MF' },
      { id: 'wol-fw1', name: 'Matheus Cunha', position: 'FW' },
      { id: 'wol-fw2', name: 'Hwang Hee-chan', position: 'FW' },
      { id: 'wol-fw3', name: 'Jorgen Strand Larsen', position: 'FW' },
      { id: 'wol-fw4', name: 'Goncalo Guedes', position: 'FW' }
    ]
  }
];

export const EPL_TEAMS_BY_ID: Record<string, Team> = EPL_TEAMS.reduce(
  (acc, team) => {
    acc[team.id] = team;
    return acc;
  },
  {} as Record<string, Team>
);

// Map team ID to the imported static logo path
export const EPL_LOGO_MAP: Record<string, string> = {
  arsenal: arsenalLogo,
  'aston-villa': astonVillaLogo,
  bournemouth: bournemouthLogo,
  brentford: brentfordLogo,
  brighton: brightonLogo,
  burnley: burnleyLogo,
  chelsea: chelseaLogo,
  'crystal-palace': crystalPalaceLogo,
  everton: evertonLogo,
  fulham: fulhamLogo,
  leeds: leedsLogo,
  liverpool: liverpoolLogo,
  'man-city': manCityLogo,
  'man-utd': manUtdLogo,
  newcastle: newcastleLogo,
  nottingham: nottinghamLogo,
  sunderland: sunderlandLogo,
  tottenham: tottenhamLogo,
  'west-ham': westHamLogo,
  wolves: wolvesLogo
};

// Map team ID to Tier Level for Simulator logic (S=3, A=2, B=1, C=0)
export const EPL_TIER_MAP: Record<string, number> = {
  arsenal: 3,
  'man-city': 3,
  liverpool: 3,
  chelsea: 3,
  'man-utd': 3,
  tottenham: 3,
  newcastle: 2,
  'aston-villa': 2,
  brighton: 2,
  brentford: 2,
  'west-ham': 1,
  'crystal-palace': 1,
  fulham: 1,
  bournemouth: 1,
  nottingham: 1,
  everton: 0,
  wolves: 0,
  leeds: 0,
  sunderland: 0,
  burnley: 0
};
