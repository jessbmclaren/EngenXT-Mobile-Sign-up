#!/usr/bin/env python3
"""Writes the TFN product pages: the products hub and one page per product.

Every product's screen and copy is defined once here, so the hub tile and the
product page always show the same thing. Facts come from tfn.co.za (read in
full on 14 Oct 2026) and, for LCV, the LCV vision and scope docs.

usage: python3 tools/build-product-pages.py      (run from the repo root)
"""
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

LOGO = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="logo" viewBox="0 56 392 148"><text x="0" y="200" fill="currentColor" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="200" letter-spacing="2" style="font-variation-settings:\'opsz\' 144">TFN</text></symbol></svg>'
COIN = '<svg><use href="#logo"/></svg>'

# ---------- the products, in range order: everyday first, premium last ----------
P = {}

P['road'] = dict(
    file='tfn-on-road.html', name='On-Road', kicker='TFN On-Road', finish='p-road', acc='#2a6fd0', tier='For trucks',
    blurb='Refuel trucks at 270+ truck stops at negotiated prices.',
    title='Diesel for your trucks, at a better price',
    sub='You order the fuel, your driver fills up at a TFN truck stop, and the fill appears in your dashboard straight away with the litres, the price and a photo from the pump.',
    cta=('Get a fuel quote', 'tfn-page-examples.html#f'),
    stats=[('270+', 'truck stops'), ('168K+', 'transactions a month'), ('44M+', 'litres a month')],
    screen='''<span class="t">TFN Pay · Order</span><span class="h">TFN 204 GP</span>
<div class="card"><div class="row"><i></i><span><b>Diesel</b><small>TFN truck stop, N3</small></span><span><b>420 L</b><small>R 20.19/L</small></span></div></div>
<div class="photo"><span>Pump photo</span></div>
<div class="card"><div class="row"><span class="ok">Location checked</span></div><div class="row"><span class="ok">Truck matched</span></div><div class="row"><span><b>Driver</b><small>Sipho K.</small></span><span><b>09:41</b></span></div></div>
<div class="cta">Fill recorded</div>''',
    extra='<div class="gl g1"><i style="background:linear-gradient(145deg,#8fc0f5,#1f4fa8)"></i><div><b>In your dashboard</b><small>09:41 · TFN 204 GP</small></div></div><div class="gl g2"><div><b>No cards or codes</b><small>No slips to chase</small></div></div>',
    how=('How a fill works', [
        ('You place the order', 'Choose the truck, the litres and the truck stop in your TFN Dashboard, or let your driver request it for your approval.'),
        ('Your driver fills up', 'At the truck stop, TFN Pay checks the truck is where it should be and matches its registration. A photo is taken at the pump.'),
        ('It’s in your dashboard', 'Litres, price, depot, time and the pump photo appear straight away. Nothing to collect, capture or chase.'),
    ]),
    feats=('What you get', [
        ('Prices below the grid price', 'Negotiated diesel prices at every TFN truck stop, with bigger discounts as your volume grows.'),
        ('Cash or credit', 'Pre-load your account by EFT, or fuel on a credit facility through Standard Bank, Absa or Preference Capital.'),
        ('Limits you set', 'Daily, weekly or monthly limits per driver and truck. Approve each order, or let drivers order within their limits.'),
        ('Alerts', 'Get notified about unusual volumes, new orders and low balances.'),
        ('Reports your accountant will like', 'Download PDF or Excel statements with VAT-compliant records, or send the data to Sage, Xero or your ERP.'),
        ('Subcontractors on your account', 'Add subcontractors under your account with their own limits and your own markup, on one invoice.'),
    ]),
)

