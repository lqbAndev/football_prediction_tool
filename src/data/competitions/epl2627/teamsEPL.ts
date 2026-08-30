import type { Team } from '../../../types/tournament';

import arsenalLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/arsenal.football-logos.cc.png';
import astonVillaLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/aston-villa.football-logos.cc.png';
import bournemouthLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/bournemouth.football-logos.cc.png';
import brentfordLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/brentford.football-logos.cc.png';
import brightonLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/brighton.football-logos.cc.png';
import chelseaLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/chelsea.football-logos.cc.png';
import coventryLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/coventry-city.football-logos.cc.png';
import crystalPalaceLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/crystal-palace.football-logos.cc.png';
import evertonLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/everton.football-logos.cc.png';
import fulhamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/fulham.football-logos.cc.png';
import hullCityLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/hull-city.football-logos.cc.png';
import ipswichLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/ipswich.football-logos.cc.png';
import leedsLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/leeds-united.football-logos.cc.png';
import liverpoolLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/liverpool.football-logos.cc.png';
import manCityLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/manchester-city.football-logos.cc.png';
import manUtdLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/manchester-united.football-logos.cc.png';
import newcastleLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/newcastle.football-logos.cc.png';
import nottinghamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/nottingham-forest.football-logos.cc.png';
import sunderlandLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/sunderland.football-logos.cc.png';
import tottenhamLogo from '../../../img/LEAGUE COMPETITION/EPL/Club/tottenham.football-logos.cc.png';

