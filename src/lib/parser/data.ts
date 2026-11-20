// Vocabulary for English, Roman Urdu and Urdu script.

export type NumDef = { t: "small" | "frac" | "mult"; v: number };
export const NUM_WORDS: Record<string, NumDef> = {};
function add(words: string, t: NumDef["t"], v: number) {
  for (const w of words.split(" ")) NUM_WORDS[w] = { t, v };
}
add("ek aik ik one ایک", "small", 1);
add("do two دو", "small", 2);
add("teen tin three تین", "small", 3);
add("char chaar four چار", "small", 4);
add("panch paanch five پانچ", "small", 5);
add("chay chhe che chah six چھ", "small", 6);
add("saat sat seven سات", "small", 7);
add("aath ath eight آٹھ", "small", 8);
add("nau nine نو", "small", 9);
add("das ten دس", "small", 10);
add("gyarah eleven", "small", 11);
add("barah twelve", "small", 12);
add("terah thirteen", "small", 13);
add("chaudah fourteen", "small", 14);
add("pandrah pandra fifteen", "small", 15);
add("solah sixteen", "small", 16);
add("satrah seventeen", "small", 17);
add("atharah eighteen", "small", 18);
add("unnees nineteen", "small", 19);
add("bees twenty بیس", "small", 20);
add("pachees pachis پچیس", "small", 25);
add("tees thirty تیس", "small", 30);
add("chalees chalis forty چالیس", "small", 40);
add("pachas fifty پچاس", "small", 50);
add("saath sixty ساٹھ", "small", 60);
add("sattar seventy ستر", "small", 70);
add("assi eighty اسی", "small", 80);
add("nabbe ninety نوے", "small", 90);
add("dedh derh ڈیڑھ", "frac", 1.5);
add("dhai ڈھائی", "frac", 2.5);
add("sawa سوا", "frac", 1.25);
add("adha aadha آدھا", "frac", 0.5);
add("sau hundred سو", "mult", 100);
add("hazar hazaar hajar thousand ہزار", "mult", 1000);
add("lakh lac lakhs lacs لاکھ", "mult", 100000);
add("million", "mult", 1000000);
add("karor crore crores کروڑ", "mult", 10000000);

export const MULT_SUFFIXES = ["sau", "hazar", "hazaar", "lakh", "lac", "karor", "crore"];

// A number followed by one of these is a quantity, not an amount ("2 kg aata 500").
export const UNITS = new Set(
  ("kg kgs g gm gms gram grams ltr ltrs liter liters litre litres ml dozen darjan darjen piece pieces pcs pc " +
    "packet packets pkt bottle bottles seer ser man plate plates glass cup cups bag bags ticket tickets " +
    "month months mahina mahine din dino day days hour hours hrs hr minute min person log bande banday " +
    "people items item am pm baje bajay bajae feet ft inch year years saal week weeks hafta haftay " +
    "کلو گرام لیٹر درجن پیکٹ بوتل پلیٹ گلاس دن مہینے مہینہ سال بجے").split(" ")
);

// Words that never belong in the cleaned note.
export const STOP = new Set(
  ("rs rupees rupay rupaye pkr spent spend paid pay payment bought buy kharcha kharch kharche kharchay expense expenses " +
    "liya liye khareeda kharida diya diye dia di aaj today yesterday kal parso parson raat subah sham dopahar " +
    "morning evening night ago pehle qabl for on the a of ka ki ke par pe mein me se ko ne aur and hua hui gaya " +
    "gayi ho hai hi hello hey bhai yar yaar bro sir please plz pls mila mili mile milay received recd rcvd got from " +
    "credited credit wasool then phir plus - + . آج کل کا کی کے کو نے سے پر میں اور ہے ہوا ہوئی دیا دیے لیا ملا ملی").split(" ")
);

export type Cat = { name: string; kw: string[] };