P['lcv'] = dict(
    file='tfn-lcv.html', name='LCV', kicker='TFN LCV', soon=True, finish='p-lcv', acc='#2a6fd0', tier='For bakkies and vans · Coming soon',
    blurb='Fuel for bakkies and vans, without a fuel card.',
    title='Fuel for bakkies and vans, without the card',
    sub='Set the rules for each driver and vehicle. Drivers ask for fuel in the app, every request is checked against your rules before the pump starts, and they pay with a QR code at the till.',
    cta=('Join the waiting list', 'tfn-page-examples.html#f'),
    chips=['Rules per driver', 'Rules per vehicle', 'Prepaid wallet', 'Daily reports'],
    screen='''<span class="t">TFN LCV · Fuel request</span><span class="h">CA 482-913</span>
<div class="card"><div class="row"><span><b>Approved</b><small>Diesel 50</small></span><span><b>Up to 60 L</b></span></div></div>
<div class="qr"></div><span class="t" style="text-align:center">Show this at the till</span>
<div class="cta">Done</div>''',
    extra='<div class="gl g1"><i style="background:linear-gradient(145deg,#7fd3ff,#2fb5b0)"></i><div><b>Checked before it’s paid</b><small>Against your rules</small></div></div>',
    before='<div class="sky" aria-hidden="true"></div>',
    how=('How it works', [
        ('Set the rules', 'Add your vehicles and drivers, link each driver to a vehicle, and decide how much fuel each one can buy and how often.'),
        ('The driver asks for fuel', 'In the app, before filling up. The request is checked against your rules and comes back approved, with a limit, or declined.'),
        ('Pay at the till', 'The driver shows a QR code at the till. The money comes from your prepaid wallet, and the purchase is in your report that day.'),
    ]),
    feats=('Why it beats a fuel card', [
        ('Nothing to clone or lose', 'There’s no card to skim or share. Each purchase needs a driver, a vehicle and an approved request.'),
        ('Rules on every purchase', 'Tank size and how often a vehicle can fill up are checked before the pump starts, not after.'),
        ('A wallet you control', 'Top up your prepaid wallet and see what’s left at a glance.'),
        ('Drivers see only the answer', 'Drivers get approved or declined, never your rules or your balance.'),
        ('Daily reports', 'See every purchase by driver and vehicle, the same day.'),
        ('Set up yourself', 'Sign up, add your company, vehicles and drivers without waiting for anyone.'),
    ]),
)

P['nonfuel'] = dict(
    file='tfn-non-fuel.html', name='Non-Fuel', kicker='TFN Non-Fuel', finish='p-nonfuel', acc='#8f55d6', tier='On the road',
    blurb='Parking, showers, truck washes and AdBlue on the same account.',
    title='Everything else at the stop, sorted',
    sub='Secure overnight parking, a shower, a truck wash or AdBlue. Book it for your driver and pay from the same account as the diesel.',
    cta=('See the services on the map', 'tfn-network.html'),
    chips=['AdBlue', 'Overnight', 'Shower', 'Canteen', 'Laundry', 'Truck wash'],
    screen='''<span class="t">TFN Pay · Tonight</span><span class="h">Your stop is booked</span>
<div class="card">
<div class="row"><i style="background:#c9b8ff"></i><span><b>Overnight parking</b><small>Secure, 1 night</small></span><span>✓</span></div>
<div class="row"><i style="background:#e4fb6a"></i><span><b>Shower</b><small>From 19:00</small></span><span>✓</span></div>
<div class="row"><i style="background:#b9a6f5"></i><span><b>Truck wash</b><small>Before you leave</small></span><span>✓</span></div>
<div class="row"><i style="background:#d2ef3d"></i><span><b>AdBlue</b><small>40 L</small></span><span>✓</span></div>
</div><div class="cta">Paid from your TFN account</div>''',
    before='',
    stage_before='<div class="pill3d"></div><div class="ring"></div><div class="cube"></div>',
    how=('How it works', [
        ('Find the stop', 'Filter the network map by service: AdBlue, overnight parking, showers, canteen, laundry, truck wash or shop.'),
        ('Book it for your driver', 'Book parking and services along with the fuel, so the whole trip is sorted before the truck leaves.'),
        ('One statement', 'Services are paid from your TFN account, cash or credit, and listed next to the diesel.'),
    ]),
    feats=('What’s on the network', [
        ('Secure overnight parking', 'Vetted stops where your driver and load can rest safely.'),
        ('AdBlue', 'Fill up on AdBlue at the same stop as the diesel.'),
        ('Showers and laundry', 'Look after your drivers on long trips.'),
        ('Canteen and shop', 'A meal and supplies, paid from the same account.'),
        ('Truck wash', 'Arrive clean, without a separate invoice.'),
        ('On credit too', 'Your credit facility covers non-fuel services as well as diesel.'),
    ]),
)

