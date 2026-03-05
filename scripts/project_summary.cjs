/**
 * Project DB Summary
 * Usage:
 *   node scripts/project_summary.js
 *
 * It will try common paths:
 *   src/data/Clean_Fashion_DB.json
 *   src/data/Clean_Fashion_Database.json
 *   src/data/processed_fashion_data.json
 *   src/data/productDatabase.json
 *
 * Or specify a path:
 *   node scripts/project_summary.js src/data/Clean_Fashion_DB.json
 */

const fs = require("fs");
const path = require("path");

function exists(p) {
    try {
        fs.accessSync(p, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function readJson(p) {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
}

function isObject(v) {
    return v && typeof v === "object" && !Array.isArray(v);
}

function flattenKeys(obj, prefix = "", out = new Set()) {
    if (!isObject(obj)) return out;
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        out.add(key);
        if (isObject(v)) flattenKeys(v, key, out);
    }
    return out;
}

function getByPath(obj, dotted) {
    const parts = dotted.split(".");
    let cur = obj;
    for (const p of parts) {
        if (!isObject(cur) && !Array.isArray(cur)) return undefined;
        cur = cur?.[p];
        if (cur === undefined) return undefined;
    }
    return cur;
}

function isEmptyValue(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    if (Array.isArray(v) && v.length === 0) return true;
    if (isObject(v) && Object.keys(v).length === 0) return true;
    return false;
}

function sample(arr, n = 5) {
    const a = [...arr];
    const out = [];
    for (let i = 0; i < Math.min(n, a.length); i++) {
        const idx = Math.floor(Math.random() * a.length);
        out.push(a.splice(idx, 1)[0]);
    }
    return out;
}

function normalizeToItems(data) {
    // If file is an array -> items
    if (Array.isArray(data)) return data;

    // If object that contains a list-like field
    const candidates = ["items", "products", "data", "rows"];
    for (const c of candidates) {
        if (Array.isArray(data?.[c])) return data[c];
    }

    // If object keyed by id -> convert to values
    if (isObject(data)) {
        const vals = Object.values(data);
        if (vals.length && vals.every(v => isObject(v))) return vals;
    }

    throw new Error("Unsupported JSON shape: expected array or object containing array.");
}

function main() {
    const argPath = process.argv[2];
    const root = process.cwd();

    const commonPaths = [
        "src/data/Clean_Fashion_DB.json",
        "src/data/Clean_Fashion_Database.json",
        "src/data/processed_fashion_data.json",
        "src/data/productDatabase.json",
    ].map(p => path.join(root, p));

    let target = argPath ? path.resolve(root, argPath) : commonPaths.find(exists);

    if (!target || !exists(target)) {
        console.error("❌ Could not find a data JSON file.");
        console.error("Tried:", argPath ? target : commonPaths.join(" , "));
        console.error("Tip: run: node scripts/project_summary.js src/data/Clean_Fashion_DB.json");
        process.exit(1);
    }

    console.log("📄 Reading:", target);

    let data;
    try {
        data = readJson(target);
    } catch (e) {
        console.error("❌ Failed to parse JSON:", e.message);
        process.exit(1);
    }

    let items;
    try {
        items = normalizeToItems(data);
    } catch (e) {
        console.error("❌", e.message);
        process.exit(1);
    }

    console.log("✅ Items count:", items.length);

    // Gather keys
    const keySet = new Set();
    for (const it of items.slice(0, Math.min(items.length, 200))) {
        flattenKeys(it, "", keySet);
    }
    const keys = [...keySet].sort();

    console.log("\n🧩 Detected fields (from first ~200 items):");
    console.log(keys.map(k => `- ${k}`).join("\n"));

    // Category distribution (try a few common fields)
    const catFields = ["category", "category_name", "anatomy.category", "type", "product_type"];
    let chosenCat = null;
    for (const f of catFields) {
        const hasSome = items.some(it => !isEmptyValue(getByPath(it, f)));
        if (hasSome) { chosenCat = f; break; }
    }

    if (chosenCat) {
        const counts = new Map();
        for (const it of items) {
            const v = getByPath(it, chosenCat);
            const key = isEmptyValue(v) ? "(empty)" : String(v);
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

        console.log(`\n🏷️ Top categories by "${chosenCat}" (top 20):`);
        for (const [k, c] of sorted) console.log(`- ${k}: ${c}`);
    } else {
        console.log("\n🏷️ Category: not found (tried common fields).");
    }

    // Emptiness rate for top keys
    const topKeysToCheck = keys.slice(0, 35); // don’t spam too much
    const empties = [];

    for (const k of topKeysToCheck) {
        let emptyCount = 0;
        for (const it of items) {
            const v = getByPath(it, k);
            if (isEmptyValue(v)) emptyCount++;
        }
        empties.push({ key: k, emptyPct: (emptyCount / items.length) * 100 });
    }

    empties.sort((a, b) => b.emptyPct - a.emptyPct);

    console.log("\n📉 Most-empty fields (from checked set):");
    for (const e of empties.slice(0, 15)) {
        console.log(`- ${e.key}: ${e.emptyPct.toFixed(1)}% empty`);
    }

    // Image URL health check
    const imageFields = ["image_url", "image", "img", "thumbnail", "images.0", "media.0.url"];
    let chosenImg = null;
    for (const f of imageFields) {
        const hasSome = items.some(it => !isEmptyValue(getByPath(it, f)));
        if (hasSome) { chosenImg = f; break; }
    }

    if (chosenImg) {
        let missing = 0;
        let nonHttp = 0;
        for (const it of items) {
            const v = getByPath(it, chosenImg);
            if (isEmptyValue(v)) missing++;
            else if (typeof v === "string" && !/^https?:\/\//i.test(v)) nonHttp++;
        }
        console.log(`\n🖼️ Image field: "${chosenImg}"`);
        console.log(`- Missing: ${missing} (${((missing / items.length) * 100).toFixed(1)}%)`);
        console.log(`- Non-http: ${nonHttp} (${((nonHttp / items.length) * 100).toFixed(1)}%)`);
    } else {
        console.log("\n🖼️ Image URL field: not found (tried common fields).");
    }

    // Show 3 samples
    console.log("\n🔎 Sample items (3):");
    const samples = sample(items, 3);
    samples.forEach((s, i) => {
        // Show a compact subset if possible
        const pick = {};
        const prefer = ["id", "sku", "name", "title", "brand", "price", "original_price", "category", "image_url", "url", "product_url"];
        for (const p of prefer) {
            if (s?.[p] !== undefined) pick[p] = s[p];
        }
        // Always include anatomy/upper_design if present
        if (s?.anatomy) pick.anatomy = s.anatomy;
        if (s?.upper_design) pick.upper_design = s.upper_design;

        console.log(`\n--- Sample #${i + 1} ---`);
        console.log(JSON.stringify(Object.keys(pick).length ? pick : s, null, 2).slice(0, 2500));
    });

    console.log("\n✅ Done.");
}

main();