export const EPL_TEAMS: Team[] = [
  {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    group: 'A',
    rating: 92,
    players: [
      { id: 'ars-gk1', name: 'David Raya', position: 'GK' },
      { id: 'ars-gk2', name: 'Kepa Arrizabalaga', position: 'GK' },
      { id: 'ars-gk3', name: 'Illan Meslier', position: 'GK' },
      { id: 'ars-df1', name: 'William Saliba', position: 'DF' },
      { id: 'ars-df2', name: 'Ben White', position: 'DF' },
      { id: 'ars-df3', name: 'Gabriel Magalhaes', position: 'DF' },
      { id: 'ars-df4', name: 'Jurrien Timber', position: 'DF' },
      { id: 'ars-df5', name: 'Riccardo Calafiori', position: 'DF' },
      { id: 'ars-df6', name: 'Cristhian Mosquera', position: 'DF' },
      { id: 'ars-df7', name: 'Piero Hincapie', position: 'DF' },
      { id: 'ars-mf1', name: 'Martin Odegaard', position: 'MF' },
      { id: 'ars-mf2', name: 'Declan Rice', position: 'MF' },
      { id: 'ars-mf3', name: 'Mikel Merino', position: 'MF' },
      { id: 'ars-mf4', name: 'Eberechi Eze', position: 'MF' },
      { id: 'ars-mf5', name: 'Martin Zubimendi', position: 'MF' },
      { id: 'ars-mf6', name: 'Bruno Guimaraes', position: 'MF' },
      { id: 'ars-fw1', name: 'Bukayo Saka', position: 'FW' },
      { id: 'ars-fw2', name: 'Gabriel Martinelli', position: 'FW' },
      { id: 'ars-fw3', name: 'Viktor Gyokeres', position: 'FW' },
      { id: 'ars-fw4', name: 'Kai Havertz', position: 'FW' },
      { id: 'ars-fw5', name: 'Noni Madueke', position: 'FW' }
    ]
  },
  {
    id: 'man-city',
    name: 'Manchester City',
    shortName: 'MCI',
    group: 'A',
    rating: 90,
    players: [
      { id: 'mci-gk1', name: 'Gianluigi Donnarumma', position: 'GK' },
      { id: 'mci-gk2', name: 'Geronimo Rulli', position: 'GK' },
      { id: 'mci-df1', name: 'Ruben Dias', position: 'DF' },
      { id: 'mci-df2', name: 'Josko Gvardiol', position: 'DF' },
      { id: 'mci-df3', name: 'Marc Guehi', position: 'DF' },
      { id: 'mci-df4', name: 'Rico Lewis', position: 'DF' },
      { id: 'mci-df5', name: 'Rayan Ait-Nouri', position: 'DF' },
      { id: 'mci-mf1', name: 'Phil Foden', position: 'MF' },
      { id: 'mci-mf2', name: 'Mateo Kovacic', position: 'MF' },
      { id: 'mci-mf3', name: 'Matheus Nunes', position: 'MF' },
      { id: 'mci-mf4', name: 'Claudio Echeverri', position: 'MF' },
      { id: 'mci-mf5', name: 'Rayan Cherki', position: 'MF' },
      { id: 'mci-fw1', name: 'Erling Haaland', position: 'FW' },
      { id: 'mci-fw2', name: 'Nico O\'Reilly', position: 'FW' },
      { id: 'mci-fw3', name: 'Jeremy Doku', position: 'FW' },
      { id: 'mci-fw4', name: 'Savinho', position: 'FW' },
      { id: 'mci-fw5', name: 'Antoine Semenyo', position: 'FW' },
      { id: 'mci-fw6', name: 'Omar Marmoush', position: 'FW' }
    ]
  },
  {
    id: 'man-utd',
    name: 'Manchester United',
    shortName: 'MUN',
    group: 'A',
    rating: 88,
    players: [
      { id: 'mun-gk1', name: 'Senne Lammens', position: 'GK' },
      { id: 'mun-gk2', name: 'Karl Darlow', position: 'GK' },
      { id: 'mun-df1', name: 'Diogo Dalot', position: 'DF' },
      { id: 'mun-df2', name: 'Noussair Mazraoui', position: 'DF' },
      { id: 'mun-df3', name: 'Matthijs de Ligt', position: 'DF' },
      { id: 'mun-df4', name: 'Lisandro Martinez', position: 'DF' },
      { id: 'mun-df5', name: 'Leny Yoro', position: 'DF' },
      { id: 'mun-df6', name: 'Luke Shaw', position: 'DF' },
      { id: 'mun-df7', name: 'Harry Maguire', position: 'DF' },
      { id: 'mun-mf1', name: 'Bruno Fernandes', position: 'MF' },
      { id: 'mun-mf2', name: 'Mason Mount', position: 'MF' },
      { id: 'mun-mf3', name: 'Manuel Ugarte', position: 'MF' },
      { id: 'mun-mf4', name: 'Kobbie Mainoo', position: 'MF' },
      { id: 'mun-mf5', name: 'Youri Tielemans', position: 'MF' },
      { id: 'mun-fw1', name: 'Marcus Rashford', position: 'FW' },
      { id: 'mun-fw2', name: 'Joshua Zirkzee', position: 'FW' },
      { id: 'mun-fw3', name: 'Amad Diallo', position: 'FW' },
      { id: 'mun-fw4', name: 'Bryan Mbeumo', position: 'FW' },
      { id: 'mun-fw5', name: 'Matheus Cunha', position: 'FW' },
      { id: 'mun-fw6', name: 'Benjamin Sesko', position: 'FW' }
    ]
  },
  {
    id: 'aston-villa',
    name: 'Aston Villa',
    shortName: 'AVL',
    group: 'A',
    rating: 85,
    players: [
      { id: 'avl-gk1', name: 'Emiliano Martinez', position: 'GK' },
      { id: 'avl-gk2', name: 'Zion Suzuki', position: 'GK' },
      { id: 'avl-df1', name: 'Matty Cash', position: 'DF' },
      { id: 'avl-df2', name: 'Pau Torres', position: 'DF' },
      { id: 'avl-df3', name: 'Tyrone Mings', position: 'DF' },
      { id: 'avl-df4', name: 'Victor Lindelof', position: 'DF' },
      { id: 'avl-df5', name: 'Ian Maatsen', position: 'DF' },
      { id: 'avl-df6', name: 'Matteo Ruggeri', position: 'DF' },
      { id: 'avl-mf1', name: 'John McGinn', position: 'MF' },
      { id: 'avl-mf2', name: 'Boubacar Kamara', position: 'MF' },
      { id: 'avl-mf3', name: 'Amadou Onana', position: 'MF' },
      { id: 'avl-mf4', name: 'Ross Barkley', position: 'MF' },
      { id: 'avl-mf5', name: 'Emiliano Buendia', position: 'MF' },
      { id: 'avl-mf6', name: 'Leon Bailey', position: 'MF' },
      { id: 'avl-fw1', name: 'Ollie Watkins', position: 'FW' },
      { id: 'avl-fw2', name: 'Alejandro Garnacho', position: 'FW' },
      { id: 'avl-fw3', name: 'Tammy Abraham', position: 'FW' }
    ]
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    group: 'A',
    rating: 84,
    players: [
      { id: 'liv-gk1', name: 'Giorgi Mamardashvili', position: 'GK' },
      { id: 'liv-gk2', name: 'Freddie Woodman', position: 'GK' },
      { id: 'liv-df1', name: 'Virgil van Dijk', position: 'DF' },
      { id: 'liv-df2', name: 'Joe Gomez', position: 'DF' },
      { id: 'liv-df3', name: 'Conor Bradley', position: 'DF' },
      { id: 'liv-df4', name: 'Ronald Araujo', position: 'DF' },
      { id: 'liv-df5', name: 'Milos Kerkez', position: 'DF' },
      { id: 'liv-mf1', name: 'Alexis Mac Allister', position: 'MF' },
      { id: 'liv-mf2', name: 'Dominik Szoboszlai', position: 'MF' },
      { id: 'liv-mf3', name: 'Ryan Gravenberch', position: 'MF' },
      { id: 'liv-mf4', name: 'Florian Wirtz', position: 'MF' },
      { id: 'liv-fw1', name: 'Cody Gakpo', position: 'FW' },
      { id: 'liv-fw2', name: 'Bradley Barcola', position: 'FW' },
      { id: 'liv-fw3', name: 'Alexander Isak', position: 'FW' },
      { id: 'liv-fw4', name: 'Victor Munoz', position: 'FW' }
    ]
  },
  {
    id: 'bournemouth',
    name: 'Bournemouth',
    shortName: 'BOU',
    group: 'A',
    rating: 81,
    players: [
      { id: 'bou-gk1', name: 'Djordje Petrovic', position: 'GK' },
      { id: 'bou-gk2', name: 'Fraser Forster', position: 'GK' },
      { id: 'bou-df1', name: 'Julian Araujo', position: 'DF' },
      { id: 'bou-df2', name: 'Adrien Truffert', position: 'DF' },
      { id: 'bou-df3', name: 'Antonio Silva', position: 'DF' },
      { id: 'bou-df4', name: 'James Hill', position: 'DF' },
      { id: 'bou-df5', name: 'Adam Smith', position: 'DF' },
      { id: 'bou-df6', name: 'Julio Soler', position: 'DF' },
      { id: 'bou-mf1', name: 'Lewis Cook', position: 'MF' },
      { id: 'bou-mf2', name: 'Alex Scott', position: 'MF' },
      { id: 'bou-mf3', name: 'Tyler Adams', position: 'MF' },
      { id: 'bou-mf4', name: 'Ryan Christie', position: 'MF' },
      { id: 'bou-mf5', name: 'Marcus Tavernier', position: 'MF' },
      { id: 'bou-fw1', name: 'Evanilson', position: 'FW' },
      { id: 'bou-fw2', name: 'Justin Kluivert', position: 'FW' },
      { id: 'bou-fw3', name: 'Amine Adli', position: 'FW' },
      { id: 'bou-fw4', name: 'Junior Kroupi', position: 'FW' },
      { id: 'bou-fw5', name: 'Alvaro Rodriguez', position: 'FW' }
    ]
  },
  {
    id: 'sunderland',
    name: 'Sunderland',
    shortName: 'SUN',
    group: 'A',
    rating: 79,
    players: [
      { id: 'sun-gk1', name: 'Anthony Patterson', position: 'GK' },
      { id: 'sun-gk2', name: 'Robin Roefs', position: 'GK' },
      { id: 'sun-df1', name: 'Daniel Ballard', position: 'DF' },
      { id: 'sun-df2', name: 'Luke O\'Nien', position: 'DF' },
      { id: 'sun-df3', name: 'Thomas Meunier', position: 'DF' },
      { id: 'sun-df4', name: 'Reinildo Mandava', position: 'DF' },
      { id: 'sun-df5', name: 'Nordi Mukiele', position: 'DF' },
      { id: 'sun-df6', name: 'Omar Alderete', position: 'DF' },
      { id: 'sun-mf1', name: 'Granit Xhaka', position: 'MF' },
      { id: 'sun-mf2', name: 'Enzo Le Fee', position: 'MF' },
      { id: 'sun-mf3', name: 'Habib Diarra', position: 'MF' },
      { id: 'sun-mf4', name: 'Noah Sadiki', position: 'MF' },
      { id: 'sun-mf5', name: 'Chris Rigg', position: 'MF' },
      { id: 'sun-fw1', name: 'Brian Brobbey', position: 'FW' },
      { id: 'sun-fw2', name: 'Wilson Isidor', position: 'FW' },
      { id: 'sun-fw3', name: 'Eliezer Mayenda', position: 'FW' },
      { id: 'sun-fw4', name: 'Simon Adingra', position: 'FW' }
    ]
  },
  {
    id: 'brighton',
    name: 'Brighton',
    shortName: 'BHA',
    group: 'A',
    rating: 80,
    players: [
      { id: 'bha-gk1', name: 'Bart Verbruggen', position: 'GK' },
      { id: 'bha-gk2', name: 'Jason Steele', position: 'GK' },
      { id: 'bha-df1', name: 'Lewis Dunk', position: 'DF' },
      { id: 'bha-df2', name: 'Igor Julio', position: 'DF' },
      { id: 'bha-df3', name: 'Pascal Struijk', position: 'DF' },
      { id: 'bha-df4', name: 'Ferdi Kadioglu', position: 'DF' },
      { id: 'bha-df5', name: 'Olivier Boscagli', position: 'DF' },
      { id: 'bha-df6', name: 'Eiran Cashin', position: 'DF' },
      { id: 'bha-mf1', name: 'Carlos Baleba', position: 'MF' },
      { id: 'bha-mf2', name: 'Jack Hinshelwood', position: 'MF' },
      { id: 'bha-mf3', name: 'Mats Wieffer', position: 'MF' },
      { id: 'bha-mf4', name: 'Matt O\'Riley', position: 'MF' },
      { id: 'bha-mf5', name: 'Pascal Gross', position: 'MF' },
      { id: 'bha-fw1', name: 'Kaoru Mitoma', position: 'FW' },
      { id: 'bha-fw2', name: 'Georginio Rutter', position: 'FW' },
      { id: 'bha-fw3', name: 'Evan Ferguson', position: 'FW' },
      { id: 'bha-fw4', name: 'Yankuba Minteh', position: 'FW' }
    ]
  },
  {
    id: 'brentford',
    name: 'Brentford',
    shortName: 'BRE',
    group: 'A',
    rating: 79,
    players: [
      { id: 'bre-gk1', name: 'Caoimhin Kelleher', position: 'GK' },
      { id: 'bre-gk2', name: 'Hakon Valdimarsson', position: 'GK' },
      { id: 'bre-df1', name: 'Aaron Hickey', position: 'DF' },
      { id: 'bre-df2', name: 'Rico Henry', position: 'DF' },
      { id: 'bre-df3', name: 'Ethan Pinnock', position: 'DF' },
      { id: 'bre-df4', name: 'Nathan Collins', position: 'DF' },
      { id: 'bre-df5', name: 'Sepp van den Berg', position: 'DF' },
      { id: 'bre-df6', name: 'Kristoffer Ajer', position: 'DF' },
      { id: 'bre-mf1', name: 'Mathias Jensen', position: 'MF' },
      { id: 'bre-mf2', name: 'Vitaly Janelt', position: 'MF' },
      { id: 'bre-mf3', name: 'Josh Dasilva', position: 'MF' },
      { id: 'bre-mf4', name: 'Fabio Carvalho', position: 'MF' },
      { id: 'bre-mf5', name: 'Yehor Yarmoliuk', position: 'MF' },
      { id: 'bre-fw1', name: 'Igor Thiago', position: 'FW' },
      { id: 'bre-fw2', name: 'Kevin Schade', position: 'FW' },
      { id: 'bre-fw3', name: 'Dango Ouattara', position: 'FW' },
      { id: 'bre-fw4', name: 'Callum Wilson', position: 'FW' },
      { id: 'bre-fw5', name: 'Keane Lewis-Potter', position: 'FW' }
    ]
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    group: 'A',
    rating: 82,
    players: [
      { id: 'che-gk1', name: 'Robert Sanchez', position: 'GK' },
      { id: 'che-gk2', name: 'Gaga Slonina', position: 'GK' },
      { id: 'che-df1', name: 'Levi Colwill', position: 'DF' },
      { id: 'che-df2', name: 'Wesley Fofana', position: 'DF' },
      { id: 'che-df3', name: 'Maxence Lacroix', position: 'DF' },
      { id: 'che-df4', name: 'Reece James', position: 'DF' },
      { id: 'che-df5', name: 'Malo Gusto', position: 'DF' },
      { id: 'che-df6', name: 'Tosin Adarabioyo', position: 'DF' },
      { id: 'che-mf1', name: 'Enzo Fernandez', position: 'MF' },
      { id: 'che-mf2', name: 'Cole Palmer', position: 'MF' },
      { id: 'che-mf3', name: 'Moises Caicedo', position: 'MF' },
      { id: 'che-mf4', name: 'Romeo Lavia', position: 'MF' },
      { id: 'che-fw1', name: 'Pedro Neto', position: 'FW' },
      { id: 'che-fw2', name: 'Joao Pedro', position: 'FW' },
      { id: 'che-fw3', name: 'Nicolas Jackson', position: 'FW' },
      { id: 'che-fw4', name: 'Mykhailo Mudryk', position: 'FW' },
      { id: 'che-fw5', name: 'Morgan Rogers', position: 'FW' },
      { id: 'che-fw6', name: 'Danny Welbeck', position: 'FW' }
    ]
  },
  {
    id: 'fulham',
    name: 'Fulham',
    shortName: 'FUL',
    group: 'A',
    rating: 78,
    players: [
      { id: 'ful-gk1', name: 'Bernd Leno', position: 'GK' },
      { id: 'ful-gk2', name: 'Benjamin Lecomte', position: 'GK' },
      { id: 'ful-df1', name: 'Joachim Andersen', position: 'DF' },
      { id: 'ful-df2', name: 'Calvin Bassey', position: 'DF' },
      { id: 'ful-df3', name: 'Kenny Tete', position: 'DF' },
      { id: 'ful-df4', name: 'Antonee Robinson', position: 'DF' },
      { id: 'ful-df5', name: 'Jorge Cuenca', position: 'DF' },
      { id: 'ful-df6', name: 'Timothy Castagne', position: 'DF' },
      { id: 'ful-mf1', name: 'Emile Smith Rowe', position: 'MF' },
      { id: 'ful-mf2', name: 'Alex Iwobi', position: 'MF' },
      { id: 'ful-mf3', name: 'Sander Berge', position: 'MF' },
      { id: 'ful-mf4', name: 'Harrison Reed', position: 'MF' },
      { id: 'ful-mf5', name: 'Tom Cairney', position: 'MF' },
      { id: 'ful-mf6', name: 'Cesar Palacios', position: 'MF' },
      { id: 'ful-fw1', name: 'Rodrigo Muniz', position: 'FW' },
      { id: 'ful-fw2', name: 'Oscar Bobb', position: 'FW' },
      { id: 'ful-fw3', name: 'Gonzalo Garcia', position: 'FW' },
      { id: 'ful-fw4', name: 'Josh King', position: 'FW' }
    ]
  },
  {
    id: 'newcastle',
    name: 'Newcastle',
    shortName: 'NEW',
    group: 'A',
    rating: 80,
    players: [
      { id: 'new-gk1', name: 'Nick Pope', position: 'GK' },
      { id: 'new-gk2', name: 'Mark Gillespie', position: 'GK' },
      { id: 'new-df1', name: 'Sven Botman', position: 'DF' },
      { id: 'new-df2', name: 'Fabian Schaer', position: 'DF' },
      { id: 'new-df3', name: 'Tino Livramento', position: 'DF' },
      { id: 'new-df4', name: 'Lewis Hall', position: 'DF' },
      { id: 'new-df5', name: 'Dan Burn', position: 'DF' },
      { id: 'new-df6', name: 'Malick Thiaw', position: 'DF' },
      { id: 'new-mf1', name: 'Bruno Guimaraes', position: 'MF' },
      { id: 'new-mf2', name: 'Joelinton', position: 'MF' },
      { id: 'new-mf3', name: 'Joe Willock', position: 'MF' },
      { id: 'new-mf4', name: 'Jacob Ramsey', position: 'MF' },
      { id: 'new-mf5', name: 'Lewis Miley', position: 'MF' },
      { id: 'new-fw1', name: 'Yoane Wissa', position: 'FW' },
      { id: 'new-fw2', name: 'Harvey Barnes', position: 'FW' },
      { id: 'new-fw3', name: 'Anthony Elanga', position: 'FW' },
      { id: 'new-fw4', name: 'Jacob Murphy', position: 'FW' }
    ]
  },
  {
    id: 'everton',
    name: 'Everton',
    shortName: 'EVE',
    group: 'A',
    rating: 77,
    players: [
      { id: 'eve-gk1', name: 'Jordan Pickford', position: 'GK' },
      { id: 'eve-gk2', name: 'Mark Travers', position: 'GK' },
      { id: 'eve-df1', name: 'Jarrad Branthwaite', position: 'DF' },
      { id: 'eve-df2', name: 'James Tarkowski', position: 'DF' },
      { id: 'eve-df3', name: 'Vitaliy Mykolenko', position: 'DF' },
      { id: 'eve-df4', name: 'Nathan Patterson', position: 'DF' },
      { id: 'eve-df5', name: 'Michael Keane', position: 'DF' },
      { id: 'eve-df6', name: 'Jake O\'Brien', position: 'DF' },
      { id: 'eve-mf1', name: 'Kiernan Dewsbury-Hall', position: 'MF' },
      { id: 'eve-mf2', name: 'Christian Norgaard', position: 'MF' },
      { id: 'eve-mf3', name: 'James Garner', position: 'MF' },
      { id: 'eve-mf4', name: 'Tim Iroegbunam', position: 'MF' },
      { id: 'eve-mf5', name: 'Charly Alcaraz', position: 'MF' },
      { id: 'eve-mf6', name: 'Hayden Hackney', position: 'MF' },
      { id: 'eve-fw1', name: 'Beto', position: 'FW' },
      { id: 'eve-fw2', name: 'Iliman Ndiaye', position: 'FW' },
      { id: 'eve-fw3', name: 'Brennan Johnson', position: 'FW' },
      { id: 'eve-fw4', name: 'Thierno Barry', position: 'FW' }
    ]
  },
  {
    id: 'leeds',
    name: 'Leeds United',
    shortName: 'LEE',
    group: 'A',
    rating: 76,
    players: [
      { id: 'lee-gk1', name: 'James Trafford', position: 'GK' },
      { id: 'lee-gk2', name: 'Lucas Perri', position: 'GK' },
      { id: 'lee-df1', name: 'Joe Rodon', position: 'DF' },
      { id: 'lee-df2', name: 'Ethan Ampadu', position: 'DF' },
      { id: 'lee-df3', name: 'Tarik Muharemovic', position: 'DF' },
      { id: 'lee-df4', name: 'Nico Elvedi', position: 'DF' },
      { id: 'lee-df5', name: 'Jayden Bogle', position: 'DF' },
      { id: 'lee-df6', name: 'Gabriel Gudmundsson', position: 'DF' },
      { id: 'lee-mf1', name: 'Harry Wilson', position: 'MF' },
      { id: 'lee-mf2', name: 'Ilia Gruev', position: 'MF' },
      { id: 'lee-mf3', name: 'Brenden Aaronson', position: 'MF' },
      { id: 'lee-mf4', name: 'Ao Tanaka', position: 'MF' },
      { id: 'lee-mf5', name: 'Anton Stach', position: 'MF' },
      { id: 'lee-mf6', name: 'Sean Longstaff', position: 'MF' },
      { id: 'lee-fw1', name: 'Dominic Calvert-Lewin', position: 'FW' },
      { id: 'lee-fw2', name: 'Lukas Nmecha', position: 'FW' },
      { id: 'lee-fw3', name: 'Wilfried Gnonto', position: 'FW' },
      { id: 'lee-fw4', name: 'Noah Okafor', position: 'FW' },
      { id: 'lee-fw5', name: 'Daniel James', position: 'FW' }
    ]
  },
  {
    id: 'crystal-palace',
    name: 'Crystal Palace',
    shortName: 'CRY',
    group: 'A',
    rating: 77,
    players: [
      { id: 'cry-gk1', name: 'Dean Henderson', position: 'GK' },
      { id: 'cry-gk2', name: 'Walter Benitez', position: 'GK' },
      { id: 'cry-df1', name: 'Chris Richards', position: 'DF' },
      { id: 'cry-df2', name: 'Daniel Munoz', position: 'DF' },
      { id: 'cry-df3', name: 'Tyrick Mitchell', position: 'DF' },
      { id: 'cry-df4', name: 'Chadi Riad', position: 'DF' },
      { id: 'cry-df5', name: 'Takehiro Tomiyasu', position: 'DF' },
      { id: 'cry-df6', name: 'Oscar Mingueza', position: 'DF' },
      { id: 'cry-mf1', name: 'Adam Wharton', position: 'MF' },
      { id: 'cry-mf2', name: 'Cheick Doucoure', position: 'MF' },
      { id: 'cry-mf3', name: 'Daichi Kamada', position: 'MF' },
      { id: 'cry-mf4', name: 'Jefferson Lerma', position: 'MF' },
      { id: 'cry-mf5', name: 'Will Hughes', position: 'MF' },
      { id: 'cry-fw1', name: 'Jean-Philippe Mateta', position: 'FW' },
      { id: 'cry-fw2', name: 'Eddie Nketiah', position: 'FW' },
      { id: 'cry-fw3', name: 'Ismaila Sarr', position: 'FW' },
      { id: 'cry-fw4', name: 'Yeremy Pino', position: 'FW' },
      { id: 'cry-fw5', name: 'Dwight McNeil', position: 'FW' },
      { id: 'cry-fw6', name: 'Jorgen Strand Larsen', position: 'FW' }
    ]
  },
  {
    id: 'nottingham',
    name: 'Nottingham',
    shortName: 'NFO',
    group: 'A',
    rating: 76,
    players: [
      { id: 'nfo-gk1', name: 'Matz Sels', position: 'GK' },
      { id: 'nfo-gk2', name: 'Steven-Andreas Benda', position: 'GK' },
      { id: 'nfo-df1', name: 'Murillo', position: 'DF' },
      { id: 'nfo-df2', name: 'Nikola Milenkovic', position: 'DF' },
      { id: 'nfo-df3', name: 'Ola Aina', position: 'DF' },
      { id: 'nfo-df4', name: 'Willy Boly', position: 'DF' },
      { id: 'nfo-df5', name: 'Neco Williams', position: 'DF' },
      { id: 'nfo-df6', name: 'Felipe Morato', position: 'DF' },
      { id: 'nfo-mf1', name: 'Morgan Gibbs-White', position: 'MF' },
      { id: 'nfo-mf2', name: 'Nicolas Dominguez', position: 'MF' },
      { id: 'nfo-mf3', name: 'Ryan Yates', position: 'MF' },
      { id: 'nfo-mf4', name: 'Ibrahim Sangare', position: 'MF' },
      { id: 'nfo-mf5', name: 'Elliot Anderson', position: 'MF' },
      { id: 'nfo-mf6', name: 'Douglas Luiz', position: 'MF' },
      { id: 'nfo-fw1', name: 'Chris Wood', position: 'FW' },
      { id: 'nfo-fw2', name: 'Callum Hudson-Odoi', position: 'FW' },
      { id: 'nfo-fw3', name: 'Igor Jesus', position: 'FW' },
      { id: 'nfo-fw4', name: 'Arnaud Kalimuendo', position: 'FW' }
    ]
  },
  {
    id: 'tottenham',
    name: 'Tottenham',
    shortName: 'TOT',
    group: 'A',
    rating: 78,
    players: [
      { id: 'tot-gk1', name: 'Guglielmo Vicario', position: 'GK' },
      { id: 'tot-gk2', name: 'Martin Dubravka', position: 'GK' },
      { id: 'tot-df1', name: 'Cristian Romero', position: 'DF' },
      { id: 'tot-df2', name: 'Micky van de Ven', position: 'DF' },
      { id: 'tot-df3', name: 'Destiny Udogie', position: 'DF' },
      { id: 'tot-df4', name: 'Pedro Porro', position: 'DF' },
      { id: 'tot-df5', name: 'Andy Robertson', position: 'DF' },
      { id: 'tot-df6', name: 'Kevin Danso', position: 'DF' },
      { id: 'tot-df7', name: 'Marcos Senesi', position: 'DF' },
      { id: 'tot-mf1', name: 'James Maddison', position: 'MF' },
      { id: 'tot-mf2', name: 'Sandro Tonali', position: 'MF' },
      { id: 'tot-mf3', name: 'Conor Gallagher', position: 'MF' },
      { id: 'tot-mf4', name: 'Rodrigo Bentancur', position: 'MF' },
      { id: 'tot-mf5', name: 'Pape Matar Sarr', position: 'MF' },
      { id: 'tot-mf6', name: 'Dejan Kulusevski', position: 'MF' },
      { id: 'tot-fw1', name: 'Dominic Solanke', position: 'FW' },
      { id: 'tot-fw2', name: 'Richarlison', position: 'FW' },
      { id: 'tot-fw3', name: 'Omar Marmoush', position: 'FW' },
      { id: 'tot-fw4', name: 'Mohammed Kudus', position: 'FW' },
      { id: 'tot-fw5', name: 'Xavi Simons', position: 'FW' }
    ]
  },
  {
    id: 'coventry',
    name: 'Coventry City',
    shortName: 'COV',
    group: 'A',
    rating: 72,
    players: [
      { id: 'cov-gk1', name: 'Carl Rushworth', position: 'GK' },
      { id: 'cov-gk2', name: 'Oliver Dovin', position: 'GK' },
      { id: 'cov-df1', name: 'Milan van Ewijk', position: 'DF' },
      { id: 'cov-df2', name: 'Bobby Thomas', position: 'DF' },
      { id: 'cov-df3', name: 'Liam Kitching', position: 'DF' },
      { id: 'cov-df4', name: 'Ethan Pinnock', position: 'DF' },
      { id: 'cov-df5', name: 'Jake Bidwell', position: 'DF' },
      { id: 'cov-df6', name: 'Jay Dasilva', position: 'DF' },
      { id: 'cov-mf1', name: 'Matt Grimes', position: 'MF' },
      { id: 'cov-mf2', name: 'Jack Rudoni', position: 'MF' },
      { id: 'cov-mf3', name: 'Gustavo Hamer', position: 'MF' },
      { id: 'cov-mf4', name: 'Victor Torp', position: 'MF' },
      { id: 'cov-fw1', name: 'Ellis Simms', position: 'FW' },
      { id: 'cov-fw2', name: 'Haji Wright', position: 'FW' },
      { id: 'cov-fw3', name: 'Taiwo Awoniyi', position: 'FW' },
      { id: 'cov-fw4', name: 'Brandon Thomas-Asante', position: 'FW' },
      { id: 'cov-fw5', name: 'Ephron Mason-Clark', position: 'FW' },
      { id: 'cov-fw6', name: 'Tatsuhiro Sakamoto', position: 'FW' }
    ]
  },
  {
    id: 'hull-city',
    name: 'Hull City',
    shortName: 'HUL',
    group: 'A',
    rating: 72,
    players: [
      { id: 'hul-gk1', name: 'Jack Butland', position: 'GK' },
      { id: 'hul-gk2', name: 'Konstantinos Tzolakis', position: 'GK' },
      { id: 'hul-df1', name: 'Lewie Coyle', position: 'DF' },
      { id: 'hul-df2', name: 'Paddy McNair', position: 'DF' },
      { id: 'hul-df3', name: 'Semi Ajayi', position: 'DF' },
      { id: 'hul-df4', name: 'John Egan', position: 'DF' },
      { id: 'hul-df5', name: 'Nobel Mendy', position: 'DF' },
      { id: 'hul-df6', name: 'Cody Drameh', position: 'DF' },
      { id: 'hul-mf1', name: 'Regan Slater', position: 'MF' },
      { id: 'hul-mf2', name: 'Hidemasa Morita', position: 'MF' },
      { id: 'hul-mf3', name: 'Matt Crooks', position: 'MF' },
      { id: 'hul-mf4', name: 'Darko Gyabi', position: 'MF' },
      { id: 'hul-mf5', name: 'Oscar Zambrano', position: 'MF' },
      { id: 'hul-mf6', name: 'Abdulkadir Omur', position: 'MF' },
      { id: 'hul-fw1', name: 'Liam Millar', position: 'FW' },
      { id: 'hul-fw2', name: 'Joe Gelhardt', position: 'FW' },
      { id: 'hul-fw3', name: 'Oli McBurnie', position: 'FW' },
      { id: 'hul-fw4', name: 'Mohamed Belloumi', position: 'FW' }
    ]
  },
  {
    id: 'ipswich',
    name: 'Ipswich Town',
    shortName: 'IPS',
    group: 'A',
    rating: 73,
    players: [
      { id: 'ips-gk1', name: 'Alex Palmer', position: 'GK' },
      { id: 'ips-gk2', name: 'Christian Walton', position: 'GK' },
      { id: 'ips-df1', name: 'Leif Davis', position: 'DF' },
      { id: 'ips-df2', name: 'Darnell Furlong', position: 'DF' },
      { id: 'ips-df3', name: 'Cedric Kipre', position: 'DF' },
      { id: 'ips-df4', name: 'Issa Diop', position: 'DF' },
      { id: 'ips-df5', name: 'Jacob Greaves', position: 'DF' },
      { id: 'ips-df6', name: 'Dara O\'Shea', position: 'DF' },
      { id: 'ips-mf1', name: 'Azor Matusiwa', position: 'MF' },
      { id: 'ips-mf2', name: 'Jack Taylor', position: 'MF' },
      { id: 'ips-mf3', name: 'Sasa Lukic', position: 'MF' },
      { id: 'ips-mf4', name: 'Cameron Humphreys', position: 'MF' },
      { id: 'ips-mf5', name: 'Marcelino Nunez', position: 'MF' },
      { id: 'ips-fw1', name: 'Julio Enciso', position: 'FW' },
      { id: 'ips-fw2', name: 'Abdul Fatawu', position: 'FW' },
      { id: 'ips-fw3', name: 'Jaden Philogene', position: 'FW' },
      { id: 'ips-fw4', name: 'Chiedozie Ogbene', position: 'FW' },
      { id: 'ips-fw5', name: 'Chuba Akpom', position: 'FW' },
      { id: 'ips-fw6', name: 'Jack Clarke', position: 'FW' }
    ]
  }
];

