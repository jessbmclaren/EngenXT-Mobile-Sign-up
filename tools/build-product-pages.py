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

LOGO = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><linearGradient id="tfnB1" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="100" y2="20"><stop offset="0" stop-color="#b9d6f2"/><stop offset="1" stop-color="#5d8fd8"/></linearGradient><linearGradient id="tfnB2" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="100" y2="30"><stop offset="0" stop-color="#3d68c0"/><stop offset="0.55" stop-color="#2c56b8"/><stop offset="1" stop-color="#5a43a8"/></linearGradient><linearGradient id="tfnB3" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="100" y2="50"><stop offset="0" stop-color="#4a35a6"/><stop offset="0.6" stop-color="#3b4fa8"/><stop offset="1" stop-color="#1f7a62"/></linearGradient><linearGradient id="tfnB4" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="100" y2="70"><stop offset="0" stop-color="#2a1f6e"/><stop offset="0.55" stop-color="#1f2f80"/><stop offset="1" stop-color="#1f6a62"/></linearGradient><radialGradient id="tfnWarm" cx="86" cy="88" r="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d07034" stop-opacity=".85"/><stop offset="1" stop-color="#d07034" stop-opacity="0"/></radialGradient><radialGradient id="tfnHi" cx="30" cy="18" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="tfnGaps" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><circle cx="50" cy="50" r="50" fill="#fff"/><g fill="none" stroke="#000" stroke-width="5"><path d="M-5 40C26 10 62 34 105 6"/><path d="M-5 60C28 30 64 54 105 30"/><path d="M-5 98C20 60 62 80 105 58"/></g></mask><symbol id="tfn-mark" viewBox="0 0 100 100"><g mask="url(#tfnGaps)"><circle cx="50" cy="50" r="50" fill="url(#tfnB4)"/><path fill="url(#tfnB3)" d="M-5 98C20 60 62 80 105 58V-5H-5Z"/><path fill="url(#tfnB2)" d="M-5 60C28 30 64 54 105 30V-5H-5Z"/><path fill="url(#tfnB1)" d="M-5 40C26 10 62 34 105 6V-5H-5Z"/><circle cx="50" cy="50" r="50" fill="url(#tfnWarm)"/><circle cx="50" cy="50" r="50" fill="url(#tfnHi)"/></g></symbol><symbol id="logo" viewBox="0 56 392 148"><text x="0" y="200" fill="currentColor" font-family="Fraunces, Georgia, serif" font-weight="900" font-size="200" letter-spacing="2" style="font-variation-settings:\'opsz\' 144,\'SOFT\' 0,\'WONK\' 0;font-optical-sizing:none">TFN</text></symbol><symbol id="lockup" viewBox="0 0 441 128"><use href="#tfn-mark" width="128" height="128"/><use href="#logo" x="150" y="9" width="291" height="110"/></symbol></svg>'
COIN = '<svg><use href="#logo"/></svg>'

# ---------- the products, in range order: everyday first, premium last ----------
P = {}

P['road'] = dict(
    file='tfn-on-road.html', name='CRT – Onroad', kicker='TFN CRT – Onroad', finish='p-road', acc='#2a6fd0', tier='For trucks',
    blurb='Negotiated diesel at 270+ truck stops.',
    title='Cheaper diesel. Every litre accounted for.',
    sub='Order the fuel. Your driver fills up at a TFN truck stop. The litres, the price and a pump photo land in your dashboard as it happens.',
    cta=('Get a fuel quote', 'tfn-page-examples.html#f'),
    stats=[('270+', 'truck stops'), ('168K+', 'transactions a month'), ('44M+', 'litres a month')],
    screen='''<span class="t">Order</span><span class="h">TFN 204 GP</span>
<div class="card"><div class="row"><i></i><span><b>Diesel</b><small>TFN truck stop, N3</small></span><span><b>420 L</b><small>R 20.19/L</small></span></div></div>
<div class="photo"><span>Pump photo</span></div>
<div class="card"><div class="row"><span class="ok">Location checked</span></div><div class="row"><span class="ok">Truck matched</span></div><div class="row"><span><b>Driver</b><small>Sipho K.</small></span><span><b>09:41</b></span></div></div>
<div class="cta">Fill recorded</div>''',
    extra='<div class="gl g1"><i style="background:#2a6fd0"></i><div><b>In your dashboard</b><small>09:41 · TFN 204 GP</small></div></div><div class="gl g2"><div><b>Matched at the pump</b><small>Truck and location checked</small></div></div>',
    how=('How a fill works', [
        ('Order', 'Pick the truck, the litres and the stop. Or approve your driver’s request.'),
        ('Fill up', 'TFN Pay checks the truck’s location and registration. A photo is taken at the pump.'),
        ('Done', 'Litres, price, stop and photo are in your dashboard. Nothing to collect or capture.'),
    ]),
    feats=('What you get', [
        ('Below the grid price', 'Negotiated prices at every TFN truck stop. The more you fuel, the bigger the discount.'),
        ('Cash or credit', 'Load your account by EFT. Or fuel on credit through Standard Bank, Absa or Preference Capital.'),
        ('Your limits', 'Daily, weekly or monthly limits per driver and truck. Approve every order or let drivers order within them.'),
        ('Alerts', 'Know about unusual volumes, new orders and low balances straight away.'),
        ('Accountant-ready', 'VAT-compliant statements in PDF or Excel. Or send the data to Sage, Xero or your ERP.'),
        ('Subcontractors', 'Give each one their own limits and your markup. Get one invoice.'),
    ]),
)

P['lcv'] = dict(
    file='tfn-lcv.html', name='EngenXT', kicker='EngenXT', soon=True, finish='p-lcv', acc='#0e8fb3', tier='For bakkies and vans · Coming soon',
    blurb='Fuel for bakkies and vans at Engen. No fuel card.',
    title='Fuel for bakkies and vans. No card.',
    sub='Set the rules for each driver and vehicle. Drivers ask for fuel in the app and every request is checked before the pump starts. They pay with a QR code at the Engen till.',
    cta=('Join the waiting list', 'tfn-page-examples.html#f'),
    chips=['Rules per driver', 'Rules per vehicle', 'Prepaid wallet', 'Daily reports'],
    screen='''<span class="t">Fuel request</span><span class="h">CA 482-913</span>
<div class="card"><div class="row"><span><b>Approved</b><small>Diesel 50</small></span><span><b>Up to 60 L</b></span></div></div>
<div class="qr"></div><span class="t" style="text-align:center">Show this at the till</span>
<div class="cta">Done</div>''',
    extra='<div class="gl g1"><i style="background:#0e8fb3"></i><div><b>Checked before it’s paid</b><small>Against your rules</small></div></div>',
    how=('How it works', [
        ('Set the rules', 'Add vehicles and drivers. Decide how much fuel each can buy and how often.'),
        ('Ask for fuel', 'Drivers ask in the app before they fill up. The answer is approved with a limit, or declined.'),
        ('Pay with a QR code', 'Drivers show a QR code at the till. It’s paid from your prepaid wallet and in your report the same day.'),
    ]),
    feats=('Why it beats a fuel card', [
        ('Nothing to skim', 'No card to clone, lose or share. Every purchase needs a driver, a vehicle and an approved request.'),
        ('Checked first', 'Tank size and fill limits are checked before the pump starts. Not after.'),
        ('Your wallet', 'Top up and see your balance at a glance.'),
        ('Drivers only see the answer', 'Approved or declined. Never your rules or your balance.'),
        ('Same-day reports', 'Every purchase by driver and vehicle, that day.'),
        ('Set it up yourself', 'Add your company, vehicles and drivers. No waiting.'),
    ]),
)

