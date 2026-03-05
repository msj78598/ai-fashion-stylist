import fetch from 'node-fetch';

const testQueries = [
    "v-neck maxi satin dress فستان",
    "فستان ساتان ماكسي ياقة سبعة",
    "v-neck maxi satin dress site:namshi.com",
    "فستان ساتان shein",
    "v-neck maxi satin dress (namshi OR trendyol OR shein)",
    "v-neck maxi satin dress shein trendyol noon",
    "فستان سهرة نمشي"
];

const apiKey = "303a194d749e031e6e62416d9ee4f9e0e57a5b9f4a0fee892a15b8fd60c30dc0";

async function test() {
    for (const query of testQueries) {
        console.log(`\n============================`);
        console.log(`TESTING QUERY: ${query}`);
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=sa&hl=ar&api_key=${apiKey}&direct_link=true`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            const results = data.shopping_results || [];
            console.log(`Found ${results.length} results.`);
            console.log("Sources:");

            const sourcesCounts = {};
            for (const item of results) {
                const source = item.source || "UNKNOWN";
                sourcesCounts[source] = (sourcesCounts[source] || 0) + 1;
            }

            for (const source in sourcesCounts) {
                console.log(`- "${source}": ${sourcesCounts[source]} items`);
            }

            const localStoreNames = [
                "shein", "شي إن", "namshi", "نمشي", "noon", "نون",
                "ounass", "أناس", "أُناس", "modanisa", "مودانيسا",
                "trendyol", "ترينديول", "bloomingdale", "بلومينغديلز",
                "fashion.sa", "فاشن السعودية", "redtag", "ريد تاغ",
                "zara", "زارا", "next", "نكست", "marina fashion", "مارينا",
                "warazan", "ورزان", "rana", "فساتين رنا",
                "riyadhdress", "riyadh dress", "فساتين الرياض", "barllina", "بارلينا"
            ];

            let localCount = 0;
            let globalCount = 0;
            for (const item of results) {
                const storeNameLower = (item.source || "").toLowerCase();
                const isLocal = localStoreNames.some(local => storeNameLower.includes(local));
                if (isLocal) {
                    localCount++;
                    console.log(`[LOCAL MATCH] ${item.source}`);
                } else {
                    globalCount++;
                }
            }
            console.log(`Matched Local: ${localCount}, Global: ${globalCount}`);

        } catch (e) {
            console.error(e);
        }
    } // End of for loop
} // End of async function test()
test();