P['network'] = dict(
    file='tfn-network.html', name='Network', kicker='TFN Network', dark=True, finish='p-net', acc='#3d9bff', tier='Planning',
    blurb='Find the best diesel price on your route before you leave.',
    title='The cheapest diesel on your route',
    sub='See today’s prices at every TFN truck stop, plan where to fill up before the truck leaves, and send the stops to your driver.',
    cta=('Open the network map', 'https://tfn.co.za/tfn-network-map/'),
    chips=['N3 Joburg → Durban', 'N1 Joburg → Cape Town', 'N4 Gauteng → Mozambique'],
    screen='''<span class="t">Route planner</span><span class="h">Joburg → Durban</span>
<div class="map"><svg viewBox="0 0 200 220" aria-hidden="true"><g stroke="#2c2e32" stroke-width="6" fill="none"><path d="M0 40h200M0 110h200M0 180h200M40 0v220M110 0v220M170 0v220"/></g><path d="M20 10C60 50 70 90 100 110S150 170 185 210" stroke="#5d6e86" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M20 10C60 50 70 90 100 110S150 170 185 210" stroke="#3d9bff" stroke-width="4" fill="none" stroke-linecap="round"/><g font-family="Satoshi, sans-serif" font-size="11" font-weight="700"><rect x="52" y="44" width="54" height="20" rx="10" fill="#fff"/><text x="79" y="58" text-anchor="middle" fill="#111">R 20.19</text><rect x="118" y="128" width="54" height="20" rx="10" fill="#3d9bff"/><text x="145" y="142" text-anchor="middle" fill="#fff">R 19.94</text></g><circle cx="100" cy="110" r="6" fill="#fff"/><circle cx="160" cy="176" r="6" fill="#fff"/></svg></div>
<div class="card"><div class="row"><i></i><span><b>Best price on route</b><small>2 TFN truck stops</small></span><span><b>R 19.94</b></span></div></div>
<div class="chips"><span>AdBlue</span><span>Overnight</span><span>Shower</span></div>
<div class="cta">Send to driver</div>''',
    extra='<div class="gl g1"><i style="background:#3d9bff"></i><div><b>Top 10 prices today</b><small>By region</small></div></div><div class="gl g2"><div><b>Below the grid price</b><small>On every TFN fill</small></div></div>',
    before='<div class="glow" aria-hidden="true"></div>',
    how=('Plan a trip in three steps', [
        ('Pick a route', 'Start from a popular route like the N3 to Durban or the N1 to Cape Town, or plan your own.'),
        ('Compare the stops', 'See the price at every TFN truck stop on the way, the services each one has, and what you save on the trip.'),
        ('Send it to the driver', 'Share the stops by WhatsApp or in the app, so the driver knows where to fill up.'),
    ]),
    feats=('What the map shows', [
        ('Today’s best prices', 'The top 10 prices on the network today, by region, and the prices that have just dropped.'),
        ('Trip savings', 'What you save on the route by filling up at TFN truck stops.'),
        ('Services at each stop', 'Filter by AdBlue, overnight parking, showers, canteen, laundry, truck wash and shop.'),
        ('Cross-border stops', 'TFN Africa truck stops in five neighbouring countries, on the same map.'),
        ('Fuel price outlook', 'See where next month’s diesel price is heading, based on Central Energy Fund data.'),
        ('Live depot status', 'Opening hours and depot details before your driver turns in.'),
    ]),
)