P['nonfuel'] = dict(
    file='tfn-non-fuel.html', name='Onroad non-fuel', kicker='TFN Onroad non-fuel', finish='p-nonfuel', acc='#4f6b8a', tier='On the road',
    blurb='Oil, road assist, parking and truck washes. Same account.',
    title='Everything your driver needs on route',
    sub='Oil, road assist, safe overnight parking and a truck wash. Book it with the diesel and pay from one account.',
    cta=('See the services on the map', 'tfn-network.html'),
    chips=['Oil', 'Road assist', 'Overnight', 'Truckwash', 'AdBlue', 'Shower'],
    screen='''<span class="t">Tonight</span><span class="h">Your stop is booked</span>
<div class="card">
<div class="row"><i></i><span><b>Overnight parking</b><small>Secure, 1 night</small></span><span>✓</span></div>
<div class="row"><i style="opacity:.75"></i><span><b>Shower</b><small>From 19:00</small></span><span>✓</span></div>
<div class="row"><i style="opacity:.55"></i><span><b>Truck wash</b><small>Before you leave</small></span><span>✓</span></div>
<div class="row"><i style="opacity:.4"></i><span><b>AdBlue</b><small>40 L</small></span><span>✓</span></div>
</div><div class="cta">Paid from your TFN account</div>''',
    how=('How it works', [
        ('Find the stop', 'Filter the map by service: overnight parking, truck wash, AdBlue and more.'),
        ('Book it', 'Add parking and services to the fuel order. The trip is planned before the truck leaves.'),
        ('One statement', 'Paid from your TFN account, cash or credit, next to the diesel.'),
    ]),
    feats=('What’s on the network', [
        ('Oil', 'Top up engine oil at the stop.'),
        ('Road assist', 'Help for your driver when a truck stops on the road.'),
        ('Safe overnight parking', 'Vetted stops where driver and load can rest.'),
        ('Truck wash', 'Leave clean. No separate invoice.'),
        ('More at the stop', 'AdBlue, showers, laundry, a canteen and a shop, where the stop has them.'),
        ('On credit too', 'Your credit facility covers services as well as diesel.'),
    ]),
)

P['network'] = dict(
    file='tfn-network.html', name='Network', kicker='TFN Network', dark=True, finish='p-net', acc='#3346a8', tier='Planning',
    blurb='Find the best diesel price on your route before you leave.',
    title='The cheapest diesel on your route',
    sub='Today’s price at every TFN truck stop. Plan your fills before the truck leaves, then send the stops to your driver.',
    cta=('Open the network map', 'tfn-network.html#portal'),
    chips=['N3 Joburg → Durban', 'N1 Joburg → Cape Town', 'N4 Gauteng → Mozambique'],
    screen='''<span class="t">Route planner</span><span class="h">Joburg → Durban</span>
<div class="map"><svg viewBox="0 0 200 220" aria-hidden="true"><g stroke="#2c2e32" stroke-width="6" fill="none"><path d="M0 40h200M0 110h200M0 180h200M40 0v220M110 0v220M170 0v220"/></g><path d="M20 10C60 50 70 90 100 110S150 170 185 210" stroke="#5d6e86" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M20 10C60 50 70 90 100 110S150 170 185 210" stroke="#3d9bff" stroke-width="4" fill="none" stroke-linecap="round"/><g font-family="Satoshi, sans-serif" font-size="11" font-weight="700"><rect x="52" y="44" width="54" height="20" rx="10" fill="#fff"/><text x="79" y="58" text-anchor="middle" fill="#111">R 20.19</text><rect x="118" y="128" width="54" height="20" rx="10" fill="#3d9bff"/><text x="145" y="142" text-anchor="middle" fill="#fff">R 19.94</text></g><circle cx="100" cy="110" r="6" fill="#fff"/><circle cx="160" cy="176" r="6" fill="#fff"/></svg></div>
<div class="card"><div class="row"><i></i><span><b>Best price on route</b><small>2 TFN truck stops</small></span><span><b>R 19.94</b></span></div></div>
<div class="chips"><span>AdBlue</span><span>Overnight</span><span>Shower</span></div>
<div class="cta">Send to driver</div>''',
    extra='<div class="gl g1"><i style="background:#3346a8"></i><div><b>Top 10 prices today</b><small>By region</small></div></div><div class="gl g2"><div><b>Below the grid price</b><small>On every TFN fill</small></div></div>',
    how=('Plan a trip in three steps', [
        ('Pick a route', 'Start from a popular route like the N3 to Durban or the N1 to Cape Town, or plan your own.'),
        ('Compare the stops', 'See the price at every TFN truck stop on the way, the services each one has and what you save on the trip.'),
        ('Send it to the driver', 'Share the stops by WhatsApp or in the app, so the driver knows where to fill up.'),
    ]),
    feats=('What the map shows', [
        ('Today’s best prices', 'The top 10 prices on the network today by region, plus the prices that have just dropped.'),
        ('Trip savings', 'What you save on the route by filling up at TFN truck stops.'),
        ('Services at each stop', 'Filter by AdBlue, overnight parking, showers, canteen, laundry, truck wash and shop.'),
        ('Cross-border stops', 'TFN Africa truck stops in five neighbouring countries, on the same map.'),
        ('Fuel price outlook', 'See where next month’s diesel price is heading, based on Central Energy Fund data.'),
        ('Live depot status', 'Opening hours and depot details before your driver turns in.'),
    ]),
)

P['home'] = dict(
    file='tfn-homebase.html', name='Homebase management', kicker='TFN Homebase', dark=True, finish='p-home', acc='#138a85', tier='In your yard',
    blurb='Diesel in your own yard, tracked with the rest.',
    title='Your yard tank, on the same account',
    sub='TFN delivers diesel to your yard tank. Every fill is recorded against the truck and driver, next to what you buy on the road.',
    cta=('Work out my Homebase fee', 'tfn-tiers.html#calc'),
    screen='''<span class="t">Homebase</span><span class="h">Yard tank 1</span>
<div class="card"><span class="t">In the tank</span><div class="big">12,020 L</div><div class="bar" style="--v:60%;margin-top:.5em"><i></i></div></div>
<div class="card"><div class="row"><i></i><span><b>TFN 311 GP</b><small>Driver: Thabo M.</small></span><span><b>380 L</b><small>07:12</small></span></div><div class="row"><i style="opacity:.5"></i><span><b>Delivery</b><small>From TFN</small></span><span><b>+8,000 L</b><small>Mon</small></span></div></div>
<div class="card"><div class="row"><span><b>From your tank</b><small>this month</small></span><span><b>62%</b></span></div><div class="row"><span><b>On the road</b><small>this month</small></span><span><b>38%</b></span></div></div>''',
    how=('How Homebase works', [
        ('We deliver', 'Order diesel for your tank in the TFN Dashboard. Cash or credit.'),
        ('Every fill recorded', 'Truck, driver and litres, every time. Only drivers you allow can draw fuel.'),
        ('Yard and road together', 'Tank levels, deliveries and on-road fills in one set of reports.'),
    ]),
    feats=('What you get', [
        ('Know where it went', 'Which truck, which driver, how many litres.'),
        ('Tank levels and deliveries', 'Losses show up as they happen.'),
        ('Less reconciliation', 'Finance gets a clean digital record. No chasing.'),
        ('Yard or road', 'See which routes use your diesel and which use the road.'),
        ('One credit facility', 'Covers tank deliveries, gantry collections and on-road fills.'),
        ('A fee that fits', 'Set by your monthly on-road volume.'),
    ]),
)

P['africa'] = dict(
    file='tfn-africa.html', name='Cross Border', kicker='TFN Cross Border', dark=True, finish='p-africa', acc='#6b62c9', tier='Cross-border',
    blurb='Fuel, tolls and more past the border. Paid in rand.',
    title='Across the border. Still in rand.',
    sub='Fill up in Namibia, Botswana, Zimbabwe, Zambia and Mozambique on your South African account. Tolls and parking, forwarding and clearing, even cash for the trip: all on the same account.',
    cta=('Plan a cross-border route', 'tfn-africa.html#portal'),
    chips=['Fuel', 'Tolls and parking', 'Forwarding and clearing', 'Cash'],
    screen='''<span class="t">Cross-border</span><span class="h">Joburg → Lusaka</span>
<div class="card"><div class="row"><i></i><span><b>South Africa</b><small>Fill up before the border</small></span><span><b>420 L</b></span></div><div class="row"><i style="opacity:.6"></i><span><b>Botswana</b><small>TFN Africa</small></span><span><b>260 L</b></span></div><div class="row"><i style="opacity:.4"></i><span><b>Zambia</b><small>TFN Africa</small></span><span><b>310 L</b></span></div></div>
<div class="card"><span class="t">Paid in</span><div class="big">Rand</div><span class="ok">One account, one currency</span></div>
<div class="cta">Plan the route</div>''',
    extra='<div class="gl g2"><div><b>Tolls and parking</b><small>On the same account</small></div></div>',
    stage_before='<div class="photo-card" style="background-image:url(img/plan-africa.jpg)"></div>',
    how=('How cross-border works', [
        ('Plan the route', 'See every TFN stop on your corridor and where to fill up before the border.'),
        ('Fill up abroad', 'Same as at home. No cash, cards or codes.'),
        ('Pay in rand', 'Every fill in every country, from your South African account. One report.'),
    ]),
    feats=('What you get', [
        ('Five countries', 'Namibia, Botswana, Zimbabwe, Zambia and Mozambique. Paid in rand.'),
        ('Tolls and parking', 'Paid from your TFN account along the way.'),
        ('Forwarding and clearing', 'Help getting loads through the border.'),
        ('Cash for the trip', 'Arranged through your TFN account.'),
        ('One report', 'Fuel and spend across every country in one place.'),
        ('On credit too', 'Your TFN credit facility works across the border.'),
    ]),
)

