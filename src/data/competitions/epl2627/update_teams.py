import json
import re

squads = {
    'arsenal': [
        ('GK', ['David Raya', 'Kepa Arrizabalaga', 'Illan Meslier']),
        ('DF', ['William Saliba', 'Cristhian Mosquera', 'Ben White', 'Piero Hincapie', 'Gabriel Magalhaes', 'Jurrien Timber', 'Riccardo Calafiori']),
        ('MF', ['Martin Odegaard', 'Eberechi Eze', 'Fabio Vieira', 'Ethan Nwaneri', 'Mikel Merino', 'Martin Zubimendi', 'Bruno Guimaraes', 'Declan Rice']),
        ('FW', ['Bukayo Saka', 'Gabriel Jesus', 'Gabriel Martinelli', 'Viktor Gyokeres', 'Christos Tzolis', 'Noni Madueke', 'Kai Havertz'])
    ],
    'man-city': [
        ('GK', ['Gianluigi Donnarumma', 'Geronimo Rulli', 'Marcus Bettinelli']),
        ('DF', ['Ruben Dias', 'Josko Gvardiol', 'Marc Guehi', 'Rayan Ait-Nouri', 'Rico Lewis', 'Matheus Nunes', 'Vitor Reis', 'Abdukodir Khusanov']),
        ('MF', ['Phil Foden', 'Elliot Anderson', 'Mateo Kovacic', 'Rayan Cherki', 'Jack Grealish', 'Jeremy Doku', 'Claudio Echeverri', 'Ayyoub Bouaddi']),
        ('FW', ['Erling Haaland', 'Antoine Semenyo'])
    ],
    'man-utd': [
        ('GK', ['Senne Lammens', 'Karl Darlow', 'Tom Heaton']),
        ('DF', ['Diogo Dalot', 'Noussair Mazraoui', 'Matthijs de Ligt', 'Harry Maguire', 'Lisandro Martinez', 'Patrick Dorgu', 'Leny Yoro', 'Luke Shaw']),
        ('MF', ['Mason Mount', 'Bruno Fernandes', 'Andrey Santos', 'Youri Tielemans', 'Manuel Ugarte', 'Kobbie Mainoo', 'Jack Fletcher']),
        ('FW', ['Marcus Rashford', 'Matheus Cunha', 'Joshua Zirkzee', 'Amad Diallo', 'Bryan Mbeumo', 'Benjamin Sesko', 'Shea Lacey'])
    ],
    'aston-villa': [
        ('GK', ['Emiliano Martinez', 'Zion Suzuki', 'Marco Bizot']),
        ('DF', ['Matty Cash', 'Victor Lindelof', 'Tyrone Mings', 'Matteo Ruggeri', 'Pau Torres', 'Aaron Wan-Bissaka', 'Lamare Bogarde', 'Josh Feeney']),
        ('MF', ['Ross Barkley', 'John McGinn', 'Boubacar Kamara', 'Emiliano Buendia', 'Amadou Onana', 'Joao Gomes', 'Johan Manzambi']),
        ('FW', ['Ollie Watkins', 'Alejandro Garnacho', 'Leon Bailey', 'Brian Madjo', 'Alysson dos Santos'])
    ],
    'liverpool': [
        ('GK', ['Alisson Becker', 'Giorgi Mamardashvili', 'Freddie Woodman']),
        ('DF', ['Virgil van Dijk', 'Jeremy Jacquet', 'Milos Kerkez', 'Jeremie Frimpong', 'Ronald Araujo', 'Joe Gomez', 'Konstantinos Tsimikas']),
        ('MF', ['Florian Wirtz', 'Dominik Szoboszlai', 'Alexis Mac Allister', 'Ryan Gravenberch', 'Curtis Jones', 'Wataru Endo', 'Harvey Elliott']),
        ('FW', ['Alexander Isak', 'Victor Munoz', 'Cody Gakpo', 'Hugo Ekitike', 'Federico Chiesa', 'Lewis Koumas'])
    ],
    'bournemouth': [
        ('GK', ['Dorde Petrovic', 'Fraser Forster', 'Will Dennis']),
        ('DF', ['Julian Araujo', 'Adrien Truffert', 'James Hill', 'Julio Soler', 'António Silva', 'Adam Smith', 'Bafode Diakite', 'Juanlu Sanchez']),
        ('MF', ['Lewis Cook', 'David Brooks', 'Alex Scott', 'Ryan Christie', 'Tyler Adams', 'Marcus Tavernier']),
        ('FW', ['Evanilson', 'Ben Gannon-Doak', 'Justin Kluivert', 'Amine Adli', 'Junior Kroupi', 'Daniel Jebbison'])
    ],
    'sunderland': [
        ('GK', ['Melker Ellborg', 'Simon Moore', 'Anthony Patterson']),
        ('DF', ['Omar Alderete', 'Aji Alese', 'Dan Ballard', 'Leo Hjelde', 'Trai Hume', 'Reinildo Mandava', 'Arthur Masuaku', 'Thomas Meunier']),
        ('MF', ['Jules Ahoka', 'Alan Browne', 'Habib Diarra', 'Enzo Le Fee', 'Chris Rigg', 'Noah Sadiki']),
        ('FW', ['Ahmed Abdullahi', 'Simon Adingra', 'Isaac Allan', 'Nilson Angulo', 'Abdoullah Ba', 'Brian Brobbey', 'Wilson Isidor', 'Romaine Mundle'])
    ],
    'brighton': [
        ('GK', ['Bart Verbruggen', 'Jason Steele', 'Tom McGill']),
        ('DF', ['Igor Julio', 'Pascal Struijk', 'Lewis Dunk', 'Eiran Cashin', 'Olivier Boscagli', 'Ferdi Kadioglu', 'Maxim De Cuyper', 'Luka Vuskovic']),
        ('MF', ['Jack Hinshelwood', 'Pascal Gross', 'Jakub Moder', 'Carlos Baleba', 'Joao Costinha', 'Diego Gomez', 'Mats Wieffer']),
        ('FW', ['Kaoru Mitoma', 'Stefanos Tzimas', 'Georginio Rutter', 'Yankuba Minteh', 'Promise David', 'Evan Ferguson', 'Mark O\'Mahony'])
    ],
    'brentford': [
        ('GK', ['Caoimhin Kelleher', 'Hakon Valdimarsson', 'Ellery Balcombe']),
        ('DF', ['Aaron Hickey', 'Rico Henry', 'Sepp van den Berg', 'Ethan Pinnock', 'Kristoffer Ajer', 'Jayden Meghoma', 'Nathan Collins']),
        ('MF', ['Yehor Yarmoliuk', 'Mathias Jensen', 'Josh Dasilva', 'Fabio Carvalho', 'Antoni Milambo', 'Mamadou Sangare', 'Vitaly Janelt']),
        ('FW', ['Kevin Schade', 'Igor Thiago', 'Dango Ouattara', 'Callum Wilson', 'Jaidon Anthony', 'Keane Lewis-Potter', 'Gustavo Nunes'])
    ],
    'chelsea': [
        ('GK', ['Robert Sanchez', 'Mike Penders', 'Gaga Slonina']),
        ('DF', ['Marco Palestra', 'Wesley Fofana', 'Valentin Barco', 'Maxence Lacroix', 'Levi Colwill', 'Reece James', 'Malo Gusto']),
        ('MF', ['Enzo Fernandez', 'Cole Palmer', 'Jamie Gittens', 'Jordan Henderson', 'Moises Caicedo', 'Romeo Lavia']),
        ('FW', ['Pedro Neto', 'Joao Pedro', 'Liam Delap', 'Nicolas Jackson', 'Danny Welbeck', 'Mykhailo Mudryk', 'Estevao Willian'])
    ],
    'fulham': [
        ('GK', ['Bernd Leno', 'Benjamin Lecomte', 'Alex Borto']),
        ('DF', ['Kenny Tete', 'Calvin Bassey', 'Jorge Cuenca', 'Joachim Andersen', 'Timothy Castagne', 'Ryan Sessegnon', 'Antonee Robinson']),
        ('MF', ['Harrison Reed', 'Cesar Palacios', 'Tom Cairney', 'Sander Berge', 'Alex Iwobi', 'Shea Charles', 'Emile Smith Rowe']),
        ('FW', ['Gonzalo Garcia', 'Rodrigo Muniz', 'Kevin Santos', 'Oscar Bobb', 'Jonah Kusi-Asare', 'Josh King'])
    ],
    'newcastle': [
        ('GK', ['Nick Pope', 'Lukas Hornicek', 'Mark Gillespie']),
        ('DF', ['Tino Livramento', 'Lewis Hall', 'Sven Botman', 'Fabian Schar', 'Malick Thiaw', 'Dan Burn', 'Amar Dedic']),
        ('MF', ['Joelinton', 'Aladji Bamba', 'Sean Steur', 'Joe Willock', 'Jacob Ramsey', 'Lewis Miley']),
        ('FW', ['Yoane Wissa', 'Will Osula', 'Harvey Barnes', 'Bazoumana Toure', 'Anthony Elanga', 'Jacob Murphy', 'Nick Woltemade'])
    ],
    'everton': [
        ('GK', ['Jordan Pickford', 'Mark Travers', 'Tom King']),
        ('DF', ['Nathan Patterson', 'Jarrad Branthwaite', 'Michael Keane', 'James Tarkowski', 'Jake O\'Brien', 'Vitalii Mykolenko', 'Adam Aznou']),
        ('MF', ['Kiernan Dewsbury-Hall', 'Christian Norgaard', 'Charly Alcaraz', 'Hayden Hackney', 'Merlin Rohl', 'James Garner', 'Tim Iroegbunam']),
        ('FW', ['Beto', 'Iliman Ndiaye', 'Thierno Barry', 'Tyrique George', 'Tyler Dibling', 'Brennan Johnson'])
    ],
    'leeds': [
        ('GK', ['James Trafford', 'A. Cairns', 'Lucas Perri']),
        ('DF', ['Jayden Bogle', 'Gabriel Gudmundsson', 'Ethan Ampadu', 'Tarik Muharemovic', 'Joe Rodon', 'J. Bijol', 'J. Justin', 'S. Byram']),
        ('MF', ['Daniel James', 'Sean Longstaff', 'Harry Wilson', 'Brenden Aaronson', 'Anton Stach', 'A. Tanaka', 'Ilia Gruev']),
        ('FW', ['Dominic Calvert-Lewin', 'Lukas Nmecha', 'Noah Okafor', 'Wilfried Gnonto', 'Patrick Bamford'])
    ],
    'crystal-palace': [
        ('GK', ['Dean Henderson', 'Remi Matthews', 'Walter Benitez']),
        ('DF', ['Daniel Munoz', 'Tyrick Mitchell', 'Chadi Riad', 'Takehiro Tomiyasu', 'Borna Sosa', 'Chris Richards', 'Oscar Mingueza']),
        ('MF', ['Jefferson Lerma', 'Daichi Kamada', 'Will Hughes', 'Adam Wharton', 'Cheick Doucoure', 'Justin Devenny']),
        ('FW', ['Ismaila Sarr', 'Eddie Nketiah', 'Yeremy Pino', 'Dwight McNeil', 'Jean-Philippe Mateta', 'Jorgen Strand Larsen', 'Matheus Franca'])
    ],
    'nottingham': [
        ('GK', ['John Victor', 'Matz Sels', 'Steven Benda']),
        ('DF', ['Murillo', 'Nikola Milenkovic', 'Morato', 'Neco Williams', 'Ola Aina', 'Luca Netz', 'Nicolo Savona', 'Tyler Bindon']),
        ('MF', ['Ibrahim Sangare', 'Ryan Yates', 'Nicolas Dominguez', 'Morgan Gibbs-White', 'Elliot Anderson', 'James McAtee']),
        ('FW', ['Callum Hudson-Odoi', 'Igor Jesus', 'Dan Ndoye', 'Chris Wood', 'Lorenzo Lucca'])
    ],
    'tottenham': [
        ('GK', ['Antonin Kinsky', 'Martin Dubravka', 'Brandon Austin']),
        ('DF', ['Andy Robertson', 'Kevin Danso', 'Marcos Senesi', 'Jan Paul van Hecke', 'Destiny Udogie', 'Pedro Porro', 'Micky van de Ven']),
        ('MF', ['Xavi Simons', 'Conor Gallagher', 'James Maddison', 'Archie Gray', 'Lucas Bergvall', 'Sandro Tonali', 'Pape Matar Sarr']),
        ('FW', ['Richarlison', 'Mathys Tel', 'Dominic Solanke', 'Mohammed Kudus', 'Wilson Odobert', 'Dane Scarlett'])
    ],
    'coventry': [
        ('GK', ['Daniel Bentley', 'Oliver Dovin', 'Ben Wilson']),
        ('DF', ['Jay Da Silva', 'Bobby Thomas', 'Liam Kitching', 'Jake Bidwell', 'Joel Latibeaudiere', 'Aurele Amenda', 'Milan van Ewijk']),
        ('MF', ['Jack Rudoni', 'Matt Grimes', 'Tatsuhiro Sakamoto', 'Ephron Mason-Clark', 'Frank Onyeka', 'Josh Eccles', 'Victor Torp']),
        ('FW', ['Ellis Simms', 'Haji Wright', 'Taiwo Awoniyi', 'Raphael Borges Rodrigues', 'Loum Tchaouna', 'Brandon Thomas-Asante'])
    ],
    'hull-city': [
        ('GK', ['Jack Butland', 'Konstantinos Tzolakis', 'Dillon Phillips']),
        ('DF', ['Lewie Coyle', 'Cody Drameh', 'Paddy McNair', 'Nobel Mendy', 'Semi Ajayi', 'John Egan', 'Ryan Giles', 'Matt Targett']),
        ('MF', ['Regan Slater', 'Hidemasa Morita', 'Matt Crooks', 'Lucas Gourna-Douath', 'Kieran Dowell', 'Darko Gyabi', 'Oscar Zambrano']),
        ('FW', ['Mohamed Belloumi', 'Liam Millar', 'AbdulKadir Omur', 'David Akintola', 'Joe Gelhardt', 'Oli McBurnie'])
    ],
    'ipswich': [
        ('GK', ['Alex Palmer', 'Christian Walton', 'Kjell Scherpen']),
        ('DF', ['Darnell Furlong', 'Leif Davis', 'Cedric Kipre', 'Issa Diop', 'Jacob Greaves', 'Dara O\'Shea', 'Ben Johnson']),
        ('MF', ['Azor Matusiwa', 'Sindre Walle Egeli', 'Florentino Luis', 'Jack Taylor', 'Sasa Lukic', 'Cameron Humphreys', 'Marcelino Nunez']),
        ('FW', ['Abdul Fatawu', 'Julio Enciso', 'Jaden Philogene', 'Emersonn', 'Chiedozie Ogbene', 'Chuba Akpom', 'Daizen Maeda', 'Jack Clarke'])
    ]
}