P['home'] = dict(
    file='tfn-homebase.html', name='Homebase', kicker='TFN Homebase', dark=True, finish='p-home', acc='#2fb5b0', tier='In your yard',
    blurb='Diesel in your own yard, recorded with the rest.',
    title='Your own tank, on the same account',
    sub='TFN delivers diesel to the tank in your yard and records every fill against the truck and driver, next to the fuel bought on the road.',
    cta=('Work out my Homebase fee', 'https://tfn.co.za/homebase-calculator/'),
    screen='''<span class="t">TFN Dashboard · Homebase</span><span class="h">Yard tank 1</span>
<div class="card"><span class="t">In the tank</span><div class="big">12,020 L</div><div class="bar" style="--v:60%;margin-top:.5em"><i></i></div></div>
<div class="card"><div class="row"><i></i><span><b>TFN 311 GP</b><small>Driver: Thabo M.</small></span><span><b>380 L</b><small>07:12</small></span></div><div class="row"><i style="opacity:.5"></i><span><b>Delivery</b><small>From TFN</small></span><span><b>+8,000 L</b><small>Mon</small></span></div></div>
<div class="card"><div class="row"><span><b>From your tank</b><small>this month</small></span><span><b>62%</b></span></div><div class="row"><span><b>On the road</b><small>this month</small></span><span><b>38%</b></span></div></div>''',
    before='<div aria-hidden="true"><div class="tank" style="--w:170px;--h:330px;--x:calc(50% + 230px)"><div class="body"></div><div class="lid"></div></div><div class="tank" style="--w:120px;--h:220px;--x:calc(50% + 410px)"><div class="body"></div><div class="lid"></div></div></div>',
    how=('How Homebase works', [
        ('TFN delivers to your yard', 'Order diesel for your own tank through the TFN Dashboard, on cash or credit.'),
        ('Every fill is recorded', 'Each fill from your tank is logged against the truck, the driver and the litres, and only drivers you allow can draw fuel.'),
        ('Yard and road, side by side', 'Tank readings, deliveries and on-road fills sit in one set of reports.'),
    ]),
    feats=('What you get', [
        ('Know where the diesel went', 'Which truck, which driver, how many litres, every time.'),
        ('Tank levels and deliveries', 'Readings and deliveries recorded, so losses show up as they happen.'),
        ('Less reconciliation', 'Finance gets a clean digital record instead of chasing it afterwards.'),
        ('Compare yard and road', 'See which routes use your own diesel and which use the road.'),
        ('Credit across both', 'One credit facility covers deliveries to your tank, gantry collections and on-road fills.'),
        ('A fee that fits', 'Your Homebase fee is set by your monthly on-road volume.'),
    ]),
)

P['africa'] = dict(
    file='tfn-africa.html', name='TFN Africa', kicker='TFN Africa', dark=True, finish='p-africa', acc='#8f55d6', tier='Cross-border',
    blurb='Refuel in five neighbouring countries, paid in rand.',
    title='Across the border, still in rand',
    sub='Refuel at TFN truck stops in Namibia, Botswana, Zimbabwe, Zambia and Mozambique on your South African account, and see it all in one report.',
    cta=('Plan a cross-border route', 'https://tfn.co.za/tfn-africa/'),
    screen='''<span class="t">TFN Pay · Cross-border</span><span class="h">Joburg → Lusaka</span>
<div class="card"><div class="row"><i></i><span><b>South Africa</b><small>Fill up before the border</small></span><span><b>420 L</b></span></div><div class="row"><i style="opacity:.6"></i><span><b>Botswana</b><small>TFN Africa</small></span><span><b>260 L</b></span></div><div class="row"><i style="opacity:.4"></i><span><b>Zambia</b><small>TFN Africa</small></span><span><b>310 L</b></span></div></div>
<div class="card"><span class="t">Paid in</span><div class="big">Rand</div><span class="ok">One account, one currency</span></div>
<div class="cta">Plan the route</div>''',
    extra='<div class="gl g2"><div><b>Border permits and tolls</b><small>Coming soon</small></div></div>',
    before='<div class="bg" aria-hidden="true"></div>',
    how=('How cross-border works', [
        ('Plan the route', 'See TFN truck stops along your corridor, and where to fill up in South Africa before the border.'),
        ('Refuel across the border', 'Drivers fill up at TFN Africa stops the same way as at home: no cash, cards or codes.'),
        ('Pay in rand', 'Every fill, in every country, is paid from your South African account and listed in one report.'),
    ]),
    feats=('What you get', [
        ('Five countries', 'Namibia, Botswana, Zimbabwe, Zambia and Mozambique.'),
        ('No foreign currency', 'Pay in rand, on the account you already use.'),
        ('One set of reports', 'Fuel and spend across countries in one place.'),
        ('Fuel and selected services', 'Diesel and selected non-fuel services along the route.'),
        ('On credit too', 'Your TFN credit facility works at cross-border stops.'),
        ('Coming soon', 'Help with border permits and toll payments.'),
    ]),
)

