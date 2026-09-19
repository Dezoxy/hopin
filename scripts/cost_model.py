#!/usr/bin/env python3
"""Hopin three-year cost model (plan step S120).

Prints the tables in docs/business/three-year-cost-model.md. Every input is an
assumption stated in that document; change it there and here together.
"""
# Three-year cost model for Hopin. All inputs are assumptions stated in the doc.
EUR, USD = 400, 370            # HUF per EUR / USD
DAYS, MONTH = 365, 30.4
RIDES_PER_CAR_DAY = 12         # partner cars: app + phone orders through the platform
WL_PRICE = 10_000              # HUF per car per month (business case)
BRAND_NET = 640                # HUF per Hopin-brand ride after Stripe (business case)
MATRIX_CANDIDATES = 10         # taxis ranked by road ETA per ride

scen = {
 "Ambitious (base)": [(75,50),(325,200),(750,450)],   # (avg partner cars, avg brand rides/day)
 "Base":             [(30,25),(130,100),(350,225)],
 "Conservative":     [(15,5),(75,20),(210,40)],
}

def mapbox_usd(rides_m):
    over=lambda x,free: max(0,x-free)
    matrix = over(rides_m*MATRIX_CANDIDATES,100_000)*2/1000
    direc  = over(rides_m*2,100_000)*2/1000
    geo    = over(rides_m*5,100_000)*0.75/1000
    mau    = rides_m/4
    maus   = over(mau,25_000)*4/1000
    return matrix+direc+geo+maus, matrix, mau

def year(cars, brand, y):
    rides_d = cars*RIDES_PER_CAR_DAY + brand
    rides_m = rides_d*MONTH
    aws_eur = 290 if rides_d<2000 else (750 if rides_d<6000 else 1500)
    mbx, matrix, mau = mapbox_usd(rides_m)
    sfn_usd = rides_m*10*0.025/1000
    sms_eur = mau*0.3*0.05
    cognito_usd = max(0,mau-10_000)*0.01
    saas_usd = 99 + (26 if y==1 else 80)            # EAS + Sentry
    m = dict(
      aws = aws_eur*EUR, mapbox = mbx*USD, sfn = sfn_usd*USD,
      sms = sms_eur*EUR, cognito = cognito_usd*USD, saas = saas_usd*USD)
    annual = {k:v*12 for k,v in m.items()}
    rev = cars*WL_PRICE*12 + brand*DAYS*BRAND_NET
    return rides_d, annual, rev, matrix*USD*12

other = {  # HUF per year: one-off + recurring, estimates to confirm with quotes
 1: dict(legal=3_300_000, pentest=2_500_000, company=920_000, stores=37_000+9_000+1050*EUR+500_000),
 2: dict(legal=800_000,   pentest=2_000_000, company=1_440_000, stores=37_000),
 3: dict(legal=800_000,   pentest=2_000_000, company=2_440_000, stores=37_000),
}
EMP = 1.13  # employer cost on gross (13 % social contribution tax)
ENG, SUP = 1_600_000*EMP*12, 750_000*EMP*12
hires = {  # HUF per year per scenario, excluding the founder (assumption A-10)
 "Ambitious (base)": {1: 0, 2: ENG, 3: ENG + SUP},
 "Base":             {1: 0, 2: 0,   3: ENG},
 "Conservative":     {1: 0, 2: 0,   3: 0},
}
founder = 1_800_000*EMP*12

def M(x): return f"{x/1e6:,.1f}"
out=[]
for name, ys in scen.items():
    rows=[]
    for y,(c,b) in enumerate(ys,1):
        rides_d, ann, rev, matrix = year(c,b,y)
        tech = sum(ann.values())
        oth = sum(other[y].values())
        cash = tech + oth + hires[name][y]
        rows.append(dict(y=y,cars=c,brand=b,rides=rides_d,ann=ann,tech=tech,oth=oth,people=hires[name][y],cash=cash,rev=rev,matrix=matrix))
    out.append((name,rows))

name, rows = out[0]
print("### BASE DETAIL")
print("| Line (M HUF per year) | Year 1 | Year 2 | Year 3 | 3-year total |\n|---|---|---|---|---|")
def line(label, f):
    vals=[f(r) for r in rows]; print(f"| {label} | "+" | ".join(M(v) for v in vals)+f" | {M(sum(vals))} |")
print("| Platform rides per day (average) | "+" | ".join(f"{r['rides']:,}" for r in rows)+" | — |")
line("AWS infrastructure (prod, staging, dev)", lambda r:r['ann']['aws'])
line("Mapbox (routing, matrix, geocoding, maps)", lambda r:r['ann']['mapbox'])
line("of which Matrix API for matching", lambda r:r['matrix'])
line("Step Functions", lambda r:r['ann']['sfn'])
line("SMS sign-in codes", lambda r:r['ann']['sms'])
line("Cognito", lambda r:r['ann']['cognito'])
line("Expo EAS and Sentry", lambda r:r['ann']['saas'])
line("**Technology subtotal**", lambda r:r['tech'])
line("Legal and compliance", lambda r:other[r['y']]['legal'])
line("Security testing", lambda r:other[r['y']]['pentest'])
line("Company and accounting", lambda r:other[r['y']]['company'])
line("Stores, trademark, certification", lambda r:other[r['y']]['stores'])
line("Hires (engineer from Y2, partner support from Y3)", lambda r:r['people'])
line("**Cash costs**", lambda r:r['cash'])
line("**Revenue**", lambda r:r['rev'])
line("**Cash result**", lambda r:r['rev']-r['cash'])
line("Founder at market rate (shown apart)", lambda r:founder)
line("**Result after founder**", lambda r:r['rev']-r['cash']-founder)
print()
print("### SENSITIVITY")
print("| Scenario | Rides/day Y3 | Revenue Y1 / Y2 / Y3 | Cash costs Y1 / Y2 / Y3 | 3-year result after founder |\n|---|---|---|---|---|")
for name,rows in out:
    res=sum(r['rev']-r['cash']-founder for r in rows)
    print(f"| {name} | {rows[2]['rides']:,} | {' / '.join(M(r['rev']) for r in rows)} | {' / '.join(M(r['cash']) for r in rows)} | {M(res)} |")
print()
r3=out[0][1][2]
d3=(max(0,r3['rides']*MONTH*2-100000)*2/1000)*USD*12
print("Y3 directions HUF/yr", M(d3))
print("Y3 monthly mapbox HUF", M(r3['ann']['mapbox']/12), " matrix share", round(r3['matrix']/r3['ann']['mapbox']*100), "%", " aws/mo", M(r3['ann']['aws']/12))
print("Y3 revenue/mo", M(r3['rev']/12), "cash/mo", M(r3['cash']/12))