export const EXPENSE_CATEGORIES: Cat[] = [
  {
    name: "Bills",
    kw: ["bill","bills","electricity","bijli","bjli","electric","k-electric","kelectric","lesco","iesco","fesco","mepco","hesco","sngpl","ssgc","sui","gas","water","internet","wifi","wi-fi","ptcl","stormfiber","nayatel","fiber","jazz","zong","telenor","ufone","load","recharge","easyload","package","netflix","spotify","subscription","بل","بجلی","گیس","انٹرنیٹ","لوڈ","پانی"],
  },
  {
    name: "Health",
    kw: ["medicine","medicines","dawai","dawa","dawaiyan","doctor","dr","clinic","hospital","lab","test","tests","injection","checkup","check up","dentist","dental","pharmacy","dawakhana","panadol","xray","x-ray","scan","ultrasound","surgery","operation","vaccine","glasses","دوا","دوائی","ڈاکٹر","ہسپتال","کلینک","ٹیسٹ"],
  },
  {
    name: "Education",
    kw: ["school","tuition","tution","academy","books","book","copy","copies","stationery","course","udemy","coursera","exam","admission","uniform","college","university","اسکول","فیس","کتابیں","ٹیوشن"],
  },
  {
    name: "Kids",
    kw: ["diaper","diapers","pampers","baby","bacha","bachay","bachon","formula","cerelac","nido","lactogen","milk powder","feeder","toys","toy","stroller","بچہ","بچے","پیمپر"],
  },
  {
    name: "Vehicle",
    kw: ["service","servicing","oil change","engine oil","engine","tyre","tyres","tire","tires","mechanic","battery","wash","car wash","puncture","denting","car insurance","token tax","brake","brakes","clutch","spare","spareparts","tuning","alignment","wheel","filter","گاڑی","ٹائر","مکینک"],
  },
  {
    name: "Transport",
    kw: ["petrol","pertol","patrol","ptrol","petrl","petrole","diesel","cng","fuel","rickshaw","rikshaw","riksha","auto","uber","careem","indrive","indriver","bykea","taxi","cab","bus","metrobus","metro bus","orange line","green line","toll","parking","challan","ride","پیٹرول","ڈیزل","رکشہ","ٹیکسی","بس","کیریم","اوبر","پارکنگ","چالان"],
  },
  {
    name: "Rent",
    kw: ["rent","kiraya","kiray","maintenance","کرایہ","کرائے"],
  },
  {
    name: "Food",
    kw: ["chai","tea","cha","paratha","parathay","nashta","nashtay","breakfast","lunch","dinner","khana","khanay","biryani","karahi","nihari","haleem","pulao","burger","pizza","roll","rolls","shawarma","samosa","samosay","pakora","pakoray","chaat","golgappay","juice","shake","coffee","lassi","cold drink","pepsi","coke","sprite","ice cream","icecream","kulfi","falooda","restaurant","hotel","dhaba","tikka","bbq","bun","kabab","kebab","sajji","dawat","dawatein","foodpanda","kfc","mcdonalds","mcd","subway","hardees","dominos","cheezious","bakery","cake","mithai","sweets","fries","naan","roti","sehri","iftari","snacks","snack","چائے","چاۓ","پراٹھا","پراٹھے","ناشتہ","ناشتا","کھانا","لنچ","ڈنر","بریانی","کڑاہی","برگر","پیزا","سموسے","جوس","کافی","لسی","ہوٹل","ریسٹورنٹ","دعوت"],
  },
  {
    name: "Groceries",
    kw: ["grocery","groceries","sabzi","sabzia","sabji","sabzee","phal","fruit","fruits","doodh","dood","milk","dahi","yogurt","anda","ande","eggs","egg","ration","aata","atta","chawal","rice","daal","dal","cheeni","sugar","ghee","oil","tel","namak","masala","masalay","kiryana","kiryane","chicken","murghi","gosht","meat","beef","mutton","qeema","fish","machli","bread","butter","surf","soap","detergent","imtiaz","naheed","carrefour","chaseup","chase up","hyperstar","alfatah","al fatah","green valley","mart","سبزی","پھل","دودھ","دہی","انڈے","راشن","آٹا","چاول","دال","چینی","گھی","تیل","گوشت","مرغی","کریانہ"],
  },
  {
    name: "Shopping",
    kw: ["kapray","kapra","kapre","clothes","cloth","shirt","shirts","tshirt","pant","jeans","shoes","shoe","joota","jootay","sandal","chappal","khussa","khaadi","sapphire","gulahmed","gul ahmed","outfitters","alkaram","ndure","bata","daraz","amazon","aliexpress","shein","mall","shopping","watch","bag","perfume","itar","wallet","belt","sunglasses","mobile","phone","laptop","charger","earbuds","headphones","کپڑے","جوتے","شاپنگ","موبائل"],
  },
  {
    name: "Entertainment",
    kw: ["movie","movies","cinema","film","game","games","gaming","steam","playstation","psn","xbox","youtube","outing","picnic","park","concert","event","amusement","sea view","seaview","clifton","hawksbay","beach","cricket","psl","bowling","arcade","فلم","سینما","گیم"],
  },
  {
    name: "Fitness",
    kw: ["gym","protein","whey","creatine","supplement","supplements","fitness","yoga","swimming","trainer","pre workout","preworkout","bcaa","جم"],
  },
  {
    name: "Personal care",
    kw: ["haircut","hair","salon","barber","hajamat","hajaamat","shave","shaving","grooming","facial","parlour","parlor","beauty","makeup","skincare","shampoo","face wash","cream","lotion","nails","حجامت","سیلون","پارلر"],
  },
  {
    name: "Home",
    kw: ["furniture","repair","repairs","plumber","electrician","mistri","maid","masi","bai","cleaning","kitchen","cylinder","gas cylinder","paint","painting","carpenter","ac","fridge","washing machine","generator","ups","inverter","solar","staff","nokar","naukar","مرمت","پلمبر","الیکٹریشن","ماسی","مستری"],
  },
  {
    name: "Charity",
    kw: ["zakat","zakaat","sadqa","sadaqah","sadaqa","sadka","khairat","khairaat","donation","donate","fitra","fitrana","fidya","chanda","masjid","madrasa","madrassa","langar","زکوۃ","زکات","صدقہ","خیرات","فطرانہ","چندہ","مسجد"],
  },
  {
    name: "Gifts & events",
    kw: ["gift","gifts","tohfa","eidi","salami","birthday","shadi","wedding","jahez","valima","mehndi","تحفہ","عیدی","شادی","سلامی"],
  },
  {
    name: "Loans",
    kw: ["udhar","udhaar","qarz","qarza","loan","emi","installment","instalment","kist","qist","kisat","interest","ادھار","قرض","قسط"],
  },
  {
    name: "Travel",
    kw: ["flight","airline","airblue","pia","serene","visa","passport","trip","tour","umrah","hajj","booking","hotel booking","train","railway","daewoo","faisal movers","bus ticket","ticket","سفر","عمرہ","حج","ٹکٹ"],
  },
];