P['credit'] = dict(
    file='tfn-credit.html', name='Credit', kicker='TFN Credit', dark=True, finish='p-credit', acc='#d9dbdf', accink='#000', tier='Finance',
    blurb='Fuel now and pay your bank later.',
    title='Fuel now, pay your bank later',
    sub='Get a fuel credit facility through Standard Bank, Absa or Preference Capital. Your bank pays TFN, you repay your bank monthly, and you set spending limits per driver and truck.',
    cta=('Choose a credit provider', 'https://tfn.co.za/select-a-credit-provider/'),
    chips=['Standard Bank', 'Absa', 'Preference Capital'],
    screen='''<span class="t">TFN Dashboard · Credit</span><span class="h">Credit available</span><div class="big">R 184,200</div><div class="bar" style="--v:42%"><i></i></div>
<div class="card"><div class="row"><i></i><span><b>TFN 204 GP</b><small>Weekly limit</small></span><span><b>R 25,000</b></span></div><div class="row"><i style="opacity:.6"></i><span><b>Sipho K.</b><small>Daily limit</small></span><span><b>R 6,000</b></span></div></div>
<div class="card"><div class="row"><span><b>Statement</b><small>Monthly</small></span><span class="ok">Ready</span></div></div>
<div class="cta">Download statement</div>''',
    stage_before='<div class="coin c1 float" style="animation-delay:-2s">' + COIN + '</div><div class="coin c2 float" style="animation-delay:-4s">' + COIN + '</div><div class="coin c3 float" style="animation-delay:-1s">' + COIN + '</div>',
    how=('How TFN credit works', [
        ('Apply through your bank', 'Choose Standard Bank, Absa or Preference Capital. They handle the application, and once you’re approved your limit shows in your dashboard.'),
        ('Fuel anywhere on the network', 'Use it at every TFN truck stop, at cross-border stops, for non-fuel services and for Homebase deliveries.'),
        ('Repay your bank', 'You get a monthly statement and repay your credit provider, usually within 30 days. TFN supplies the fuel and the reports.'),
    ]),
    feats=('What you get', [
        ('Keep cash in the business', 'Your trucks keep moving while you settle later.'),
        ('Limits per driver and truck', 'Daily, weekly or monthly limits, and orders you approve.'),
        ('Credit for subcontractors', 'Share your limit with subcontractors and get one consolidated invoice.'),
        ('Statements that match', 'Export reports to check against your bank’s monthly statement.'),
        ('Fuel and more', 'Covers diesel, overnight parking, truck washes and other services on the network.'),
        ('Across the border', 'Works at TFN Africa truck stops too.'),
    ]),
)

LATER = [
    ('Insurance', 'Cover for your trucks, through TFN.', 'p-ins'),
]
ORDER = ['road', 'lcv', 'nonfuel', 'network', 'home', 'africa', 'credit']


def nav(current=None):
    links = ''.join('<a href="%s"%s>%s</a>' % (P[k]['file'], ' aria-current="page"' if k == current else '', P[k]['name']) for k in ORDER)
    return ('<header class="nav"><div class="wrap"><a class="brand" href="tfn-page-examples.html" aria-label="TFN home"><svg aria-hidden="true"><use href="#logo"/></svg></a>'
            '<nav class="links" aria-label="Products">%s</nav><span class="grow"></span><a class="btn" href="tfn-page-examples.html#f">Get a quote</a></div></header>' % links)


def tile(k):
    p = P[k]
    return '<a class="tile" href="%s"><div><h3>%s</h3><p>%s</p><span class="tier">%s</span></div><div class="ph %s"><div class="s">%s</div></div></a>' % (
        p['file'], p['name'], p['blurb'], p['tier'], p['finish'], p['screen'])


def later_tiles():
    return ''.join('<div class="tile later"><div><h3>%s</h3><p>%s</p><span class="tier">Coming soon</span></div><div class="ph %s"><div class="s"><span class="t">%s</span><span class="h">Coming soon</span></div></div></div>' % (n, d, f, n) for n, d, f in LATER)


