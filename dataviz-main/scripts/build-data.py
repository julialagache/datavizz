#!/usr/bin/env python3
"""Génère data.js à partir des CSV du dossier : c'est la seule source des chiffres du site.
Usage : python3 scripts/build-data.py  (depuis la racine du projet)"""
import csv, json, re, collections

NATIONAL = 'festivals-global-festivals-_-pl.csv'
CORSE = 'panorama-des-festivals-en-corse.csv'
CARTE = 'franceHigh.svg'

# Insee, estimations de population au 1er janvier 2023 (insee.fr/fr/statistiques/2012713)
POP = {'Auvergne-Rhône-Alpes': 8205557, "Provence-Alpes-Côte d'Azur": 5218960, 'Occitanie': 6124653,
       'Nouvelle-Aquitaine': 6150451, 'Île-de-France': 12463067, 'Bretagne': 3449370, 'Grand Est': 5563378,
       'Bourgogne-Franche-Comté': 2802670, 'Centre-Val de Loire': 2587031, 'Hauts-de-France': 5992194,
       'Pays de la Loire': 3907156, 'Normandie': 3345842, 'Corse': 355486}

# Les anciennes régions du fond de carte, regroupées dans les 13 régions actuelles
FUSION = {'Alsace': 'Grand Est', 'Champagne-Ardenne': 'Grand Est', 'Lorraine': 'Grand Est',
          'Aquitaine': 'Nouvelle-Aquitaine', 'Limousin': 'Nouvelle-Aquitaine', 'Poitou-Charentes': 'Nouvelle-Aquitaine',
          'Auvergne': 'Auvergne-Rhône-Alpes', 'Rhône-Alpes': 'Auvergne-Rhône-Alpes',
          'Bourgogne': 'Bourgogne-Franche-Comté', 'Franche-Comté': 'Bourgogne-Franche-Comté',
          'Bretagne': 'Bretagne', 'Centre': 'Centre-Val de Loire', 'Corse': 'Corse', 'Île-de-France': 'Île-de-France',
          'Languedoc-Roussillon': 'Occitanie', 'Midi-Pyrénées': 'Occitanie',
          'Nord-Pas-de-Calais': 'Hauts-de-France', 'Picardie': 'Hauts-de-France',
          'Basse-Normandie': 'Normandie', 'Haute-Normandie': 'Normandie',
          'Pays de la Loire': 'Pays de la Loire', "Provence-Alpes-Côte d'Azur": "Provence-Alpes-Côte d'Azur"}

DISCIPLINES = ['Musique', 'Spectacle vivant', 'Livre, littérature', 'Cinéma, audiovisuel',
               'Pluridisciplinaire', 'Arts visuels, arts numériques']
PERIODES = ['Avant-saison', 'Saison', 'Après-saison', 'Non précisée']
MOIS_PERIODE = {'janvier': 0, 'février': 0, 'mars': 0, 'avril': 0, 'mai': 0, 'juillet': 1, 'août': 1,
                'octobre': 2, 'ocotbre': 2, 'novembre': 2, 'décembre': 2}


def annee(v):
    v = v.strip()
    m = re.fullmatch(r'(\d{4})(\.0)?', v) or re.fullmatch(r'\d{2}/\d{2}/(\d{4}) \d{2}:\d{2}', v)
    y = int(m.group(1)) if m else 0
    return y if 1500 <= y <= 2023 else 0


def periode(v):
    v = v.strip().lower()
    if v.startswith('avant-saison'): return 0
    if v.startswith('saison'): return 1
    if v.startswith('après-saison'): return 2
    return MOIS_PERIODE.get(v, 3)  # juin, septembre, variable ou vide : à cheval, donc non précisé


lignes = list(csv.reader(open(NATIONAL, encoding='utf-8-sig'), delimiter=';'))[1:]
vus, rows, doublons = set(), [], 0
for r in lignes:
    cle = tuple(c.strip() for c in r)
    if cle in vus:
        doublons += 1
        continue
    vus.add(cle)
    rows.append(r)

regions = [k for k, _ in collections.Counter(r[1].strip() for r in rows).most_common()]
fest, annee_inconnue, annee_illisible = [], 0, 0
for r in rows:
    nom = re.sub(r'\s+', ' ', r[0].lstrip('﻿').strip())
    y = annee(r[4])
    annee_inconnue += y == 0
    annee_illisible += y == 0 and bool(r[4].strip())
    fest.append([nom, regions.index(r[1].strip()), y, DISCIPLINES.index(r[5].strip()), periode(r[6])])

