import mysql from "mysql2/promise";

const dbConfig = {
  host: "mysql-db", // Use the service name defined in docker-compose.yml
  user: "user",
  password: "userpassword",
  database: "monitoring",
};

export async function fetchMetrics(startTime, endTime) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM metrics WHERE timestamp BETWEEN ? AND ?",
      [startTime, endTime]
    );
    await connection.end();
    return rows;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}