def footer():
    prod = ''.join('<li><a href="%s">%s</a></li>' % (P[k]['file'], P[k]['name']) for k in ORDER)
    return ('<footer data-dark><div class="wrap"><div class="cols">'
            '<div><h4>Products</h4><ul><li><a href="tfn-products.html">All products</a></li>%s</ul></div>'
            '<div><h4>Plan and save</h4><ul><li><a href="https://tfn.co.za/tfn-network-map/">Network map</a></li><li><a href="https://tfn.co.za/price-list/">Fuel prices</a></li><li><a href="https://tfn.co.za/your-fuel-quote/">Get a fuel quote</a></li><li><a href="https://tfn.co.za/fuel-insights/">Fuel price outlook</a></li></ul></div>'
            '<div><h4>Company</h4><ul><li><a href="https://tfn.co.za/about-us/">About TFN</a></li><li><a href="https://tfn.co.za/contact-us/">Contact us</a></li><li><a href="https://tfn.co.za/tfn-support/">Support</a></li></ul></div>'
            '<div><h4>Account</h4><ul><li><a href="https://app.tfn.co.za/">Log in</a></li><li><a href="https://tfn.co.za/terms-conditions/">Terms and conditions</a></li></ul></div>'
            '</div><svg aria-hidden="true"><use href="#logo"/></svg><span>TFN, South Africa’s largest independent on-road refuelling service provider, since April 2007. Design concept: screens and figures in the mock-ups are illustrative.</span></div></footer>') % prod


def page(title, desc, body, body_class=''):
    return '''<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s</title>
<meta name="description" content="%s">
<link rel="icon" href="logo-mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="tfn-products.css">
</head>
<body%s>
<!-- generated by tools/build-product-pages.py: edit the generator, not this file -->
%s
%s
<script src="tfn-products.js"></script>
</body>
</html>
''' % (html.escape(title), html.escape(desc), ' class="%s"' % body_class if body_class else '', LOGO, body)


def product_page(k):
    p = P[k]
    dark = p.get('dark')
    dk = ' dk' if dark else ''
    data_dark = ' data-dark' if dark else ''
    soon = ' <span class="soon">Coming soon</span>' if p.get('soon') else ''
    stats = '<div class="stats">%s</div>' % ''.join('<div><b>%s</b><span>%s</span></div>' % s for s in p['stats']) if p.get('stats') else ''
    chips = '<div class="chiprow">%s</div>' % ''.join('<span>%s</span>' % c for c in p['chips']) if p.get('chips') else ''
    btn = 'btn light' if dark else 'btn'
    hero = '''<section class="pp%s" id="%s"%s>%s<div class="wrap"><div>
<p class="crumb"><a href="tfn-products.html">Products</a> / %s</p>
<p class="kicker">%s%s</p><h1>%s</h1><p class="sub">%s</p><a class="%s" href="%s">%s</a>%s%s</div>
<div class="stage">%s<div class="ph %s float"><div class="s">%s</div></div>%s</div></div></section>''' % (
        dk, k, data_dark, p.get('before', ''), p['name'], p['kicker'], soon, p['title'], p['sub'], btn, p['cta'][1], p['cta'][0], stats, chips,
        p.get('stage_before', ''), p['finish'], p['screen'], p.get('extra', ''))
    how = '<section class="band grey"%s><div class="wrap"><h2>%s</h2><div class="steps3" style="--acc:%s;--accink:%s">%s</div></div></section>' % (
        data_dark, p['how'][0], p['acc'], p.get('accink', '#fff'), ''.join('<div><h3>%s</h3><p>%s</p></div>' % s for s in p['how'][1]))
    feats = '<section class="band"%s><div class="wrap"><h2>%s</h2><div class="feats">%s</div></div></section>' % (
        data_dark, p['feats'][0], ''.join('<div><h3>%s</h3><p>%s</p></div>' % f for f in p['feats'][1]))
    more = '<section class="band grey more"%s><div class="wrap"><h2>More from TFN</h2><p class="sub">Every product runs on one TFN account, and is moving into Truckers Hub, coming soon.</p><div class="range">%s</div></div></section>' % (
        data_dark, ''.join(tile(o) for o in ORDER if o != k))
    close = '<section class="close"%s><div class="wrap"><h2>%s</h2><p class="sub">%s</p><a class="%s" href="%s">%s</a></div></section>' % (
        data_dark, 'Be first in line for LCV' if p.get('soon') else 'See what you’d save',
        'Leave your details and we’ll tell you when LCV opens.' if p.get('soon') else 'Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will send you a comparison within 48 hours.', btn,
        p['cta'][1] if p.get('soon') else 'https://tfn.co.za/your-fuel-quote/', p['cta'][0] if p.get('soon') else 'Get a fuel quote')
    body = nav(k) + '\n<main>\n' + '\n'.join([hero, how, feats, more, close]) + '\n</main>\n' + footer()
    return page('TFN %s | %s' % (p['name'], p['title']), p['sub'], body, 'dark-page' if dark else '')