P['credit'] = dict(
    file='tfn-credit.html', name='Credit products', kicker='TFN Treasury', dark=True, finish='p-credit', acc='#a2468e', tier='Finance',
    blurb='Fuel now. Pay your bank later.',
    title='Fuel now. Pay your bank later.',
    sub='Get a fuel facility through Standard Bank, Absa or Preference Capital. Your bank pays TFN and you repay monthly. You set the limits per driver and truck.',
    cta=('Choose a credit provider', 'tfn-credit.html'),
    chips=['Standard Bank', 'Absa', 'Preference Capital'],
    screen='''<span class="t">Credit</span><span class="h">Credit available</span><div class="big">R 184,200</div><div class="bar" style="--v:42%"><i></i></div>
<div class="card"><div class="row"><i></i><span><b>TFN 204 GP</b><small>Weekly limit</small></span><span><b>R 25,000</b></span></div><div class="row"><i style="opacity:.6"></i><span><b>Sipho K.</b><small>Daily limit</small></span><span><b>R 6,000</b></span></div></div>
<div class="card"><div class="row"><span><b>Statement</b><small>Monthly</small></span><span class="ok">Ready</span></div></div>
<div class="cta">Download statement</div>''',
    how=('How TFN credit works', [
        ('Apply through your bank', 'Standard Bank, Absa or Preference Capital handle it. Once you’re approved, your limit is in your dashboard.'),
        ('Fuel anywhere', 'Truck stops, cross-border stops, services and Homebase deliveries.'),
        ('Repay monthly', 'One statement. Repay your provider, usually within 30 days.'),
    ]),
    feats=('What you get', [
        ('Keep cash in the business', 'Trucks keep moving. You settle later.'),
        ('Limits per driver and truck', 'Daily, weekly or monthly. Or approve every order.'),
        ('Share with subcontractors', 'Split your limit. Get one invoice.'),
        ('Statements that match', 'Reports that reconcile with your bank statement.'),
        ('More than diesel', 'Covers overnight parking, truck washes and other services.'),
        ('Across the border', 'Works at TFN Africa truck stops too.'),
    ]),
)

P['risk'] = dict(
    file='tfn-risk.html', name='Risk management', kicker='TFN Risk management', finish='p-risk', acc='#3f7d4e', tier='Cover',
    blurb='Insure trucks and loads. Get fines handled.',
    title='Cover for your trucks and loads',
    sub='Vehicle and goods-in-transit insurance through ONE Insurance. Traffic fines managed by IOX. All next to your fuel, on one account.',
    cta=('Ask about cover', '#'),
    chips=['Vehicle insurance', 'GIT insurance', 'Fines'],
    screen='''<span class="t">Risk management</span><span class="h">TFN 204 GP</span>
<div class="card"><div class="row"><i></i><span><b>Vehicle insurance</b><small>ONE Insurance</small></span><span class="ok">Covered</span></div><div class="row"><i style="opacity:.6"></i><span><b>GIT insurance</b><small>Goods in transit</small></span><span class="ok">Covered</span></div></div>
<div class="card"><div class="row"><i style="opacity:.4"></i><span><b>Fines</b><small>Managed by IOX</small></span><span><b>2 new</b></span></div></div>
<div class="cta">Review fines</div>''',
    extra='<div class="gl g1"><i style="background:#3f7d4e"></i><div><b>2 new fines</b><small>Flagged by IOX</small></div></div>',
    how=('How it works', [
        ('Add it', 'Pick the cover you need, next to your fuel.'),
        ('Partners handle it', 'ONE Insurance covers trucks and loads. IOX manages fines.'),
        ('See it in one place', 'Cover and new fines sit in the same portal as every litre.'),
    ]),
    feats=('What you get', [
        ('Vehicle insurance', 'Your trucks, covered by ONE Insurance.'),
        ('GIT insurance', 'The loads they carry, covered too.'),
        ('Fines, managed', 'IOX tracks every traffic fine your vehicles get.'),
        ('New fines flagged', 'They land as exceptions in your portal. Act on them early.'),
        ('Telematics too', 'ONE Insurance also provides vehicle telematics.'),
        ('One account', 'Cover and fines next to your fuel.'),
    ]),
)

P['fleet'] = dict(
    file='tfn-fleet-management.html', name='Fleet management', kicker='TFN Fleet management', finish='p-fleet', acc='#2d7fa3', tier='Compliance',
    blurb='Every vehicle road-legal. No lapsed licences.',
    title='Every vehicle road-legal',
    sub='IOX handles licensing for your fleet. See every licence that’s due before it runs out.',
    cta=('Ask about licensing', '#'),
    chips=['Licensing'],
    screen='''<span class="t">Licensing</span><span class="h">3 due in 30 days</span>
<div class="card"><div class="row"><i></i><span><b>TFN 204 GP</b><small>Licence due</small></span><span><b>12 days</b></span></div><div class="row"><i style="opacity:.7"></i><span><b>TFN 311 GP</b><small>Licence due</small></span><span><b>21 days</b></span></div><div class="row"><i style="opacity:.45"></i><span><b>TFN 118 GP</b><small>Licence due</small></span><span><b>28 days</b></span></div></div>
<div class="card"><div class="row"><span><b>Road-legal</b><small>This month</small></span><span class="ok">39 of 42</span></div></div>
<div class="cta">Renew</div>''',
    extra='<div class="gl g1"><i style="background:#2d7fa3"></i><div><b>Licence due in 12 days</b><small>TFN 204 GP</small></div></div>',
    how=('How licensing works', [
        ('Your vehicles, already there', 'Licensing uses the trucks on your TFN account.'),
        ('See what’s due', 'Anything due within 30 days is flagged in your portal.'),
        ('Renew', 'IOX renews it. The truck stays on the road.'),
    ]),
    feats=('What you get', [
        ('Licensing, handled', 'IOX renews your licences.'),
        ('Due dates in view', 'Everything due in the next 30 days, in one list.'),
        ('Flagged early', 'Licences about to lapse show with your other exceptions.'),
        ('Fines too', 'IOX also manages traffic fines.'),
        ('One vehicle list', 'Add a vehicle once. Use it for fuel, licensing and cover.'),
        ('One account', 'Licensing next to your fuel.'),
    ]),
)

P['support'] = dict(
    file='tfn-vehicle-support.html', name='Vehicle support services', kicker='TFN Vehicle support services', finish='p-support', acc='#5c6370', tier='Maintenance',
    blurb='Tyres, servicing and telematics. Less downtime.',
    title='Less downtime. Longer life.',
    sub='Tyres, servicing and telematics for every truck, on your TFN account. Telematics by ONE Insurance.',
    cta=('Ask about vehicle support', '#'),
    chips=['Tyres', 'Servicing', 'Telematics'],
    screen='''<span class="t">Vehicle support</span><span class="h">TFN 311 GP</span>
<div class="card"><div class="row"><i></i><span><b>Tyres</b><small>Steer axle</small></span><span><b>Check due</b></span></div><div class="row"><i style="opacity:.7"></i><span><b>Servicing</b><small>Next service</small></span><span><b>4 200 km</b></span></div><div class="row"><i style="opacity:.45"></i><span><b>Telematics</b><small>ONE Insurance</small></span><span class="ok">Live</span></div></div>
<div class="cta">Book a service</div>''',
    how=('How it works', [
        ('Choose what you need', 'Add tyres, servicing or telematics.'),
        ('Track every truck', 'See what each truck needs, in the same portal as your fuel.'),
        ('Stay on the road', 'Sort it before it becomes a breakdown.'),
    ]),
    feats=('What you get', [
        ('Tyres', 'Arranged through TFN.'),
        ('Servicing', 'Every truck’s services on schedule.'),
        ('Telematics', 'By ONE Insurance.'),
        ('Less downtime', 'Know what a truck needs before it stops.'),
        ('One vehicle list', 'Add a vehicle once. Use it everywhere.'),
        ('One account', 'Vehicle support next to your fuel.'),
    ]),
)