export const INCOME_CATEGORIES: Cat[] = [
  { name: "Salary", kw: ["salary","tankhwah","tankhah","tankha","tankhwa","paycheck","payday","تنخواہ","تنخواه","سیلری"] },
  { name: "Freelance", kw: ["freelance","freelancing","client","upwork","fiverr","payoneer","project","gig","contract"] },
  { name: "Business", kw: ["sales","business","profit","customer","commission","becha","منافع"] },
  { name: "Rental", kw: ["rent","kiraya","کرایہ"] },
  { name: "Gift", kw: ["eidi","salami","gift","tohfa","present","عیدی","تحفہ"] },
  { name: "Refund", kw: ["refund","wapsi","wapas","return","cashback","cash back","reimbursement","reimburse"] },
  { name: "Bonus", kw: ["bonus","incentive","increment"] },
];

export const SAVING_WORDS = new Set([
  "save","saved","saving","savings","bachat","بچت","committee","kameti","کمیٹی","invest","invested","investment",
  "ktrade","psx","mutual","etf","fd","jama","jamaa","جمع",
]);
export const INCOME_VERBS = new Set([
  "mila","mili","mile","milay","received","recd","rcvd","credited","credit","wasool","ملا","ملی","ملے","موصول",
]);
export const INCOME_ONLY_KW = new Set([
  "freelance","freelancing","upwork","fiverr","payoneer","bonus","refund","cashback","profit","sales","commission",
  "incentive","reimbursement","salary","tankhwah","tankhah","tankha","tankhwa","تنخواہ","تنخواه",
]);
export const STAFF_WORDS = new Set([
  "maid","masi","bai","driver","staff","nokar","naukar","cook","gardener","mali","guard","watchman","ملازم","ماسی",
]);
export const GAVE_WORDS = new Set([
  "diya","diye","di","dia","bheja","bheje","bheji","bhejay","paid","pay","payment","send","sent","dena","دیا","دیے","بھیجے",
]);
