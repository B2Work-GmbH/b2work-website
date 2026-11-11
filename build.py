import html, re
E=html.escape
TITLE="b2work | Beratung Elektroplanung &amp; Blitzschutz | Aargau"
DESC="Elektroplanung, Beratung Elektroplanung, Blitzschutz, Blitzschutz VKF, Anlagenplanung, Systemplanung, Ausschreibung, Energienachweis, Lichtplanung, Netzberechnung, Elektroplaner Aargau, Schweiz"

def head(prefix, title, canonical):
    return f'''<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{DESC}">
<meta name="keywords" content="{DESC}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="b2work.ch">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="https://b2work.ch/assets/img/logo-b2w.png">
<link rel="canonical" href="{canonical}">
<link rel="icon" type="image/png" sizes="32x32" href="{prefix}favicon-32.png">
<link rel="apple-touch-icon" href="{prefix}assets/img/favicon.png">
<link rel="stylesheet" href="{prefix}assets/style.css">
</head>
<body>
'''

def header(prefix, logo, home):
    # home: '' on start page (anchors), prefix on subpages
    h = '' if home else prefix
    return f'''<a class="skip" href="#main-content">Zum Inhalt springen</a>
<header class="site">
 <div class="wrap">
  <a class="logo" href="{prefix or './'}" aria-label="B2Work GmbH, Startseite"><img src="{prefix}assets/img/{logo}" alt="B2Work GmbH"></a>
  <button class="menu-toggle" aria-expanded="false" aria-controls="mainnav" aria-label="Menü">&#9776;</button>
  <nav class="main" id="mainnav" aria-label="Hauptnavigation">
   <ul>
    <li><a href="{h or './'}#top">Startseite</a></li>
    <li><a href="{h}#leistungen">Leistungen</a></li>
    <li><a href="{h}#referenzen">Referenzen</a></li>
    <li><a href="{h}#ueber-uns">Über uns</a></li>
    <li><a href="{h}#cudo">Cudo</a></li>
    <li><a href="{h}#kontakt">Kontakt</a></li>
   </ul>
  </nav>
 </div>
</header>
'''

def footer(prefix, home):
    h = '' if home else prefix
    return f'''<footer class="site">
 <div class="wrap">
  <div class="cols">
   <div>
    <h4>Company</h4>
    <ul>
     <li><a href="{h or './'}#top">Startseite</a></li>
     <li><a href="{h}#leistungen">Leistungen</a></li>
     <li><a href="{h}#referenzen">Referenzen</a></li>
     <li><a href="{h}#ueber-uns">Über uns</a></li>
     <li><a href="{h}#kontakt">Kontakt</a></li>
    </ul>
   </div>
   <div>
    <h4>Legal</h4>
    <ul><li><a href="{prefix}impressum-und-datenschutz/">Impressum und Datenschutz</a></li></ul>
   </div>
   <div>
    <h4>Kontakt</h4>
    <ul>
     <li><a href="tel:+41798384911">+41 79 838 49 11</a></li>
     <li><a href="mailto:info@b2work.ch">info@b2work.ch</a></li>
     <li>Stockmattstrasse 37c, 5400 Baden</li>
    </ul>
   </div>
  </div>
  <p class="legal">Cudo ist ein Produkt der B2Work GmbH. <a href="https://www.cudo.ch">www.cudo.ch</a></p>
 </div>
</footer>
<script>
(function(){{var b=document.querySelector('.menu-toggle'),n=document.getElementById('mainnav');
b.addEventListener('click',function(){{var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)}});
n.addEventListener('click',function(e){{if(e.target.tagName==='A'){{n.classList.remove('open');b.setAttribute('aria-expanded',false)}}}});}})();
</script>
</body>
</html>
'''

