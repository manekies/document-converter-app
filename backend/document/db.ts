import { SQLDatabase } from "encore.dev/storage/sqldb";

export const documentDB = new SQLDatabase("document", {
  migrations: "./migrations",
});
