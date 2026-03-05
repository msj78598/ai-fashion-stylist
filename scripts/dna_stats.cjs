const fs = require("fs");
const path = require("path");

const DB = path.join(process.cwd(), "src", "data", "Clean_Fashion_DB.enriched.json");

const data = JSON.parse(fs.readFileSync(DB, "utf8"));

const fields = [
    "category",
    "silhouette",
    "neckline",
    "sleeves",
    "fabric",
    "length",
    "occasion"
];

const stats = {};

fields.forEach(f => stats[f] = {});

data.forEach(p => {

    if (!p.ai_dna) return;

    fields.forEach(field => {

        let value = p.ai_dna[field];

        if (!value) return;

        if (Array.isArray(value)) {
            value.forEach(v => {
                stats[field][v] = (stats[field][v] || 0) + 1;
            });
        } else {
            stats[field][value] = (stats[field][value] || 0) + 1;
        }

    });

});

for (const field of fields) {

    console.log("\n===== " + field + " =====");

    const sorted = Object.entries(stats[field])
        .sort((a, b) => b[1] - a[1]);

    sorted.slice(0, 10).forEach(([k, v]) => {
        console.log(k, ":", v);
    });

}