# ---------- the TruckersHub product families, in the order the hub shows them ----------
# each product is (label, page key or None when it has no page yet)
FAM = [
    dict(k='treasury', nav='Treasury', name='Treasury', line='Funding that keeps you moving', acc='#a2468e', items=[('Credit products', 'credit'), ('Smart Factoring', None)]),
    dict(k='fueltech', nav='Fuel', name='Fuel & Technology', line='Diesel on the road and in your yard', acc='#2a6fd0', items=[('CRT – Onroad', 'road'), ('EngenXT', 'lcv'), ('TFN – Wholesale', None), ('Homebase management', 'home')]),
    dict(k='cross', nav='Cross Border', name='Cross Border', line='Everything past the border, paid in rand', acc='#6b62c9', items=[('Fuel', 'africa'), ('Tolls and parking', 'africa'), ('Forwarding and clearing', 'africa'), ('Cash', 'africa')]),
    dict(k='risk', nav='Risk', name='Risk management', line='Cover for your trucks and loads', acc='#3f7d4e', items=[('Fines', 'risk'), ('Vehicle insurance', 'risk'), ('GIT insurance', 'risk')]),
    dict(k='fleet', nav='Fleet', name='Fleet management', line='Every vehicle road-legal', acc='#2d7fa3', items=[('Licensing', 'fleet')]),
    dict(k='nonfuel', nav='On the road', name='Onroad non-fuel', line='Looking after drivers on route', acc='#4f6b8a', items=[('Oil', 'nonfuel'), ('Road assist', 'nonfuel'), ('Overnight', 'nonfuel'), ('Truckwash', 'nonfuel')]),
    dict(k='support', nav='Vehicles', name='Vehicle support services', line='Less downtime, longer life', acc='#5c6370', items=[('Tyres', 'support'), ('Servicing', 'support'), ('Telematics', 'support')]),
]

# the businesses behind the products: (name, what they do, families)
PARTNERS = [
    ('ONE Insurance', 'Vehicle and GIT insurance, plus vehicle telematics.', ['risk', 'support']),
    ('IOX', 'Fines management and vehicle licensing.', ['risk', 'fleet']),
    ('TFN', 'Onroad refuelling for CRT vehicles, with truck wash, overnight and oil. Homebase fuel management.', ['fueltech', 'nonfuel']),
    ('EngenXT', 'Light commercial vehicle fuelling across the Engen retail network.', ['fueltech']),
    ('Standard Bank and Absa', 'Fleet fuel facility providers.', ['treasury']),
]
FAMK = {f['k']: f for f in FAM}


def family_of(k):
    return next(f for f in FAM if any(key == k for _, key in f['items']))


def lead(f):
    return P[next(key for _, key in f['items'] if key)]['file']

Q = {'road': ('For the first time I can see one of my biggest expenses, fuel, live, and there are still significant savings from pricing.', 'GF Terre Blanche, Loutrans'), 'nonfuel': ('Book fuel, parking, and that’s it: the whole trip sorted from my app.', 'LJ and G Logistics'), 'network': ('Since then, planning of diesel and routes has been made easy by TFN.', 'AJ Fourie'), 'home': ('We have been working with TFN for over 10 years now and we have had an excellent relationship with them.', 'Cee Vee Transport'), 'africa': ('TFN is essential in keeping the Summerlane trucks on the road.', 'Summerlane Transport'), 'credit': ('TFN has taken our business to a whole other level.', 'GF Terre Blanche, Loutrans')}
F = {'road': [('Do my drivers need cash, a card or a code?', 'No. You place the order or pre-approve the driver. The truck’s registration is matched at the truck stop. TFN Pay checks the location and records a pump photo.'), ('Where can my trucks fill up?', 'At 270+ TFN truck stops across South Africa and on cross-border routes into Namibia, Botswana, Zimbabwe, Zambia and Mozambique.'), ('Can I pay without credit?', 'Yes. Pre-load your TFN account by EFT. TFN is integrated with all major South African banks.'), ('Can the data go into my accounting system?', 'Yes. Export statements to PDF or Excel, or connect TFN to Sage, Xero or your ERP.')], 'lcv': [('When can I sign up?', 'EngenXT is coming soon. Join the waiting list and we’ll tell you when it opens.'), ('Where can drivers fill up?', 'At Engen service stations across South Africa.'), ('Do my drivers need a fuel card?', 'No. Drivers ask for fuel in the app and pay with a QR code at the till.'), ('Can drivers see my rules or my balance?', 'No. Drivers only see whether a request is approved (with the limit) or declined.')], 'nonfuel': [('Which services can I pay for?', 'Oil, road assist, secure overnight parking and truck wash, plus AdBlue, showers, canteen, laundry and shop where the truck stop offers them.'), ('Does my credit facility cover services?', 'Yes. TFN credit covers non-fuel services on the network as well as diesel.'), ('How do I find stops with the services I need?', 'Filter the network map by service before the trip.')], 'network': [('Where do the prices come from?', 'The map shows the current price at each TFN truck stop, with the top 10 prices by region.'), ('Can I send the plan to my driver?', 'Yes. Share the stops by WhatsApp or in the app.'), ('What is the fuel price outlook?', 'A projection of next month’s diesel price, based on the Central Energy Fund’s daily data. It’s indicative until the official adjustment.')], 'home': [('Who is Homebase for?', 'Transporters with their own diesel tank at a yard or depot who also fill up on the road.'), ('How is the Homebase fee worked out?', 'It’s based on your monthly on-road volume tier. Use the calculator for an estimate.'), ('Can I use credit for Homebase?', 'Yes. One credit facility covers deliveries to your tank, gantry collections and on-road fills.')], 'africa': [('Which countries are covered?', 'Namibia, Botswana, Zimbabwe, Zambia and Mozambique, alongside the South African network.'), ('Do I need foreign currency?', 'No. You pay in rand from your South African account.'), ('Does credit work across the border?', 'Yes. TFN credit works at cross-border truck stops.'), ('What else can I add for a cross-border trip?', 'Tolls and parking, forwarding and clearing and cash for the trip, on the same account.')], 'risk': [('Who provides the insurance?', 'ONE Insurance provides vehicle insurance and goods-in-transit (GIT) insurance.'), ('Who manages my fines?', 'IOX manages traffic fines for your vehicles.'), ('Where do I see it?', 'In your TFN portal, next to your fuel and your other TFN products.')], 'fleet': [('Who handles licensing?', 'IOX handles vehicle licensing.'), ('How will I know a licence is due?', 'Licences due within 30 days show up as exceptions in your portal.'), ('Can IOX manage fines as well?', 'Yes. Fines management is part of risk management.')], 'support': [('Who provides telematics?', 'ONE Insurance provides vehicle telematics.'), ('Is it on the same account?', 'Yes. Vehicle support sits next to your fuel and your other TFN products.')], 'credit': [('Who provides the credit?', 'Standard Bank, Absa or Preference Capital. They handle the application and approval.'), ('Who do I repay?', 'Your credit provider, not TFN. TFN supplies the fuel and the reports.'), ('When do I repay?', 'Billing is usually monthly, with 30 days from the statement date. Your provider confirms your terms.'), ('Can I limit what each driver spends?', 'Yes. Set daily, weekly or monthly limits per driver or truck, or approve each order.')]}

ORDER = [key for f in FAM for key in dict.fromkeys(k for _, k in f['items'] if k)]   # product pages, family by family
PAGES = ORDER + ['network']   # the network map is a planning tool, not a product


# ---------- the nav: four top items, each opening a glass panel of grouped plain links (no icons, no cards) ----------
# a panel is (discover label, its link, columns); a column is groups; a group is (heading, [(label, href or None)])
def fam_group(k):
    f = FAMK[k]
    return (f['name'], [(l, P[key]['file'] if key else None) for l, key in f['items']])


MENU = [
    ('products', 'Products', 'tfn-products.html', ('Discover TruckersHub', 'tfn-products.html', [
        [fam_group('treasury'), fam_group('fueltech')],
        [fam_group('cross'), fam_group('risk')],
        [fam_group('fleet'), fam_group('nonfuel')],
        [fam_group('support'), ('Pricing', [('Tiers', 'tfn-tiers.html'), ('Get a fuel quote', 'tfn-page-examples.html#calc')])],
    ])),
    ('network', 'Network', 'tfn-network.html', ('Explore the network', 'tfn-network.html', [
        [('Plan', [('Network map', 'tfn-network.html'), ('Fuel prices', 'tfn-network.html'), ('Fuel price outlook', 'tfn-network.html')])],
        [('At the stop', [('Overnight parking', 'tfn-non-fuel.html'), ('Truckwash', 'tfn-non-fuel.html'), ('Oil and road assist', 'tfn-non-fuel.html')])],
        [('Past the border', [('Cross Border', 'tfn-africa.html'), ('Five countries, paid in rand', 'tfn-africa.html')])],
    ])),
    ('pricing', 'Pricing', 'tfn-tiers.html', ('See the tiers', 'tfn-tiers.html', [
        [('Pay less', [('Tiers', 'tfn-tiers.html'), ('Fuel prices', 'tfn-network.html'), ('Homebase fee calculator', 'tfn-tiers.html#calc')])],
        [('Credit', [('Credit products', 'tfn-credit.html'), ('Choose a credit provider', 'tfn-credit.html')])],
        [('Talk to us', [('Get a fuel quote', 'tfn-page-examples.html#calc')])],
    ])),
    ('company', 'Company', '#', ('About TFN', '#', [
        [('Company', [('About us', '#'), ('Contact us', '#')])],
        [('Help', [('Support', '#'), ('Terms and conditions', '#')])],
        [('Account', [('Log in', '#')])],
    ])),
]