REFS=[
 ("ref-claraspital",["St. Claraspital, Neubau Hirzbrunnen (Los B), Basel","Neubau Spital"],["2019 - 2020 | HRS Real Estate AG","Fachbauleitung und Koordination","Phase 4-5 Stark- und Schwachstrom"]),
 ("ref-hofacker",["Schulhaus Hofacker Zürich","Neubau und Gesamtsanierung der Schulhäuser"],["2020 - 2023 | Stadt Zürich","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-jakobshalle",["St. Jakobshalle Basel, Beleuchtungssanierung"],["2021 - 2022 | Stadt Basel","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-ava-dietikon",["AVA, Neubau Limmatalbahn Tramdepot Dietikon"],["2021 - 2023 | Aargau Verkehr AG","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-vbz-ladeinfrastruktur",["Neue Ladeinfrastruktur für die Elektrobusse"],["2022 - 2023 | Verkehrsbetriebe Zürich","Bauherrenvertretung Elektro","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-sbb-kuessnacht",["Sanierung und Umnutzung Bahnhofsgebäude SBB Küssnacht"],["2017 - 2019 | SBB AG Immobilien","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-lessingstrasse",["Gesamtumbau des alten Fabrikgebäudes Lessingstrasse 11-17"],["2019 - 2020 | Zürich Paris AG","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-en-raya",["Reihenfamilienhäuser «en raya» Oberrohrdorf"],["2020 - 2023 | Grendel Immobilien","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
 ("ref-menzingen",["Gesamtsanierung 8 Mehrfamilienhäuser Menzingen"],["2021 - 2023 | Immobilien Basel-Stadt","Elektroplanung, Fachbauleitung","Phase 3-5 / Stark- und Schwachstrom"]),
]
refs_html="\n".join(f'''   <article class="ref">
    <img src="assets/img/{img}.jpg" alt="{E(t[0])}" loading="lazy">
    <div class="cap"><h3>{"<br>".join(E(x) for x in t)}</h3><p>{"<br>".join(E(x) for x in m)}</p></div>
   </article>''' for img,t,m in REFS)

index = head('', TITLE, 'https://b2work.ch/') + header('', 'logo-b2w.png', True) + f'''<main id="main-content">
<section class="hero" id="top">
 <div class="wrap">
  <h1>Sicher Bauen mit einer zuverlässigen Grundlage.</h1>
  <p class="lead"><strong>Ihr Partner für ganzheitliche Beratung</strong> – kompetente Begleitung Ihres Vorhabens über alle Leistungsbereiche, vom ersten Konzept bis zur erfolgreichen Umsetzung.</p>
  <a class="btn" href="#kontakt">Projekt besprechen</a>
 </div>
</section>

<section id="leistungen">
 <div class="wrap two">
  <div>
   <h2>Ganzheitliche Beratung. Maximale Synergie.</h2>
   <p>Wir begleiten Sie von der ersten Idee bis zur finalen Umsetzung. Ob Einfamilienhaus oder Industriekomplex.</p>
   <p>Unser Anspruch ist die „sinnvollste Lösung": ein Dreiklang aus technischer Exzellenz, wirtschaftlicher Vernunft und ökologischer Verantwortung. Durch unser gewerkeübergreifendes Denken sorgen wir für ein harmonisches Gesamtsystem. Wir beraten Sie unabhängig und lösungsorientiert – für Projekte, die heute schon an morgen denken.</p>
  </div>
  <img src="assets/img/beratung.jpg" alt="Planungsbesprechung über Bauplänen" width="1400" height="1400">
 </div>
</section>

<section id="referenzen">
 <div class="wrap">
  <div class="refs-head">
   <h2>Ausgewählte Referenzen</h2>
   <p>Hier präsentieren wir ausgewählte Projekte in der Schweiz. Unsere Referenzen zeigen die Vielfalt unserer Leistungen im Wohnbau, Gewerbebau, Industrie und bei Umbauten.</p>
  </div>
  <div class="refs">
{refs_html}
  </div>
 </div>
</section>

<section id="ueber-uns">
 <div class="wrap">
  <div class="about">
   <h2>Über uns</h2>
   <div>
    <p class="claim">Zuverlässigkeit, Vertrauen und Ehrlichkeit sind für uns die wichtigsten Bestandteile einer erfolgreichen Zusammenarbeit.</p>
    <p>B2Work GmbH ist ein junges, unabhängiges Ingenieurbüro mit Sitz in Baden. B2Work vereint über 13 Jahre Projekterfahrung in Stark- und Schwachstrom, Lichtplanung, Blitzschutz und Bauherrenvertretung.</p>
    <p>Wir arbeiten in anspruchsvollen Bereichen: von Industriebauten und Pharmaprojekten über Schulen und Spitäler bis hin zu Infrastrukturprojekten und Wohnbauten. Unsere Stärke liegt in der persönlichen Betreuung – von der ersten Beratung bis zur Abnahme.</p>
    <p>Neben der Elektroplanung entwickelt und betreibt B2Work die Software Cudo (<a href="https://www.cudo.ch">www.cudo.ch</a>).</p>
   </div>
  </div>
  <div class="stats">
   <div class="stat"><span class="num">6</span><span class="lbl">Branchen</span></div>
   <div class="stat"><span class="gt">&gt;</span><span class="num">13</span><span class="lbl">Jahre</span></div>
   <div class="stat"><span class="gt">&gt;</span><span class="num">50</span><span class="lbl">Projekte</span></div>
  </div>
 </div>
</section>

<section class="cudo" id="cudo">
 <div class="wrap box">
  <div>
   <p class="kicker">Software der B2Work GmbH</p>
   <h2>Unser Produkt: Cudo</h2>
  </div>
  <div>
   <p>Cudo ist eine Software der B2Work GmbH für Handwerksbetriebe und Bauleitungen. Das Team meldet Stunden, Mängel und Material in der Web-App oder per WhatsApp. Cudo bringt die Informationen zum richtigen Projekt, das Büro prüft und arbeitet damit weiter.</p>
   <a class="btn" href="https://www.cudo.ch">Mehr auf cudo.ch</a>
  </div>
 </div>
</section>

<section id="adresse">
 <div class="wrap address">
  <div>
   <h2>Adresse</h2>
   <p>Stockmattstrasse 37c<br>5400 Baden</p>
   <p>Tel&nbsp;&nbsp;&nbsp;<a href="tel:+41798384911">+41 79 838 49 11</a><br>Mail&nbsp;&nbsp;<a href="mailto:info@b2work.ch">info@b2work.ch</a></p>
  </div>
  <div>
   <a href="https://www.openstreetmap.org/?mlat=47.4822921&amp;mlon=8.2860794#map=17/47.4822921/8.2860794"><img class="map" src="assets/img/karte-baden.jpg" alt="Karte: Stockmattstrasse 37c, 5400 Baden" width="1600" height="840" loading="lazy"></a>
   <p class="small">Karte: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a> · <a href="https://www.openstreetmap.org/?mlat=47.4822921&amp;mlon=8.2860794#map=17/47.4822921/8.2860794">Grössere Karte anzeigen</a></p>
  </div>
 </div>
</section>

<section class="contact" id="kontakt">
 <div class="wrap">
  <h2>Kontaktieren Sie uns</h2>
  <p class="intro">„Lassen Sie uns gemeinsam planen.“<br>Haben Sie Fragen zu einem Projekt, benötigen Sie fachliche Unterstützung oder möchten Sie ein unverbindliches Erstgespräch vereinbaren? Wir sind gerne für Sie da. Nutzen Sie einfach das untenstehende Kontaktformular – wir setzen uns zeitnah mit Ihnen in Verbindung.</p>
  <div class="mailbox">
   <p><a class="btn" href="mailto:info@b2work.ch?subject=Anfrage%20%C3%BCber%20b2work.ch">E-Mail an info@b2work.ch</a></p>
   <p>oder Telefon <a href="tel:+41798384911">+41 79 838 49 11</a></p>
  </div>
 </div>
</section>
</main>
''' + footer('', True)
open('index.html','w').write(index)

# Impressum
txt=open('/workspace/b2work-site/imp-text.txt').read().strip()
paras=[p.strip('\n') for p in re.split(r'\n\s*\n', txt)]
paras=[p for p in paras if p.strip()]
out=[]
for p in paras:
    ep=E(p)
    ep=re.sub(r'(https?://[^\s<]+[^\s<.,])', r'<a href="\1" rel="noopener">\1</a>', ep)
    ep=ep.replace('info@b2work.ch','<a href="mailto:info@b2work.ch">info@b2work.ch</a>')
    out.append(f'  <p>{ep}</p>')
    if p.startswith('E-Mail:') and len(out)<8:
        out.append('  <p class="cudo-note">Die B2Work GmbH betreibt auch die Software Cudo (<a href="https://www.cudo.ch">www.cudo.ch</a>).</p>')
imp = head('../', 'IMPRESSUM UND DATENSCHUTZ', 'https://b2work.ch/impressum-und-datenschutz/') + header('../','logo-bw.png',False) + '''<main id="main-content">
<section class="page-title"><div class="wrap"><h1>IMPRESSUM UND DATENSCHUTZ</h1></div></section>
<section class="legal-text"><div class="wrap">
''' + "\n".join(out) + '''
</div></section>
</main>
''' + footer('../', False)
open('impressum-und-datenschutz/index.html','w').write(imp)
print(len(paras),'paras; cudo-note inserted:', 'cudo-note' in imp)
