// app/api/missing-products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Complete missing products data from all continents
// Data extracted from EUROPE, ASIE, AFRIQUE, AMERIQUE, and OCEANIE documents
const MISSING_PRODUCTS: { [key: string]: string[] } = {
  'afghanistan': ['20 afghanis', '50 afghanis', '100 afghanis', '500 afghanis', '1000 afghanis'],
  'albania': ['500 lek', '1000 lek', '2000 lek', '5000 lek', '10000 lek'],
  'algeria': ['200 dinars', '500 dinars', '1000 dinars', '2000 dinars'],
  'argentina': ['100 pesos', '200 pesos', '500 pesos', '1000 pesos'],
  'armenia': ['2000 drams', '5000 drams', '10000 drams', '20000 drams', '50000 drams'],
  'aruba': ['10 florins', '25 florins', '50 florins', '100 florins', '500 florins'],
  'australia': ['10 dollars'],
  'bahamas': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'bangladesh': ['20 taka', '50 taka', '100 taka', '200 taka', '500 taka', '1000 taka'],
  'barbados': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'belarus': ['10 roubles', '20 roubles', '50 roubles', '100 roubles', '200 roubles', '500 roubles'],
  'belize': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'bermuda': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'bhutan': ['10 ngultrum', '20 ngultrum', '50 ngultrum', '100 ngultrum', '500 ngultrum', '1000 ngultrum'],
  'bolivia': ['10 bolivianos', '20 bolivianos', '50 bolivianos', '100 bolivianos', '200 bolivianos'],
  'bosnia-herzegovina': ['20 marks', '50 marks', '100 marks', '200 marks'],
  'brazil': ['20 reais', '50 reais', '100 reais', '200 reais'],
  'brunei': ['10 dollars', '50 dollars', '100 dollars', '500 dollars', '1000 dollars', '10000 dollars'],
  'bulgaria': ['10 lev', '20 lev', '50 lev', '100 lev', '200 lev'],
  'burundi': ['500 francs', '1000 francs', '2000 francs', '5000 francs', '10000 francs'],
  'cambodia': ['100 riels', '500 riels', '1000 riels', '2000 riels', '5000 riels', '10000 riels', '20000 riels', '50000 riels', '100000 riels'],
  'canada': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'cayman-islands': ['10 dollars', '25 dollars', '50 dollars', '100 dollars'],
  'central-africa': ['5000 francs'],
  'chile': ['1000 pesos', '2000 pesos', '5000 pesos', '10000 pesos', '20000 pesos'],
  'china': ['20 yuan', '50 yuan', '100 yuan'],
  'colombia': ['10000 pesos', '20000 pesos', '50000 pesos', '100000 pesos'],
  'comoros': ['500 francs', '1000 francs', '2000 francs', '5000 francs', '10000 francs'],
  'congo': ['500 francs', '1000 francs', '5000 francs', '10000 francs'],
  'costa-rica': ['1000 colones', '2000 colones', '5000 colones', '10000 colones', '20000 colones', '50000 colones'],
  'cuba': ['10 pesos', '20 pesos', '50 pesos', '100 pesos', '200 pesos', '500 pesos', '1000 pesos'],
  'djibouti': ['1000 francs', '2000 francs', '5000 francs', '10000 francs'],
  'dominican-republic': ['50 pesos', '100 pesos', '200 pesos', '500 pesos', '1000 pesos', '2000 pesos'],
  'eastern-caribbean': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'ecuador': [],
  'egypt': ['50 pounds', '100 pounds', '200 pounds'],
  'el-salvador': [],
  'eritrea': ['10 nakfa', '20 nakfa', '50 nakfa', '100 nakfa'],
  'eswatini': ['10 emalangeni', '20 emalangeni', '50 emalangeni', '100 emalangeni', '200 emalangeni'],
  'ethiopia': ['10 birr', '50 birr', '100 birr', '200 birr'],
  'euro': ['100 euros', '200 euros', '500 euros'],
  'falkland-islands': ['10 pounds', '20 pounds', '50 pounds'],
  'fiji': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'french-polynesia': ['500 francs', '1000 francs', '5000 francs', '10000 francs'],
  'ghana': ['10 cedis', '20 cedis', '50 cedis', '100 cedis', '200 cedis'],
  'guatemala': ['10 quetzales', '20 quetzales', '50 quetzales', '100 quetzales', '200 quetzales'],
  'guernsey': ['5 pounds', '10 pounds', '20 pounds', '50 pounds'],
  'guinea': ['5000 francs', '10000 francs', '20000 francs'],
  'guyana': ['100 dollars', '500 dollars', '1000 dollars', '5000 dollars'],
  'haiti': ['100 gourdes', '250 gourdes', '500 gourdes', '1000 gourdes'],
  'honduras': ['10 lempiras', '20 lempiras', '50 lempiras', '100 lempiras', '500 lempiras'],
  'hungary': ['1000 forints', '2000 forints', '5000 forints', '10000 forints', '20000 forints'],
  'iceland': ['1000 kronur', '2000 kronur', '5000 kronur', '10000 kronur'],
  'india': ['20 rupees', '50 rupees', '100 rupees', '200 rupees', '500 rupees', '2000 rupees'],
  'indonesia': ['5000 rupiah', '10000 rupiah', '20000 rupiah', '50000 rupiah', '100000 rupiah'],
  'iraq': ['1000 dinars', '5000 dinars', '10000 dinars', '25000 dinars', '50000 dinars'],
  'isle-of-man': ['1 pound', '5 pounds', '10 pounds', '20 pounds', '50 pounds'],
  'israel': ['20 shekels', '50 shekels', '100 shekels', '200 shekels'],
  'jamaica': ['100 dollars', '500 dollars', '1000 dollars', '5000 dollars'],
  'japan': ['2000 yen', '5000 yen', '10000 yen'],
  'jersey': ['5 pounds', '10 pounds', '20 pounds', '50 pounds'],
  'kazakhstan': ['1000 tenge', '2000 tenge', '5000 tenge', '10000 tenge', '20000 tenge'],
  'kenya': ['100 shillings', '200 shillings', '500 shillings', '1000 shillings'],
  'kyrgyzstan': ['20 som', '50 som', '100 som', '200 som', '500 som', '1000 som', '5000 som'],
  'laos': ['1000 kip', '2000 kip', '5000 kip', '10000 kip', '20000 kip', '50000 kip', '100000 kip'],
  'lebanon': ['50000 pounds', '100000 pounds'],
  'lesotho': ['10 maloti', '20 maloti', '50 maloti', '100 maloti', '200 maloti'],
  'libya': ['10 dinars', '20 dinars', '50 dinars'],
  'madagascar': ['1000 ariary', '2000 ariary', '5000 ariary', '10000 ariary', '20000 ariary'],
  'malawi': ['50 kwacha', '100 kwacha', '200 kwacha', '500 kwacha', '1000 kwacha', '2000 kwacha'],
  'malaysia': ['10 ringgit', '20 ringgit', '50 ringgit', '100 ringgit'],
  'maldives': ['50 rufiyaa', '100 rufiyaa', '500 rufiyaa', '1000 rufiyaa'],
  'mauritania': ['100 ouguiya', '200 ouguiya', '500 ouguiya', '1000 ouguiya'],
  'mauritius': ['100 rupees', '200 rupees', '500 rupees', '1000 rupees', '2000 rupees'],
  'mexico': ['50 pesos', '100 pesos', '200 pesos', '500 pesos', '1000 pesos'],
  'moldova': ['10 leu', '20 leu', '50 leu', '100 leu', '500 leu', '1000 leu'],
  'mongolia': ['100 tugrik', '500 tugrik', '1000 tugrik', '5000 tugrik', '10000 tugrik', '20000 tugrik'],
  'morocco': ['20 dirhams', '50 dirhams', '100 dirhams', '200 dirhams'],
  'mozambique': ['50 meticais', '100 meticais', '200 meticais', '500 meticais', '1000 meticais'],
  'myanmar': ['50 kyat', '100 kyat', '200 kyat', '500 kyat', '1000 kyat', '5000 kyat', '10000 kyat'],
  'namibia': ['20 dollars', '50 dollars', '100 dollars', '200 dollars'],
  'nepal': ['10 rupees', '20 rupees', '50 rupees', '100 rupees', '500 rupees', '1000 rupees'],
  'netherlands-antilles': ['10 florins'],
  'new-caledonia': ['500 francs', '1000 francs', '5000 francs', '10000 francs'],
  'new-zealand': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'nicaragua': ['20 cordobas', '50 cordobas', '100 cordobas', '200 cordobas', '500 cordobas', '1000 cordobas'],
  'nigeria': ['100 naira', '200 naira', '500 naira', '1000 naira'],
  'north-korea': ['100 won', '200 won', '500 won', '1000 won', '2000 won', '5000 won'],
  'north-macedonia': ['100 denars', '200 denars', '500 denars', '1000 denars', '2000 denars', '5000 denars'],
  'norway': ['100 kroner', '200 kroner', '500 kroner', '1000 kroner'],
  'pakistan': ['20 rupees', '50 rupees', '100 rupees', '500 rupees', '1000 rupees', '5000 rupees'],
  'panama': [],
  'papua-new-guinea': ['10 kina', '20 kina', '50 kina', '100 kina'],
  'paraguay': ['10000 guaranies', '20000 guaranies', '50000 guaranies', '100000 guaranies'],
  'peru': ['10 soles', '20 soles', '50 soles', '100 soles', '200 soles'],
  'philippines': ['100 pesos', '200 pesos', '500 pesos', '1000 pesos'],
  'poland': ['10 zloty', '50 zloty', '100 zloty', '200 zloty', '500 zloty'],
  'qatar': ['10 riyals', '50 riyals', '100 riyals', '500 riyals'],
  'romania': ['5 lei', '10 lei', '20 lei', '50 lei', '100 lei', '200 lei', '500 lei'],
  'russia': ['100 rubles', '500 rubles', '1000 rubles', '2000 rubles', '5000 rubles'],
  'rwanda': ['500 francs', '1000 francs', '2000 francs', '5000 francs'],
  'samoa': ['10 tala', '20 tala', '50 tala', '100 tala'],
  'sao-tome-and-principe': ['5000 dobras', '10000 dobras', '20000 dobras', '50000 dobras', '100000 dobras'],
  'saudi-arabia': ['10 riyals', '50 riyals', '100 riyals', '500 riyals'],
  'serbia': ['10 dinars', '50 dinars', '100 dinars', '200 dinars', '500 dinars', '1000 dinars', '2000 dinars', '5000 dinars'],
  'seychelles': ['50 rupees', '100 rupees', '500 rupees'],
  'sierra-leone': ['1000 leones', '2000 leones', '5000 leones', '10000 leones', '20000 leones'],
  'singapore': ['10 dollars', '50 dollars', '100 dollars', '1000 dollars', '10000 dollars'],
  'solomon-islands': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'somalia': ['20 shillings', '50 shillings', '100 shillings', '500 shillings', '1000 shillings'],
  'south-africa': ['20 rand', '50 rand', '100 rand', '200 rand'],
  'south-korea': ['10000 won', '50000 won'],
  'sri-lanka': ['100 rupees', '500 rupees', '1000 rupees', '5000 rupees'],
  'sudan': ['10 pounds', '20 pounds', '50 pounds', '100 pounds'],
  'suriname': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'sweden': ['20 kronor', '50 kronor', '100 kronor', '200 kronor', '500 kronor', '1000 kronor'],
  'switzerland': ['20 francs', '50 francs', '100 francs'],
  'syria': ['100 pounds', '200 pounds', '500 pounds', '1000 pounds', '2000 pounds', '5000 pounds'],
  'tajikistan': ['1 somoni', '5 somoni', '20 somoni', '50 somoni', '100 somoni', '200 somoni', '500 somoni'],
  'tanzania': ['500 shillings', '1000 shillings', '2000 shillings', '5000 shillings', '10000 shillings'],
  'thailand': ['100 baht', '500 baht', '1000 baht'],
  'tonga': ['10 paanga', '20 paanga', '50 paanga', '100 paanga'],
  'trinidad-and-tobago': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
  'tunisia': ['10 dinars', '20 dinars', '50 dinars'],
  'turkey': ['200 lira'],
  'turkmenistan': ['1 manat', '5 manat', '10 manat', '50 manat', '100 manat', '500 manat'],
  'uganda': ['1000 shillings', '2000 shillings', '5000 shillings', '10000 shillings', '20000 shillings', '50000 shillings'],
  'ukraine': ['20 hryvnia', '100 hryvnia', '200 hryvnia', '500 hryvnia', '1000 hryvnia'],
  'united-kingdom': ['20 pounds', '50 pounds'],
  'united-states': ['50 dollars', '100 dollars'],
  'uruguay': ['50 pesos', '100 pesos', '200 pesos', '500 pesos', '1000 pesos', '2000 pesos'],
  'uzbekistan': ['1000 som', '5000 som', '10000 som', '50000 som', '100000 som'],
  'vanuatu': ['500 vatu', '1000 vatu', '5000 vatu'],
  'venezuela': ['5 bolivares', '10 bolivares', '20 bolivares', '50 bolivares', '100 bolivares', '200 bolivares', '500 bolivares'],
  'vietnam': ['10000 dong', '20000 dong', '50000 dong', '100000 dong', '200000 dong', '500000 dong'],
  'west-africa': ['5000 francs', '10000 francs'],
  'zambia': ['10 kwacha', '20 kwacha', '50 kwacha', '100 kwacha'],
  'zimbabwe': ['10 dollars', '20 dollars', '50 dollars', '100 dollars'],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const missing = MISSING_PRODUCTS[slug] || [];
  
  return NextResponse.json({
    country: slug,
    missing
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { product } = await request.json();
  
  if (!product || typeof product !== 'string') {
    return NextResponse.json(
      { error: 'Product name is required' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    country: slug,
    product,
    success: true
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { product } = await request.json();
  
  if (!product) {
    return NextResponse.json(
      { error: 'Product name is required' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    country: slug,
    product,
    success: true
  });
}