def panel(p):
    disc, href, cols = p
    link = lambda l, h: '<li><a href="%s">%s</a></li>' % (h, l) if h else '<li><span>%s</span></li>' % l
    return '<div class="mp"><a class="mp-d" href="%s">%s <span aria-hidden="true">→</span></a><div class="mp-c">%s</div></div>' % (href, disc, ''.join(
        '<div>%s</div>' % ''.join('<h5>%s</h5><ul>%s</ul>' % (h, ''.join(link(l, x) for l, x in items)) for h, items in col) for col in cols))


BURGER = '<button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="pmenu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'


def pmenu(home=''):
    """The phone menu: a full-screen glass sheet, the four items as pills, each a Discover link and an accordion of its groups."""
    link = lambda l, h: '<li><a href="%s">%s</a></li>' % (h, l) if h else '<li><span>%s</span></li>' % l
    tabs = ''.join('<button type="button" role="tab" aria-selected="%s" data-pm="%d">%s</button>' % ('true' if i == 0 else 'false', i, n) for i, (k, n, h, p) in enumerate(MENU))
    panes = ''.join('<div class="pm-p" data-pm="%d"%s><a class="pm-d" href="%s">%s <span aria-hidden="true">→</span></a>%s</div>' % (
        i, '' if i == 0 else ' hidden', p[1], p[0], ''.join('<details><summary>%s</summary><ul>%s</ul></details>' % (g, ''.join(link(l, x) for l, x in items)) for col in p[2] for g, items in col))
        for i, (k, n, h, p) in enumerate(MENU))
    return ('<div class="pmenu" id="pmenu" role="dialog" aria-modal="true" aria-label="Menu" hidden><div class="pm-top"><a class="pm-brand" href="%stfn-page-examples.html" aria-label="TFN home"><svg aria-hidden="true"><use href="#lockup"/></svg></a>'
            '<button class="pm-x" type="button" aria-label="Close menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>'
            '<div class="pm-tabs" role="tablist" aria-label="Menu sections">%s</div><div class="pm-body">%s</div>'
            '<div class="pm-cta"><a class="pm-login" href="#">Log in</a><a class="pm-quote" href="%stfn-page-examples.html#calc">Get a fuel quote</a></div></div>') % (home, tabs, panes, home)


def nav(current=None):
    top = 'products' if current in ORDER else ('network' if current == 'network' else ('pricing' if current == 'tiers' else None))
    links = ''.join('<div class="mi"><a href="%s"%s aria-haspopup="true">%s</a>%s</div>' % (h, ' aria-current="page"' if k == top else '', n, panel(p)) for k, n, h, p in MENU)
    return ('<header class="nav"><div class="wrap"><a class="brand" href="tfn-page-examples.html" aria-label="TFN home"><svg aria-hidden="true"><use href="#lockup"/></svg></a>'
            '<nav class="links" aria-label="Main">%s</nav><span class="grow"></span><button class="theme" type="button" aria-label="Dark mode" aria-pressed="false"><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><a class="login" href="#">Log in</a><a class="btn" href="tfn-page-examples.html#calc">Get a fuel quote</a>%s</div></header>' % (links, BURGER)) + pmenu()


def chip(label, key):
    return '<li><a href="%s">%s</a></li>' % (P[key]['file'], label) if key else '<li><span>%s</span></li>' % label


def fam_list(fams):
    """The families as an index: one row each, set in type, no cards."""
    row = lambda f: '<li style="--acc:%s"><a class="fn" href="%s"><i aria-hidden="true"></i>%s</a><p>%s</p><ul class="fp">%s</ul><a class="fgo" href="%s" aria-label="Explore %s">→</a></li>' % (
        f['acc'], lead(f), f['name'], f['line'], ''.join(chip(l, key) for l, key in f['items']), lead(f), f['name'])
    return '<ul class="flist">%s</ul>' % ''.join(row(f) for f in fams)


def footer():
    prod = ''.join('<li><a href="%s">%s</a></li>' % (lead(f), f['name']) for f in FAM) + '<li><a href="tfn-network.html">Network</a></li><li><a href="tfn-tiers.html">Tiers</a></li>'
    return ('<footer data-dark><div class="wrap"><div class="cols">'
            '<div><h4>Products</h4><ul><li><a href="tfn-products.html">All products</a></li>%s</ul></div>'
            '<div><h4>Plan and save</h4><ul><li><a href="tfn-network.html#portal">Network map</a></li><li><a href="tfn-network.html">Fuel prices</a></li><li><a href="tfn-page-examples.html#calc">Get a fuel quote</a></li><li><a href="tfn-network.html">Fuel price outlook</a></li></ul></div>'
            '<div><h4>Company</h4><ul><li><a href="#">About TFN</a></li><li><a href="#">Contact us</a></li><li><a href="#">Support</a></li></ul></div>'
            '<div><h4>Account</h4><ul><li><a href="#">Log in</a></li><li><a href="#">Terms and conditions</a></li></ul></div>'
            '</div><svg aria-hidden="true"><use href="#lockup"/></svg><span>TFN, South Africa’s largest independent on-road refuelling service provider, since April 2007. Design concept: screens and figures in the mock-ups are illustrative.</span></div></footer>') % prod


def page(title, desc, body, body_class=''):
    return '''<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s</title>
<meta name="description" content="%s">
<link rel="icon" href="tfn-mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="tfn-products.css">
<link rel="stylesheet" href="tfn-menu.css">
<script>(function(){var t;try{t=localStorage.getItem("tfn-theme")}catch(e){}document.documentElement.dataset.theme=t||"light"})()</script>
</head>
<body%s>
<!-- generated by tools/build-product-pages.py: edit the generator, not this file -->
%s
%s
<script src="tfn-products.js"></script>
<script src="tfn-menu.js"></script>
</body>
</html>
''' % (html.escape(title), html.escape(desc), ' class="%s"' % body_class if body_class else '', LOGO, body)



