import duckdb from "duckdb";

const POPHIVE_BASE =
  "https://raw.githubusercontent.com/PopHIVE/Ingest/main/data";

let ready: Promise<duckdb.Connection> | null = null;

function open(): Promise<duckdb.Connection> {
  if (!ready) {
    ready = new Promise((resolve, reject) => {
      const db = new duckdb.Database(":memory:");
      const conn = db.connect();
      conn.exec("INSTALL httpfs; LOAD httpfs;", (err) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });
  }
  return ready;
}

export async function queryParquet<T = Record<string, unknown>>(
  bundlePath: string,
  sql: (url: string) => string
): Promise<T[]> {
  const conn = await open();
  const url = `${POPHIVE_BASE}/${bundlePath}`;
  return new Promise((resolve, reject) => {
    conn.all(sql(url), (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}
