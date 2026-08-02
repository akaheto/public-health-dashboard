// Dev utility: print the schema + sample rows for one or more PopHIVE parquet
// files. Usage: node scripts/inspect-bundle.mjs bundle_x/dist/file.parquet ...
import duckdb from "duckdb";
const db = new duckdb.Database(":memory:");
const conn = db.connect();

const files = process.argv.slice(2);

function run(sql) {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

const base = "https://raw.githubusercontent.com/PopHIVE/Ingest/main/data";

(async () => {
  await run("INSTALL httpfs; LOAD httpfs;");
  for (const f of files) {
    const url = `${base}/${f}`;
    console.log("\n===", f, "===");
    try {
      const cols = await run(`DESCRIBE SELECT * FROM read_parquet('${url}')`);
      console.log(cols.map(c => `${c.column_name} (${c.column_type})`).join(", "));
      const sample = await run(`SELECT * FROM read_parquet('${url}') LIMIT 3`);
      console.log(JSON.stringify(sample, null, 2));
    } catch (e) {
      console.log("ERROR:", e.message);
    }
  }
  process.exit(0);
})();