# ---------- the portal: each product's own interactive view (filled in by tfn-products.js) ----------
SIDE = ['Overview', 'Live map', 'Orders', 'Vehicles', 'Drivers', 'Homebase', 'Credit', 'Reports']
PORTAL = {
 'road': ('TFN Dashboard', 'Every fill, the moment it happens', 'Watch your trucks fill up across the country, with the litres, the truck stop and what you saved, live.', 'Live map',
   '<div class="pf-kpis"><div><small>Fills today</small><b data-k="fills">0</b></div><div><small>Litres today</small><b data-k="litres">0</b></div><div><small>Saved today</small><b class="sp" data-k="saved">R 0</b></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Live map <span>Today</span></h4><div class="mapv" data-map="sa"></div></div><div class="pf-card"><h4>Latest fills <span>Live</span></h4><ul class="feed" data-feed></ul></div></div>', 'live'),
 'lcv': ('Manager portal · coming soon', 'Your rules, checked on every request', 'Try it: set the rules for a bakkie, then see what happens when the driver asks for fuel.', 'Vehicles',
   '<div class="pf-grid"><div class="pf-card"><h4>Rules for CA 482-913 <span>Bakkie</span></h4><div class="ctl">'
   '<div><label>Tank size <b data-o="tank">80 L</b></label><input type="range" data-i="tank" min="40" max="140" step="5" value="80" aria-label="Tank size in litres"></div>'
   '<div><label>Fills a day <b data-o="per">1</b></label><input type="range" data-i="per" min="1" max="3" step="1" value="1" aria-label="Fills allowed a day"></div></div></div>'
   '<div class="pf-card"><h4>The driver asks</h4><div class="ctl">'
   '<div><label>Litres asked for <b data-o="ask">60 L</b></label><input type="range" data-i="ask" min="10" max="160" step="5" value="60" aria-label="Litres the driver asks for"></div>'
   '<div><label>Fills already today <b data-o="done">0</b></label><input type="range" data-i="done" min="0" max="3" step="1" value="0" aria-label="Fills already today"></div></div>'
   '<div class="outcome" data-out="drv" aria-live="polite"><span class="who">The driver sees</span><b></b><small></small></div>'
   '<div class="outcome" data-out="mgr"><span class="who">You see</span><b></b><small></small></div></div></div>', 'rules'),
 'nonfuel': ('TFN Dashboard', 'Plan tonight’s stop', 'Pick where the truck stops tonight and see what’s on offer there. Book it on the same account as the diesel.', 'Orders',
   '<div class="pf-grid"><div class="pf-card"><h4>Tonight’s stop for TFN 204 GP</h4><div class="seg" data-stops role="group" aria-label="Truck stop"></div>'
   '<p class="pfnote" style="font-size:.84rem;margin:16px 0 10px">Services at this stop</p><div class="tog" data-svc role="group" aria-label="Services"></div></div>'
   '<div class="pf-card"><h4>Booked <span data-count>0</span></h4><ul class="feed" data-booked></ul><div class="outcome ok" style="margin-top:12px"><b>On your TFN account</b><small>Paid with the diesel, on one statement</small></div></div></div>', 'stop'),
 'network': ('TFN Dashboard', 'Plan the cheapest route', 'Choose a route and see where to fill up. Set your truck’s consumption to see what the trip saves.', 'Live map',
   '<div class="seg" data-routes role="group" aria-label="Route"></div>'
   '<div class="pf-kpis"><div><small>Distance</small><b data-k="dist">0 km</b></div><div><small>Diesel for the trip</small><b data-k="lit">0 L</b></div><div><small>You save on this trip</small><b class="sp" data-k="save">R 0</b></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Route <span data-k="rname"></span></h4><div class="mapv" data-map="route"></div></div>'
   '<div class="pf-card"><h4>Truck stops on the way <span>Today</span></h4><ul class="feed" data-stoplist></ul><div class="ctl" style="margin-top:14px"><div><label>Consumption <b data-o="cons">35 L/100 km</b></label><input type="range" data-i="cons" min="25" max="50" step="1" value="35" aria-label="Fuel consumption"></div></div></div></div>', 'route'),
 'home': ('TFN Dashboard', 'Your tank, live', 'Record a fill or a delivery and watch the tank. When it runs low, you hear about it first.', 'Homebase',
   '<div class="pf-grid"><div class="pf-card"><h4>Yard tank 1 <span data-k="lvl">12 020 L</span></h4><div class="tank3d" data-tank><div class="top"></div><div class="glass"><div class="liquid"></div></div><div class="marks"><span>20 000</span><span>10 000</span><span>0</span></div></div>'
   '<p class="alert" data-alert style="margin-top:14px">Tank below 25%. Order a delivery.</p>'
   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="pbtn" data-act="fill">Record a fill · 380 L</button><button class="pbtn alt" data-act="del">Delivery · 8 000 L</button></div></div>'
   '<div class="pf-card"><h4>Yard activity <span>Today</span></h4><ul class="feed" data-yard></ul><h4 style="margin-top:16px">This month</h4><div class="bars"><div><span>From your tank <b data-k="yard">62%</b></span><i data-b="yard" style="--v:62%"></i></div><div><span>On the road <b data-k="road">38%</b></span><i data-b="road" style="--v:38%"></i></div></div></div></div>', 'tank'),
 'africa': ('TFN Dashboard', 'One trip, several countries, one currency', 'Pick a corridor and follow the truck. Every fill along the way is paid in rand.', 'Live map',
   '<div class="seg" data-corrs role="group" aria-label="Corridor"></div>'
   '<div class="pf-card"><h4>Corridor <span data-k="cname"></span></h4><div class="corr" data-corr></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Fills on this trip</h4><ul class="feed" data-afeed></ul></div><div class="pf-card"><h4>Paid in</h4><div class="pf-kpis" style="grid-template-columns:1fr"><div><small>Currency</small><b>Rand</b></div><div><small>Total for the trip</small><b class="sp" data-k="atot">R 0</b></div></div></div></div>', 'corridor'),
 'credit': ('TFN Dashboard', 'Credit, with limits you set', 'Share your facility between trucks, drivers and subcontractors. See what’s left before you commit.', 'Credit',
   '<div class="pf-kpis"><div><small>Facility</small><b>R 250 000</b></div><div><small>Allocated</small><b data-k="alloc">R 0</b></div><div><small>Not allocated</small><b class="sp" data-k="free">R 0</b></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Weekly limits</h4><div class="ctl" data-limits></div></div>'
   '<div class="pf-card"><h4>How you repay</h4><div class="tl"><div><b>All month</b>Fuel on credit</div><div><b>1 Nov</b>Statement</div><div><b>1 Dec</b>Repay your bank</div></div>'
   '<div class="bars" style="margin-top:22px"><div><span>Allocated of your facility <b data-k="usedp">0%</b></span><i data-b="used" style="--v:26%"></i></div></div>'
   '<p class="pfnote" style="font-size:.8rem;margin-top:14px">Through Standard Bank, Absa or Preference Capital. Terms are set by your credit provider.</p></div></div>', 'limits'),
 'risk': ('TruckersHub', 'Fines and cover, next to your fuel', 'New fines come in as exceptions to act on. Your cover is listed truck by truck.', 'Risk',
   '<div class="pf-kpis"><div><small>New fines</small><b>2</b></div><div><small>Trucks insured</small><b>38 of 42</b></div><div><small>GIT cover</small><b class="sp">Active</b></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Fines <span>Managed by IOX</span></h4><ul class="feed"><li class="new"><i></i><span><b>TFN 204 GP</b><small>Speeding · N3 Harrismith</small></span><b>New</b></li><li class="new"><i></i><span><b>TFN 311 GP</b><small>Parking · Durban port</small></span><b>New</b></li><li><i></i><span><b>TFN 118 GP</b><small>Speeding · N1 Polokwane</small></span><b>Paid</b></li></ul></div>'
   '<div class="pf-card"><h4>Cover <span>ONE Insurance</span></h4><ul class="feed"><li><i></i><span><b>Vehicle insurance</b><small>38 trucks</small></span><b>Active</b></li><li><i></i><span><b>GIT insurance</b><small>Goods in transit</small></span><b>Active</b></li><li class="new"><i></i><span><b>4 trucks</b><small>Not insured yet</small></span><b>Add</b></li></ul></div></div>', ''),
 'fleet': ('TruckersHub', 'Every licence, before it’s due', 'Licences due within 30 days come in as exceptions. IOX handles the renewal.', 'Licensing',
   '<div class="pf-kpis"><div><small>Due in 30 days</small><b>3</b></div><div><small>Vehicles</small><b>42</b></div><div><small>Road-legal</small><b class="sp">39</b></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Licences due <span>Next 30 days</span></h4><ul class="feed"><li class="new"><i></i><span><b>TFN 204 GP</b><small>Licence disc</small></span><b>12 days</b></li><li class="new"><i></i><span><b>TFN 311 GP</b><small>Licence disc</small></span><b>21 days</b></li><li class="new"><i></i><span><b>TFN 118 GP</b><small>Licence disc</small></span><b>28 days</b></li></ul></div>'
   '<div class="pf-card"><h4>Recently renewed <span>By IOX</span></h4><ul class="feed"><li><i></i><span><b>TFN 402 GP</b><small>Renewed 14 Oct</small></span><b>Done</b></li><li><i></i><span><b>TFN 077 GP</b><small>Renewed 9 Oct</small></span><b>Done</b></li></ul></div></div>', ''),
 'support': ('TruckersHub', 'What each truck needs next', 'Tyres, services and telematics, truck by truck, in the same portal as your fuel.', 'Vehicles',
   '<div class="pf-kpis"><div><small>Services due</small><b>5</b></div><div><small>Tyre checks due</small><b>3</b></div><div><small>Telematics live</small><b class="sp">38 of 42</b></div></div>'
   '<div class="pf-grid"><div class="pf-card"><h4>Coming up <span>This month</span></h4><ul class="feed"><li class="new"><i></i><span><b>TFN 311 GP</b><small>Service in 4 200 km</small></span><b>Book</b></li><li class="new"><i></i><span><b>TFN 204 GP</b><small>Steer tyres to check</small></span><b>Book</b></li><li><i></i><span><b>TFN 118 GP</b><small>Service in 9 800 km</small></span><b>Later</b></li></ul></div>'
   '<div class="pf-card"><h4>Telematics <span>ONE Insurance</span></h4><ul class="feed"><li><i></i><span><b>38 trucks</b><small>Reporting live</small></span><b>Live</b></li><li class="new"><i></i><span><b>4 trucks</b><small>Not fitted yet</small></span><b>Add</b></li></ul></div></div>', ''),
}
SIDES = {'lcv': ['Overview', 'Vehicles', 'Drivers', 'Rules', 'Wallet', 'Reports'], 'risk': ['Overview', 'Vehicles', 'Drivers', 'Risk', 'Fleet', 'Reports'],
         'fleet': ['Overview', 'Vehicles', 'Drivers', 'Licensing', 'Risk', 'Reports'], 'support': ['Overview', 'Vehicles', 'Drivers', 'Support', 'Reports']}