short_names = {
    'arsenal': 'ARS',
    'man-city': 'MCI',
    'man-utd': 'MUN',
    'aston-villa': 'AVL',
    'liverpool': 'LIV',
    'bournemouth': 'BOU',
    'sunderland': 'SUN',
    'brighton': 'BHA',
    'brentford': 'BRE',
    'chelsea': 'CHE',
    'fulham': 'FUL',
    'newcastle': 'NEW',
    'everton': 'EVE',
    'leeds': 'LEE',
    'crystal-palace': 'CRY',
    'nottingham': 'NFO',
    'tottenham': 'TOT',
    'coventry': 'COV',
    'hull-city': 'HUL',
    'ipswich': 'IPS'
}

with open('teamsEPL.ts', 'r', encoding='utf-8') as f:
    content = f.read()

for team_id, categories in squads.items():
    short = short_names[team_id]
    players_str_list = []
    
    for pos, players in categories:
        count = 1
        for p in players:
            p_id = f"{short.lower()}-{pos.lower()}{count}"
            p_clean = p.replace("'", "\\'")
            players_str_list.append(f"      {{ id: '{p_id}', name: '{p_clean}', position: '{pos}' }}")
            count += 1
            
    players_str = ",\n".join(players_str_list)
    
    # We look for: id: 'team_id', ... players: [ ... ]
    pattern = r"(id:\s*'" + team_id + r"'.*?players:\s*\[\n)(.*?)(^\s*\])"
    
    def repl(m):
        return m.group(1) + players_str + "\n" + m.group(3)
        
    content = re.sub(pattern, repl, content, flags=re.DOTALL | re.MULTILINE)

with open('teamsEPL.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated teamsEPL.ts")
