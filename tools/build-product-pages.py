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
    sub='You order the fuel and your driver fills up at a TFN truck stop. The fill appears in your dashboard straight away, with the litres, the price and a photo from the pump.',
    cta=('Get a fuel quote', 'tfn-page-examples.html#f'),
    stats=[('270+', 'truck stops'), ('168K+', 'transactions a month'), ('44M+', 'litres a month')],
    screen='''<span class="t">Order</span><span class="h">TFN 204 GP</span>
<div class="card"><div class="row"><i></i><span><b>Diesel</b><small>TFN truck stop, N3</small></span><span><b>420 L</b><small>R 20.19/L</small></span></div></div>
<div class="photo"><span>Pump photo</span></div>
<div class="card"><div class="row"><span class="ok">Location checked</span></div><div class="row"><span class="ok">Truck matched</span></div><div class="row"><span><b>Driver</b><small>Sipho K.</small></span><span><b>09:41</b></span></div></div>
<div class="cta">Fill recorded</div>''',
    extra='<div class="gl g1"><i style="background:#2a6fd0"></i><div><b>In your dashboard</b><small>09:41 · TFN 204 GP</small></div></div><div class="gl g2"><div><b>No cards or codes</b><small>No slips to chase</small></div></div>',
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
    file='tfn-lcv.html', name='LCV', kicker='TFN LCV', soon=True, finish='p-lcv', acc='#0e8fb3', tier='For bakkies and vans · Coming soon',
    blurb='Fuel for bakkies and vans, without a fuel card.',
    title='Fuel for bakkies and vans, without the card',
    sub='Set the rules for each driver and vehicle. Drivers ask for fuel in the app. Every request is checked against your rules before the pump starts. Then they pay with a QR code at the till.',
    cta=('Join the waiting list', 'tfn-page-examples.html#f'),
    chips=['Rules per driver', 'Rules per vehicle', 'Prepaid wallet', 'Daily reports'],
    screen='''<span class="t">Fuel request</span><span class="h">CA 482-913</span>
<div class="card"><div class="row"><span><b>Approved</b><small>Diesel 50</small></span><span><b>Up to 60 L</b></span></div></div>
<div class="qr"></div><span class="t" style="text-align:center">Show this at the till</span>
<div class="cta">Done</div>''',
    extra='<div class="gl g1"><i style="background:#0e8fb3"></i><div><b>Checked before it’s paid</b><small>Against your rules</small></div></div>',
    how=('How it works', [
        ('Set the rules', 'Add your vehicles and drivers. Link each driver to a vehicle. Then decide how much fuel each one can buy and how often.'),
        ('The driver asks for fuel', 'In the app, before filling up. The request is checked against your rules and comes back approved, with a limit, or declined.'),
        ('Pay at the till', 'The driver shows a QR code at the till. The money comes from your prepaid wallet. The purchase is in your report that day.'),
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
    file='tfn-non-fuel.html', name='Non-Fuel', kicker='TFN Non-Fuel', finish='p-nonfuel', acc='#4f6b8a', tier='On the road',
    blurb='Parking, showers, truck washes and AdBlue on the same account.',
    title='Everything else at the stop, sorted',
    sub='Secure overnight parking, a shower, a truck wash or AdBlue. Book it for your driver and pay from the same account as the diesel.',
    cta=('See the services on the map', 'tfn-network.html'),
    chips=['AdBlue', 'Overnight', 'Shower', 'Canteen', 'Laundry', 'Truck wash'],
    screen='''<span class="t">Tonight</span><span class="h">Your stop is booked</span>
<div class="card">
<div class="row"><i></i><span><b>Overnight parking</b><small>Secure, 1 night</small></span><span>✓</span></div>
<div class="row"><i style="opacity:.75"></i><span><b>Shower</b><small>From 19:00</small></span><span>✓</span></div>
<div class="row"><i style="opacity:.55"></i><span><b>Truck wash</b><small>Before you leave</small></span><span>✓</span></div>
<div class="row"><i style="opacity:.4"></i><span><b>AdBlue</b><small>40 L</small></span><span>✓</span></div>
</div><div class="cta">Paid from your TFN account</div>''',
    how=('How it works', [
        ('Find the stop', 'Filter the network map by service: AdBlue, overnight parking, showers, canteen, laundry, truck wash or shop.'),
        ('Book it for your driver', 'Book parking and services along with the fuel, so the whole trip is sorted before the truck leaves.'),
        ('One statement', 'Services are paid from your TFN account, cash or credit. They’re listed next to the diesel.'),
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
    file='tfn-network.html', name='Network', kicker='TFN Network', dark=True, finish='p-net', acc='#3346a8', tier='Planning',
    blurb='Find the best diesel price on your route before you leave.',
    title='The cheapest diesel on your route',
    sub='See today’s prices at every TFN truck stop. Plan where to fill up before the truck leaves, then send the stops to your driver.',
    cta=('Open the network map', 'https://tfn.co.za/tfn-network-map/'),
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
    file='tfn-homebase.html', name='Homebase', kicker='TFN Homebase', dark=True, finish='p-home', acc='#138a85', tier='In your yard',
    blurb='Diesel in your own yard, recorded with the rest.',
    title='Your own tank, on the same account',
    sub='TFN delivers diesel to the tank in your yard and records every fill against the truck and driver, next to the fuel bought on the road.',
    cta=('Work out my Homebase fee', 'https://tfn.co.za/homebase-calculator/'),
    screen='''<span class="t">Homebase</span><span class="h">Yard tank 1</span>
<div class="card"><span class="t">In the tank</span><div class="big">12,020 L</div><div class="bar" style="--v:60%;margin-top:.5em"><i></i></div></div>
<div class="card"><div class="row"><i></i><span><b>TFN 311 GP</b><small>Driver: Thabo M.</small></span><span><b>380 L</b><small>07:12</small></span></div><div class="row"><i style="opacity:.5"></i><span><b>Delivery</b><small>From TFN</small></span><span><b>+8,000 L</b><small>Mon</small></span></div></div>
<div class="card"><div class="row"><span><b>From your tank</b><small>this month</small></span><span><b>62%</b></span></div><div class="row"><span><b>On the road</b><small>this month</small></span><span><b>38%</b></span></div></div>''',
    how=('How Homebase works', [
        ('TFN delivers to your yard', 'Order diesel for your own tank through the TFN Dashboard, on cash or credit.'),
        ('Every fill is recorded', 'Each fill from your tank is logged against the truck, the driver and the litres. Only drivers you allow can draw fuel.'),
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
    file='tfn-africa.html', name='TFN Africa', kicker='TFN Africa', dark=True, finish='p-africa', acc='#6b62c9', tier='Cross-border',
    blurb='Refuel in five neighbouring countries, paid in rand.',
    title='Across the border, still in rand',
    sub='Refuel at TFN truck stops in Namibia, Botswana, Zimbabwe, Zambia and Mozambique on your South African account. See it all in one report.',
    cta=('Plan a cross-border route', 'https://tfn.co.za/tfn-africa/'),
    screen='''<span class="t">Cross-border</span><span class="h">Joburg → Lusaka</span>
<div class="card"><div class="row"><i></i><span><b>South Africa</b><small>Fill up before the border</small></span><span><b>420 L</b></span></div><div class="row"><i style="opacity:.6"></i><span><b>Botswana</b><small>TFN Africa</small></span><span><b>260 L</b></span></div><div class="row"><i style="opacity:.4"></i><span><b>Zambia</b><small>TFN Africa</small></span><span><b>310 L</b></span></div></div>
<div class="card"><span class="t">Paid in</span><div class="big">Rand</div><span class="ok">One account, one currency</span></div>
<div class="cta">Plan the route</div>''',
    extra='<div class="gl g2"><div><b>Border permits and tolls</b><small>Coming soon</small></div></div>',
    stage_before='<div class="photo-card" style="background-image:url(img/plan-africa.jpg)"></div>',
    how=('How cross-border works', [
        ('Plan the route', 'See TFN truck stops along your corridor and where to fill up in South Africa before the border.'),
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
    file='tfn-credit.html', name='Credit', kicker='TFN Credit', dark=True, finish='p-credit', acc='#a2468e', tier='Finance',
    blurb='Fuel now and pay your bank later.',
    title='Fuel now, pay your bank later',
    sub='Get a fuel credit facility through Standard Bank, Absa or Preference Capital. Your bank pays TFN and you repay your bank monthly. You set spending limits per driver and truck.',
    cta=('Choose a credit provider', 'https://tfn.co.za/select-a-credit-provider/'),
    chips=['Standard Bank', 'Absa', 'Preference Capital'],
    screen='''<span class="t">Credit</span><span class="h">Credit available</span><div class="big">R 184,200</div><div class="bar" style="--v:42%"><i></i></div>
<div class="card"><div class="row"><i></i><span><b>TFN 204 GP</b><small>Weekly limit</small></span><span><b>R 25,000</b></span></div><div class="row"><i style="opacity:.6"></i><span><b>Sipho K.</b><small>Daily limit</small></span><span><b>R 6,000</b></span></div></div>
<div class="card"><div class="row"><span><b>Statement</b><small>Monthly</small></span><span class="ok">Ready</span></div></div>
<div class="cta">Download statement</div>''',
    how=('How TFN credit works', [
        ('Apply through your bank', 'Choose Standard Bank, Absa or Preference Capital. They handle the application. Once you’re approved, your limit shows in your dashboard.'),
        ('Fuel anywhere on the network', 'Use it at every TFN truck stop, at cross-border stops, for non-fuel services and for Homebase deliveries.'),
        ('Repay your bank', 'You get a monthly statement and repay your credit provider, usually within 30 days. TFN supplies the fuel and the reports.'),
    ]),
    feats=('What you get', [
        ('Keep cash in the business', 'Your trucks keep moving while you settle later.'),
        ('Limits per driver and truck', 'Daily, weekly or monthly limits, plus orders you approve.'),
        ('Credit for subcontractors', 'Share your limit with subcontractors and get one consolidated invoice.'),
        ('Statements that match', 'Export reports to check against your bank’s monthly statement.'),
        ('Fuel and more', 'Covers diesel, overnight parking, truck washes and other services on the network.'),
        ('Across the border', 'Works at TFN Africa truck stops too.'),
    ]),
)

LATER = [
    ('Insurance', 'Cover for your trucks, through TFN.', 'p-ins'),
]
Q = {'road': ('For the first time I can see one of my biggest expenses, fuel, live, and there are still significant savings from pricing.', 'GF Terre Blanche, Loutrans'), 'nonfuel': ('Book fuel, parking, and that’s it: the whole trip sorted from my app.', 'LJ and G Logistics'), 'network': ('Since then, planning of diesel and routes has been made easy by TFN.', 'AJ Fourie'), 'home': ('We have been working with TFN for over 10 years now and we have had an excellent relationship with them.', 'Cee Vee Transport'), 'africa': ('TFN is essential in keeping the Summerlane trucks on the road.', 'Summerlane Transport'), 'credit': ('TFN has taken our business to a whole other level.', 'GF Terre Blanche, Loutrans')}
F = {'road': [('Do my drivers need cash, a card or a code?', 'No. You place the order or pre-approve the driver. The truck’s registration is matched at the truck stop. TFN Pay checks the location and records a pump photo.'), ('Where can my trucks fill up?', 'At 270+ TFN truck stops across South Africa and on cross-border routes into Namibia, Botswana, Zimbabwe, Zambia and Mozambique.'), ('Can I pay without credit?', 'Yes. Pre-load your TFN account by EFT. TFN is integrated with all major South African banks.'), ('Can the data go into my accounting system?', 'Yes. Export statements to PDF or Excel, or connect TFN to Sage, Xero or your ERP.')], 'lcv': [('When can I sign up?', 'LCV is coming soon. Join the waiting list and we’ll tell you when it opens.'), ('Do my drivers need a fuel card?', 'No. Drivers ask for fuel in the app and pay with a QR code at the till.'), ('Can drivers see my rules or my balance?', 'No. Drivers only see whether a request is approved (with the limit) or declined.')], 'nonfuel': [('Which services can I pay for?', 'AdBlue, secure overnight parking, showers, canteen, laundry, truck wash and shop, where the truck stop offers them.'), ('Does my credit facility cover services?', 'Yes. TFN credit covers non-fuel services on the network as well as diesel.'), ('How do I find stops with the services I need?', 'Filter the network map by service before the trip.')], 'network': [('Where do the prices come from?', 'The map shows the current price at each TFN truck stop, with the top 10 prices by region.'), ('Can I send the plan to my driver?', 'Yes. Share the stops by WhatsApp or in the app.'), ('What is the fuel price outlook?', 'A projection of next month’s diesel price, based on the Central Energy Fund’s daily data. It’s indicative until the official adjustment.')], 'home': [('Who is Homebase for?', 'Transporters with their own diesel tank at a yard or depot who also fill up on the road.'), ('How is the Homebase fee worked out?', 'It’s based on your monthly on-road volume tier. Use the calculator for an estimate.'), ('Can I use credit for Homebase?', 'Yes. One credit facility covers deliveries to your tank, gantry collections and on-road fills.')], 'africa': [('Which countries are covered?', 'Namibia, Botswana, Zimbabwe, Zambia and Mozambique, alongside the South African network.'), ('Do I need foreign currency?', 'No. You pay in rand from your South African account.'), ('Does credit work across the border?', 'Yes. TFN credit works at cross-border truck stops.')], 'credit': [('Who provides the credit?', 'Standard Bank, Absa or Preference Capital. They handle the application and approval.'), ('Who do I repay?', 'Your credit provider, not TFN. TFN supplies the fuel and the reports.'), ('When do I repay?', 'Billing is usually monthly, with 30 days from the statement date. Your provider confirms your terms.'), ('Can I limit what each driver spends?', 'Yes. Set daily, weekly or monthly limits per driver or truck, or approve each order.')]}

ORDER = ['road', 'lcv', 'nonfuel', 'network', 'home', 'africa', 'credit']


def nav(current=None):
    links = ''.join('<a href="%s"%s>%s</a>' % (P[k]['file'], ' aria-current="page"' if k == current else '', P[k]['name']) for k in ORDER)
    links += '<a href="tfn-tiers.html"%s>Tiers</a>' % (' aria-current="page"' if current == 'tiers' else '')
    return ('<header class="nav"><div class="wrap"><a class="brand" href="tfn-page-examples.html" aria-label="TFN home"><svg aria-hidden="true"><use href="#logo"/></svg></a>'
            '<nav class="links" aria-label="Products">%s</nav><span class="grow"></span><button class="theme" type="button" aria-label="Dark mode" aria-pressed="false"><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><a class="btn" href="tfn-page-examples.html#f">Get a fuel quote</a></div></header>' % links)


def tile(k):
    p = P[k]
    return '<a class="tile" href="%s"><div><h3>%s</h3><p>%s</p><span class="tier">%s</span></div><div class="ph %s"><div class="s">%s%s</div></div></a>' % (
        p['file'], p['name'], p['blurb'], p['tier'], p['finish'], SH, p['screen'])


def later_tiles():
    return ''.join('<div class="tile later"><div><h3>%s</h3><p>%s</p><span class="tier">Coming soon</span></div><div class="ph %s"><div class="s"><span class="t">%s</span><span class="h">Coming soon</span></div></div></div>' % (n, d, f, n) for n, d, f in LATER)


def footer():
    prod = ''.join('<li><a href="%s">%s</a></li>' % (P[k]['file'], P[k]['name']) for k in ORDER) + '<li><a href="tfn-tiers.html">Tiers</a></li>'
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
<script>(function(){var t;try{t=localStorage.getItem("tfn-theme")}catch(e){}document.documentElement.dataset.theme=t||"light"})()</script>
</head>
<body%s>
<!-- generated by tools/build-product-pages.py: edit the generator, not this file -->
%s
%s
<script src="tfn-products.js"></script>
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
}


def portal(k):
    kick, title, sub, on, body, mod = PORTAL[k]
    side = ''.join('<span%s>%s</span>' % (' class="on"' if x == on else '', x) for x in (['Overview', 'Vehicles', 'Drivers', 'Rules', 'Wallet', 'Reports'] if k == 'lcv' else SIDE))
    if k == 'lcv' and on == 'Vehicles':
        side = side.replace('<span class="on">Vehicles</span>', '<span>Vehicles</span>').replace('<span>Rules</span>', '<span class="on">Rules</span>')
    return ('<section class="psec" id="portal" style="--acc:%s"><div class="wrap"><p class="kicker">%s</p><h2>%s</h2><p class="sub">%s</p>'
            '<div class="pf" data-mod="%s"><div class="pf-bar" aria-hidden="true"><i></i><i></i><i></i><span>app.tfn.co.za</span></div><div class="pf-body"><nav class="pf-side" aria-hidden="true"><svg><use href="#logo"/></svg>%s</nav><div class="pf-main">%s</div></div></div></div></section>') % (
            P[k]['acc'], kick, title, sub, mod, side, body)

SH = '<div class="sh"><svg aria-hidden="true"><use href="#logo"/></svg><i></i></div>'


def wash(hexc, a=.12):
    h = hexc.lstrip('#'); return 'rgba(%d,%d,%d,%s)' % (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


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
        dk, k, wash(p['acc']), data_dark, p['name'], p['kicker'], soon, p['title'], p['sub'], btn, p['cta'][1], p['cta'][0], stats, chips,
        p.get('stage_before', ''), p['finish'], SH, p['screen'], p.get('extra', ''))
    how = '<section class="band grey" id="how"%s><div class="wrap"><h2>%s</h2><div class="steps3" style="--acc:%s;--accink:%s">%s</div></div></section>' % (
        data_dark, p['how'][0], p['acc'], p.get('accink', '#fff'), ''.join('<div><h3>%s</h3><p>%s</p></div>' % s for s in p['how'][1]))
    feats = '<section class="band"%s><div class="wrap"><h2>%s</h2><div class="feats">%s</div></div></section>' % (
        data_dark, p['feats'][0], ''.join('<div><h3>%s</h3><p>%s</p></div>' % f for f in p['feats'][1]))
    more = '<section class="band grey more"%s><div class="wrap"><h2>More from TFN</h2><p class="sub">Every product runs on one TFN account. All of them are moving into Truckers Hub, coming soon.</p><div class="range">%s</div></div></section>' % (
        data_dark, ''.join(tile(o) for o in ORDER if o != k))
    close = '<section class="close"%s><div class="wrap"><h2>%s</h2><p class="sub">%s</p><a class="%s" href="%s">%s</a></div></section>' % (
        data_dark, 'Be first in line for LCV' if p.get('soon') else 'See what you’d save',
        'Leave your details and we’ll tell you when LCV opens.' if p.get('soon') else 'Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will send you a comparison within 48 hours.', btn,
        p['cta'][1] if p.get('soon') else 'https://tfn.co.za/your-fuel-quote/', p['cta'][0] if p.get('soon') else 'Get a fuel quote')
    quote = '<section class="band quote"><div class="wrap"><blockquote>“%s”</blockquote><cite>%s</cite></div></section>' % Q[k] if k in Q else ''
    faq = '<section class="band faq"><div class="wrap"><h2>Questions</h2><div class="faqs">%s</div></div></section>' % ''.join('<details><summary>%s</summary><p>%s</p></details>' % qa for qa in F[k])
    body = nav(k) + '\n<main>\n' + '\n'.join([hero, portal(k), how, feats, quote, faq, more, close]) + '\n</main>\n' + footer()
    return page('TFN %s | %s' % (p['name'], p['title']), p['sub'], body, 'dark-page' if dark else '')


def hub():
    intro = '''<section class="intro"><div class="wrap">
<p class="kicker" style="justify-content:center">Truckers Hub <span class="soon">Coming soon</span></p><h1 style="font-size:clamp(2.4rem,5vw,3.6rem)">Everything TFN does, in one place</h1>
<p class="sub">TFN gets your trucks diesel at negotiated prices at 270+ truck stops and handles the payment and the paperwork, with no cards, no cash and no slips. Truckers Hub will bring every TFN product into one place: one app for your drivers and one portal for your fleet managers.</p>
<div class="range">%s%s</div><p style="margin-top:40px"><a class="btn" href="tfn-tiers.html">The more you fuel, the less you pay: see the tiers</a></p></div></section>''' % (''.join(tile(k) for k in ORDER), later_tiles())
    hubband = '''<section class="band"><div class="wrap"><h2>Two apps, one hub</h2><p class="sub">Today your drivers use TFN Pay and you use the TFN Dashboard. Truckers Hub brings every product into one driver app and one fleet manager portal. It holds the things every product needs, so you set them up once.</p>
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
<div><h3>Open an account</h3><p>Sign up online and add your trucks and drivers. Then choose cash (pre-loaded by EFT) or credit through your bank.</p></div>
<div><h3>Order and fill up</h3><p>Order fuel in the TFN Dashboard. Your driver fills up at a TFN truck stop, checked by location and photographed at the pump.</p></div>
<div><h3>See every litre</h3><p>Every fill lands in your dashboard straight away, ready for reports, statements and your accounting system.</p></div>
</div></div></section>'''
    close = '<section class="close"><div class="wrap"><h2>Not sure where to start?</h2><p class="sub">Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will show you what you’d save, within 48 hours.</p><a class="btn" href="https://tfn.co.za/your-fuel-quote/">Get a fuel quote</a></div></section>'
    body = nav() + '\n<main>\n' + intro + hubband + how + close + '\n</main>\n' + footer()
    return page('TFN | Products and Truckers Hub', 'TFN products: On-Road, LCV, Non-Fuel, Network, Homebase, TFN Africa and Credit. Truckers Hub, coming soon, brings them into one driver app and one fleet manager portal.', body)


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
    portal = """<section class="band" data-dark style="background:#000;color:#fff"><div class="wrap"><p class="kicker" style="color:#a8a8a8">Fleet manager portal <span class="soon">Coming soon</span></p><h2>Your tier, always in view</h2><p class="sub" style="color:#a8a8a8">See your tier, how far you are from the next one and what it’s saving you in the Truckers Hub fleet manager portal.</p>
<div class="portal" aria-hidden="true"><aside><svg><use href="#logo"/></svg><span>Overview</span><span>Orders</span><span>Vehicles</span><span>Drivers</span><span class="on">Your tier</span><span>Reports</span></aside>
<main><div class="card"><h4>Your tier this month</h4><div class="stat">%s<div><div class="big">41 600 L</div><small>on-road diesel so far</small></div></div><div class="bar" style="--v:58%%"><i></i></div><small>8 400 L to Diamond</small></div>
<div class="card"><h4>What Gold gets you</h4><ul><li><span>Off every litre</span><b>4c</b></li><li><span>Saved this month</span><b>R 1 664</b></li><li><span>Homebase fee</span><b>Gold rate</b></li><li><span>Next tier</span><b>Diamond, 6c</b></li></ul></div></main></div></div></section>""" % badge('gold', 'Gold')
    close = '<section class="close"><div class="wrap"><h2>See what your tier would save</h2><p class="sub">Tell us what you paid for diesel last time and how much you use. A TFN fuel specialist will send you a comparison within 48 hours.</p><a class="btn" href="https://tfn.co.za/your-fuel-quote/">Get a fuel quote</a></div></section>'
    body = nav('tiers') + '\n<main>\n' + hero + steps + calc + portal + close + '\n</main>\n' + footer()
    return page('TFN tiers | The more you fuel, the less you pay', 'TFN tiers: Bronze, Silver, Gold, Diamond and Platinum, set by monthly on-road diesel volume. Move up a tier and every litre costs less.', body)


if __name__ == '__main__':
    (ROOT / 'tfn-tiers.html').write_text(tiers_page())
    (ROOT / 'tfn-products.html').write_text(hub())
    for k in ORDER:
        (ROOT / P[k]['file']).write_text(product_page(k))
    print('wrote tfn-products.html and', len(ORDER), 'product pages')