def portal(k):
    kick, title, sub, on, body, mod = PORTAL[k]
    side = ''.join('<span%s>%s</span>' % (' class="on"' if x == on else '', x) for x in SIDES.get(k, SIDE))
    if k == 'lcv' and on == 'Vehicles':
        side = side.replace('<span class="on">Vehicles</span>', '<span>Vehicles</span>').replace('<span>Rules</span>', '<span class="on">Rules</span>')
    return ('<section class="psec" id="portal" style="--acc:%s"><div class="wrap"><p class="kicker">%s</p><h2>%s</h2><p class="sub">%s</p>'
            '<div class="pf" data-mod="%s"><div class="pf-bar" aria-hidden="true"><i></i><i></i><i></i><span>app.tfn.co.za</span></div><div class="pf-body"><nav class="pf-side" aria-hidden="true"><svg><use href="#logo"/></svg>%s</nav><div class="pf-main">%s</div></div></div></div></section>') % (
            P[k]['acc'], kick, title, sub, mod, side, body)

SH = '<div class="sh"><svg aria-hidden="true"><use href="#logo"/></svg><i></i></div>'


def wash(hexc, a=.12):
    h = hexc.lstrip('#'); return 'rgba(%d,%d,%d,%s)' % (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def crumb(k):
    if k not in ORDER:
        return P[k]['name']
    f = family_of(k)
    return f['name'] if f['name'] == P[k]['name'] else '<a href="%s">%s</a> / %s' % (lead(f), f['name'], P[k]['name'])


def product_page(k):
    p = P[k]
    dark = False
    dk = ' dk' if dark else ''
    data_dark = ' data-dark' if dark else ''
    soon = ' <span class="soon">Coming soon</span>' if p.get('soon') else ''
    stats = '<div class="stats">%s</div>' % ''.join('<div><b>%s</b><span>%s</span></div>' % s for s in p['stats']) if p.get('stats') else ''
    chips = '<div class="chiprow">%s</div>' % ''.join('<span>%s</span>' % c for c in p['chips']) if p.get('chips') else ''
    btn = 'btn light' if dark else 'btn'
    hero = '''<section class="pp%s" id="hero" data-p="%s" style="--wash:%s"%s><div class="wrap"><div>
<p class="crumb"><a href="tfn-products.html">Products</a> / %s</p>
<p class="kicker">%s%s</p><h1>%s</h1><p class="sub">%s</p><a class="%s" href="%s">%s</a><a class="tlink" href="#portal">See it in the portal</a>%s%s</div>
<div class="stage" aria-hidden="true">%s<div class="ph %s float"><div class="s">%s%s</div></div>%s</div></div></section>''' % (
        dk, k, wash(p['acc']), data_dark, crumb(k), p['kicker'], soon, p['title'], p['sub'], btn, p['cta'][1], p['cta'][0], stats, chips,
        p.get('stage_before', ''), p['finish'], SH, p['screen'], p.get('extra', ''))
    how = '<section class="band grey" id="how"%s><div class="wrap"><h2>%s</h2><div class="steps3" style="--acc:%s;--accink:%s">%s</div></div></section>' % (
        data_dark, p['how'][0], p['acc'], p.get('accink', '#fff'), ''.join('<div><h3>%s</h3><p>%s</p></div>' % s for s in p['how'][1]))
    feats = '<section class="band"%s><div class="wrap"><h2>%s</h2><div class="feats">%s</div></div></section>' % (
        data_dark, p['feats'][0], ''.join('<div><h3>%s</h3><p>%s</p></div>' % f for f in p['feats'][1]))
    mine = family_of(k) if k in ORDER else None
    more = '<section class="band grey more"%s><div class="wrap"><h2>More from TFN</h2><p class="sub">One TFN account for all of it. Coming together in TruckersHub.</p>%s</div></section>' % (
        data_dark, fam_list([f for f in FAM if f is not mine]))
    close = '<section class="close"%s><div class="wrap"><h2>%s</h2><p class="sub">%s</p><a class="%s" href="%s">%s</a></div></section>' % (
        data_dark, 'Be first in line for EngenXT' if p.get('soon') else 'See what you’d save',
        'Leave your details and we’ll tell you when EngenXT opens.' if p.get('soon') else 'Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will send you a comparison within 48 hours.', btn,
        p['cta'][1] if p.get('soon') else 'tfn-page-examples.html#calc', p['cta'][0] if p.get('soon') else 'Get a fuel quote')
    quote = '<section class="band quote"><div class="wrap"><blockquote>“%s”</blockquote><cite>%s</cite></div></section>' % Q[k] if k in Q else ''
    faq = '<section class="band faq"><div class="wrap"><h2>Questions</h2><div class="faqs">%s</div></div></section>' % ''.join('<details><summary>%s</summary><p>%s</p></details>' % qa for qa in F[k])
    body = nav(k) + '\n<main>\n' + '\n'.join([hero, portal(k), how, feats, quote, faq, more, close]) + '\n</main>\n' + footer()
    return page('TFN %s | %s' % (p['name'], p['title']), p['sub'], body, 'dark-page' if dark else '')


# ---------- the products page: one family per full-width screen, a headline, one line, one button and the phone ----------
# (headline, one line, background: 'white' / 'black' / a photo, the screens to switch between)
HX = {
    'treasury': ('Fuel now. Pay later.', 'Credit facilities through Standard Bank and Absa keep your trucks moving. Settle with your bank each month.', 'black', ['credit']),
    'fueltech': ('Diesel, wherever the truck is', 'At 270+ truck stops, at Engen for your bakkies and in your own yard. Every litre lands in one dashboard.', 'white', ['road', 'lcv', 'home']),
    'cross': ('Past the border. Still in rand.', 'Fuel in five countries, tolls and parking, forwarding and clearing and cash for the trip. All on your South African account.', 'img/k-namibia.jpg', ['africa']),
    'risk': ('Covered, on every load', 'Vehicle and goods-in-transit insurance through ONE Insurance. Traffic fines handled by IOX.', 'white', ['risk']),
    'fleet': ('Road-legal, every day', 'IOX renews your licences. You see what’s due 30 days before it runs out.', 'black', ['fleet']),
    'nonfuel': ('Looked after on the road', 'Oil, road assist, safe overnight parking and a truck wash. Paid with the diesel.', 'img/k-night-truck.jpg', ['nonfuel']),
    'support': ('Less downtime. Longer life.', 'Tyres, servicing and telematics for every truck, on one account.', 'white', ['support']),
}

HOME_SCREEN = '<span class="t">Wednesday, 21 October</span><span class="h">Good morning, Thabo</span><div class="card"><span class="t">Available credit</span><div class="big">R 540 000</div><div class="bar" style="--v:18%;margin-top:.5em"><i></i></div></div><div class="card">' + ''.join(
    '<div class="row"><i style="background:%s"></i><span><b>%s</b><small>%s</small></span></div>' % (f['acc'], f['name'], f['line']) for f in FAM[:5]) + '</div>'


def hx(f):
    head, line, bg, keys = HX[f['k']]
    photo = bg.startswith('img/')
    tone = 'black' if photo else bg
    phones = ''.join('<div class="ph %s%s" data-scene="%d"%s><div class="s">%s%s</div></div>' % (P[k]['finish'], ' on' if i == 0 else '', i, '' if i == 0 else ' aria-hidden="true"', SH, P[k]['screen']) for i, k in enumerate(keys))
    if len(keys) > 1:
        rest = [l for l, key in f['items'] if key is None]
        pick = '<div class="hx-pick" role="tablist" aria-label="%s products">%s</div>%s' % (f['name'], ''.join(
            '<button type="button" role="tab" aria-selected="%s" data-scene="%d">%s</button>' % ('true' if i == 0 else 'false', i, next(l for l, key in f['items'] if key == k)) for i, k in enumerate(keys)),
            '<p class="hx-also">Also %s</p>' % ' and '.join(rest) if rest else '')
    else:
        pick = '<p class="hx-also">%s</p>' % ' · '.join(l for l, key in f['items'])
    return ('<section class="hx hx-%s%s" id="%s" style="--acc:%s%s"%s><div class="wrap"><p class="hx-k"><i aria-hidden="true"></i>%s</p><h2>%s</h2><p class="sub">%s</p>'
            '<a class="btn%s" href="%s">Explore %s</a>%s</div><div class="hx-stage"><div class="hx-orb" aria-hidden="true"></div>%s</div></section>') % (
        tone, ' hx-photo' if photo else '', f['k'], f['acc'], ';--photo:url(%s)' % bg if photo else '', ' data-dark' if tone == 'black' else '',
        f['name'], head, line, ' light' if tone == 'black' else '', lead(f), f['name'], pick, phones)


def hub():
    hero = ('<section class="hx hx-black hx-photo hx-hero" data-dark style="--photo:url(img/close-highway.jpg);--acc:#3d68c0"><div class="wrap"><p class="hx-k">TruckersHub <span class="soon">Coming soon</span></p>'
            '<h1>Finally, everything in one place</h1><p class="sub">Seven product families. One TFN account. One app for your drivers, one portal for your office.</p>'
            '<a class="btn light" href="tfn-page-examples.html#calc">Get a fuel quote</a></div>'
            '<div class="hx-stage"><div class="ph p-hub on"><div class="s">%s%s</div></div></div></section>') % (SH, HOME_SCREEN)
    fams = ''.join(hx(f) for f in FAM)
    partners = '<section class="hx-partners" data-dark><div class="wrap"><p class="hx-k">Built with partners you know</p><ul>%s</ul></div></section>' % ''.join(
        '<li><b>%s</b><span>%s</span></li>' % (n, d) for n, d, fs in PARTNERS)
    apps = ('<section class="hx-apps" data-dark><div class="wrap"><h2>Two apps. One hub.</h2><p class="sub">Your drivers get one app. Your office gets one portal. Set up your company, people and vehicles once, for every product.</p>'
            '<div class="hx-cards"><a href="tfn-on-road.html"><b>Driver app</b><span>Orders, fuel requests, fills and tonight’s stop. Only what the job needs.</span><i aria-hidden="true">→</i></a>'
            '<a href="tfn-tiers.html"><b>Fleet manager portal</b><span>People, vehicles, rules, wallet, approvals and every transaction. Plus your tier.</span><i aria-hidden="true">→</i></a></div></div></section>')
    close = '<section class="close"><div class="wrap"><h2>Join the transporters fuelling 44M+ litres a month</h2><p class="sub">Tell us what you paid for diesel last time and how much you use. We’ll show you what you’d save within 48 hours.</p><a class="btn" href="tfn-page-examples.html#calc">Get a fuel quote</a></div></section>'
    body = nav() + '\n<main>\n' + hero + fams + partners + apps + close + '\n</main>\n' + footer()
    names = ', '.join(f['name'] for f in FAM[:-1]) + ' and ' + FAM[-1]['name']
    return page('TFN | Products and TruckersHub', 'TFN products in seven families: %s. TruckersHub, coming soon, brings them into one driver app and one fleet manager portal.' % names, body, 'hub')


# ---------- tiers: TFN's own volume ladder from tfn.co.za/price-list (monthly on-road litres, discount per litre) ----------
TIERS = [
    ('bronze', 'Bronze', 0, 10000, 0),
    ('silver', 'Silver', 10000, 30000, 2),
    ('gold', 'Gold', 30000, 50000, 4),
    ('diamond', 'Diamond', 50000, 150000, 6),
    ('platinum', 'Platinum', 150000, None, 8),
]


def badge(key, name, extra=''):
    return '<div class="badge t-%s"%s><svg aria-hidden="true"><use href="#logo"/></svg><b>%s</b></div>' % (key, extra, name)


def litres(lo, hi):
    f = lambda n: '{:,}'.format(n).replace(',', ' ')
    return 'Under %s L' % f(hi) if lo == 0 else ('%s L and up' % f(lo) if hi is None else '%s to %s L' % (f(lo), f(hi)))


def tiers_page():
    fan = ''.join(badge(k, n, ' style="--i:%d;--r:%ddeg"' % (min(i, 4 - i), (i - 2) * 7)) for i, (k, n, lo, hi, d) in enumerate(TIERS))
    hero = """<section class="tiers-hero" data-dark><div class="wrap">
<p class="kicker" style="justify-content:center;color:#a8a8a8">TFN tiers</p>
<h1>The more you fuel, the less you pay</h1>
<p class="sub">Every TFN account has a tier, set by how much diesel your trucks buy on the road each month. Move up a tier and every litre costs less.</p>
<a class="btn light" href="#calc">Find my tier</a>
<div class="fan" aria-hidden="true">%s</div></div></section>""" % fan
    ladder = ''.join('<div>%s<h3>%s</h3><span class="lit">%s a month</span><span class="disc">%s<small>%s</small></span></div>' % (
        badge(k, n), n, litres(lo, hi), ('%dc off' % d) if d else 'Network price', 'every litre of diesel' if d else 'below the grid price')
        for k, n, lo, hi, d in TIERS)
    steps = """<section class="band"><div class="wrap"><h2>Five tiers, the same app</h2><p class="sub">Everyone gets the same TFN app and the same network. Your tier changes what you pay, not how it works.</p>
<div class="ladder">%s</div>
<p class="fine">Tiers are based on your monthly on-road diesel volume across your whole account. Your Homebase fee is also set by your on-road tier. Prices and discounts are indicative; final pricing may vary by depot, grid zone and account.</p></div></section>""" % ladder
    calc = """<section class="band grey" id="calc"><div class="wrap"><h2>What tier would you be?</h2><p class="sub">Slide to your monthly on-road diesel.</p>
<div class="calc2" data-tiers='%s'>
<div><label for="tlit">Litres a month</label><output id="tout" for="tlit">40 000 L</output><input type="range" id="tlit" min="0" max="200000" step="1000" value="40000"></div>
<div class="res" aria-live="polite"><div id="tbadge">%s</div><dl><dt>Tier</dt><dd id="tname">Gold</dd><dt>Off every litre</dt><dd id="tdisc">4c</dd><dt>Saving a month</dt><dd id="tsave">R 1 600</dd><dt>To the next tier</dt><dd id="tnext">10 000 L to Diamond</dd></dl></div>
</div></div></section>""" % (html.escape(__import__('json').dumps([[k, n, lo, hi, d] for k, n, lo, hi, d in TIERS])), badge('gold', 'Gold'))
    portal = """<section class="band" data-dark style="background:#000;color:#fff"><div class="wrap"><p class="kicker" style="color:#a8a8a8">Fleet manager portal <span class="soon">Coming soon</span></p><h2>Your tier, always in view</h2><p class="sub" style="color:#a8a8a8">See your tier, how far you are from the next one and what it’s saving you in the TruckersHub fleet manager portal.</p>
<div class="portal" aria-hidden="true"><aside><svg><use href="#logo"/></svg><span>Overview</span><span>Orders</span><span>Vehicles</span><span>Drivers</span><span class="on">Your tier</span><span>Reports</span></aside>
<main><div class="card"><h4>Your tier this month</h4><div class="stat">%s<div><div class="big">41 600 L</div><small>on-road diesel so far</small></div></div><div class="bar" style="--v:58%%"><i></i></div><small>8 400 L to Diamond</small></div>
<div class="card"><h4>What Gold gets you</h4><ul><li><span>Off every litre</span><b>4c</b></li><li><span>Saved this month</span><b>R 1 664</b></li><li><span>Homebase fee</span><b>Gold rate</b></li><li><span>Next tier</span><b>Diamond, 6c</b></li></ul></div></main></div></div></section>""" % badge('gold', 'Gold')
    close = '<section class="close"><div class="wrap"><h2>See what your tier would save</h2><p class="sub">Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will send you a comparison within 48 hours.</p><a class="btn" href="tfn-page-examples.html#calc">Get a fuel quote</a></div></section>'
    body = nav('tiers') + '\n<main>\n' + hero + steps + calc + portal + close + '\n</main>\n' + footer()
    return page('TFN tiers | The more you fuel, the less you pay', 'TFN tiers: Bronze, Silver, Gold, Diamond and Platinum, set by monthly on-road diesel volume. Move up a tier and every litre costs less.', body)


if __name__ == '__main__':
    (ROOT / 'tfn-tiers.html').write_text(tiers_page())
    (ROOT / 'tfn-products.html').write_text(hub())
    for k in PAGES:
        (ROOT / P[k]['file']).write_text(product_page(k))
    print('wrote tfn-products.html and', len(PAGES), 'product pages')