def hub():
    intro = '''<section class="intro"><div class="wrap">
<p class="kicker" style="justify-content:center">Truckers Hub <span class="soon">Coming soon</span></p><h1 style="font-size:clamp(2.4rem,5vw,3.6rem)">Everything TFN does, in one place</h1>
<p class="sub">TFN gets your trucks diesel at negotiated prices at 270+ truck stops and handles the payment and the paperwork, with no cards, no cash and no slips. Truckers Hub will bring every TFN product into one place: one app for your drivers and one portal for your fleet managers.</p>
<div class="range">%s%s</div></div></section>''' % (''.join(tile(k) for k in ORDER), later_tiles())
    hubband = '''<section class="band"><div class="wrap"><h2>Two apps, one hub</h2><p class="sub">Today your drivers use TFN Pay and you use the TFN Dashboard. Truckers Hub brings every product into one driver app and one fleet manager portal, and holds the things every product needs, so you set them up once.</p>
<div class="steps3" style="--acc:#1f1f1f;grid-template-columns:repeat(2,1fr)">
<div><h3>The driver app</h3><p>On the driver’s phone: see orders, ask for fuel, fill up and book a stop. Drivers only see what they need to do the job.</p></div>
<div><h3>The fleet manager portal</h3><p>In the office: set up your company, people, vehicles and rules, top up your wallet, approve orders and see every transaction.</p></div>
</div><div class="feats">
<div><h3>Your company</h3><p>Your company profile and documents, captured once for every product.</p></div>
<div><h3>Your people</h3><p>Give each person the access their job needs, from owner to driver.</p></div>
<div><h3>Vehicles and drivers</h3><p>Add them once and use them across On-Road, LCV and Homebase.</p></div>
<div><h3>Your wallet</h3><p>Top up, see your balance and pay for every product from one place.</p></div>
<div><h3>Notifications</h3><p>Orders, approvals, low balances and anything unusual, as it happens.</p></div>
<div><h3>Reports</h3><p>Every transaction from every product, in one set of reports.</p></div>
</div></div></section>'''
    how = '''<section class="band grey"><div class="wrap"><h2>How TFN works</h2><div class="steps3" style="--acc:#1f1f1f">
<div><h3>Open an account</h3><p>Sign up online, add your trucks and drivers, and choose cash (pre-loaded by EFT) or credit through your bank.</p></div>
<div><h3>Order and fill up</h3><p>Order fuel in the TFN Dashboard. Your driver fills up at a TFN truck stop, checked by location and photographed at the pump.</p></div>
<div><h3>See every litre</h3><p>Every fill lands in your dashboard straight away, ready for reports, statements and your accounting system.</p></div>
</div></div></section>'''
    close = '<section class="close"><div class="wrap"><h2>Not sure where to start?</h2><p class="sub">Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will show you what you’d save, within 48 hours.</p><a class="btn" href="https://tfn.co.za/your-fuel-quote/">Get a fuel quote</a></div></section>'
    body = nav() + '\n<main>\n' + intro + hubband + how + close + '\n</main>\n' + footer()
    return page('TFN | Products and Truckers Hub', 'TFN products: On-Road, LCV, Non-Fuel, Network, Homebase, TFN Africa and Credit. Truckers Hub, coming soon, brings them into one driver app and one fleet manager portal.', body)


if __name__ == '__main__':
    (ROOT / 'tfn-products.html').write_text(hub())
    for k in ORDER:
        (ROOT / P[k]['file']).write_text(product_page(k))
    print('wrote tfn-products.html and', len(ORDER), 'product pages')