carte = open(CARTE, encoding='utf-8-sig').read()
geo = collections.defaultdict(list)
for titre, d in re.findall(r'title="([^"]+)"[^>]*? d="([^"]+)"', carte):
    geo[FUSION[titre]].append(d)
assert sum(len(v) for v in geo.values()) == 22

NOMS = {'JAZZ IN AIACCIU': 'Jazz in Aiacciu', 'RENCONTRES DE CHANTS POLYPHONIQUES DE CALVI': 'Rencontres de chants polyphoniques de Calvi',
        'MI ! FESTIVAL': 'Mi ! Festival', 'CALVI ON THE ROCKS': 'Calvi on the Rocks', "FESTIVAL DE MUSIQUE D'ERBALUNGA": "Festival de musique d'Erbalunga",
        'NAUTIC & MUSIC': 'Nautic & Music', 'FESTIVOCE': 'Festivoce', 'KULTURARTE FESTIVAL DES CULTURES DU MONDES EN CORSE': 'Kulturarte, festival des cultures du monde en Corse',
        'CARGESE SOUND SYSTEM': 'Cargèse Sound System', 'FESTA MAIO': 'Festa Maio', "CORSICA.DOC, Festival international du film documentaire d'Ajaccio": "Corsica.Doc, festival international du film documentaire d'Ajaccio",
        'PORTO LATINO': 'Porto Latino', 'NUITS DE LA GUITARE A PATRIMONIO': 'Nuits de la guitare à Patrimonio', 'Calvi Jazz': 'Calvi Jazz'}
COMMUNES = {'BASTIA': 'Bastia', 'AJACCIO': 'Ajaccio', 'CALVI': 'Calvi', 'Porto Vecchio': 'Porto-Vecchio', 'LECCI': 'Lecci', 'BRANDO': 'Brando',
            'BONIFACIO': 'Bonifacio', 'PIGNA': 'Pigna', 'PORTICCIO': 'Porticcio', 'CARGESE': 'Cargèse', 'ST FLORENT': 'Saint-Florent', 'PATRIMONIO': 'Patrimonio'}
corse = []
for c in csv.DictReader(open(CORSE, encoding='utf-8-sig'), delimiter=';'):
    nom = c[next(k for k in c if k.endswith('Nom de la manifestation'))].strip()
    lat, lon = [float(x) for x in c['coordonnees_insee'].split(',')]
    url = c['Site web'].strip()
    if url and not url.startswith('http'): url = 'http://' + url
    corse.append({'nom': NOMS.get(nom, nom), 'commune': COMMUNES.get(c['Commune principale'].strip(), c['Commune principale'].strip()),
                  'dept': c['Nom Département'].strip(), 'domaine': c['Domaine'].strip(), 'mois': int(c['Mois habituel de début'][:2]),
                  'lat': lat, 'lon': lon, 'annee': int(c['Date de création'][:4]) if c['Date de création'] else 0, 'url': url})

data = {'meta': {'lignes': len(lignes), 'doublons': doublons, 'anneeInconnue': annee_inconnue, 'anneeIllisible': annee_illisible},
        'regions': [{'nom': n, 'pop': POP.get(n, 0)} for n in regions], 'disciplines': DISCIPLINES, 'periodes': PERIODES,
        'festivals': fest, 'geo': geo, 'corse': corse}
with open('data.js', 'w', encoding='utf-8') as f:
    f.write('// Fichier généré par scripts/build-data.py : ne pas modifier à la main.\nwindow.FESTIVALS=')
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')

print(json.dumps(data['meta']), len(fest), collections.Counter(x[4] for x in fest))
dep = collections.Counter(c['dept'] for c in corse); print(dep, collections.Counter(c['mois'] for c in corse), collections.Counter(c['domaine'] for c in corse))
reg = collections.Counter(x[1] for x in fest)
for i, r in enumerate(data['regions']):
    if r['pop']: print(r['nom'], reg[i], round(reg[i] / r['pop'] * 1e5, 1))
ys = [x[2] for x in fest if x[2]]
print('known', len(ys), '>=2010', sum(y >= 2010 for y in ys), '>=2000', sum(y >= 2000 for y in ys), 'peak', collections.Counter(ys).most_common(3), '<1950', sum(y < 1950 for y in ys))
