const fs = require("fs");
const path = require("path");

const CLEAN_DB = path.join(process.cwd(), "src", "data", "Clean_Fashion_DB.json");
const MASTER = path.join(process.cwd(), "src", "data", "Master_Fashion_Intelligence.json");
const OUT = path.join(process.cwd(), "src", "data", "Clean_Fashion_DB.enriched.json");

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function buildIndex(master) {
    const idx = new Map();

    for (const p of master) {
        const keys = [
            p.product_id,
            p.productUrl,
            p.image_url
        ].filter(Boolean).map(String);

        for (const k of keys) {
            idx.set(k, p);
        }
    }

    return idx;
}

function main() {

    console.log("MERGE START");

    const clean = readJson(CLEAN_DB);
    const master = readJson(MASTER);

    const idx = buildIndex(master);

    let merged = 0;
    let missing = 0;

    const out = clean.map((p) => {

        const keys = [
            p.product_id,
            p.productUrl,
            p.image_url
        ].filter(Boolean).map(String);

        let m = null;

        for (const k of keys) {
            m = idx.get(k);
            if (m) break;
        }

        const dna = m?.ai_dna;

        if (!dna) {
            missing++;
            return p;
        }

        merged++;

        return {
            ...p,
            ai_marketing_title: dna.ai_marketing_title || p.ai_marketing_title || null,
            ai_dna: dna
        };

    });

    writeJson(OUT, out);

    console.log("Saved:", OUT);
    console.log("Items:", out.length);
    console.log("Merged:", merged);
    console.log("Missing:", missing);

}

main();