export const EPL_TEAMS_BY_ID = EPL_TEAMS.reduce((acc, team) => {
  acc[team.id] = team;
  return acc;
}, {} as Record<string, Team>);

export const EPL_LOGO_MAP: Record<string, string> = {
  'arsenal': arsenalLogo,
  'aston-villa': astonVillaLogo,
  'bournemouth': bournemouthLogo,
  'brentford': brentfordLogo,
  'brighton': brightonLogo,
  'chelsea': chelseaLogo,
  'coventry': coventryLogo,
  'crystal-palace': crystalPalaceLogo,
  'everton': evertonLogo,
  'fulham': fulhamLogo,
  'hull-city': hullCityLogo,
  'ipswich': ipswichLogo,
  'leeds': leedsLogo,
  'liverpool': liverpoolLogo,
  'man-city': manCityLogo,
  'man-utd': manUtdLogo,
  'newcastle': newcastleLogo,
  'nottingham': nottinghamLogo,
  'sunderland': sunderlandLogo,
  'tottenham': tottenhamLogo,
};

// Tier Map based on 25/26 Final Standings (S=3, A=2, B=1, C=0)
// Higher number = stronger team (matches simulation logic in EPLApp.tsx)
export const EPL_TIER_MAP: Record<string, number> = {
  // Tier S (3) — Top 5 mùa 25/26
  'arsenal': 3,       // #1, 85pts — Champions
  'man-city': 3,      // #2, 78pts
  'man-utd': 3,       // #3, 71pts
  'aston-villa': 3,   // #4, 65pts
  'liverpool': 3,     // #5, 60pts

  // Tier A (2) — #6-10
  'bournemouth': 2,   // #6, 57pts
  'sunderland': 2,    // #7, 54pts
  'brighton': 2,      // #8, 53pts
  'brentford': 2,     // #9, 53pts
  'chelsea': 2,       // #10, 52pts

  // Tier B (1) — #11-17
  'fulham': 1,        // #11, 52pts
  'newcastle': 1,     // #12, 49pts
  'everton': 1,       // #13, 49pts
  'leeds': 1,         // #14, 47pts
  'crystal-palace': 1, // #15, 45pts
  'nottingham': 1,    // #16, 44pts
  'tottenham': 1,     // #17, 41pts

  // Tier C (0) — Promoted
  'coventry': 0,      // Promoted from Championship
  'hull-city': 0,     // Promoted from Championship
  'ipswich': 0,       // Promoted from Championship
};
