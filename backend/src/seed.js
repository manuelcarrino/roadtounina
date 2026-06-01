const bcrypt = require("bcrypt");

const { sequelize } = require("./db");
const { User, Game } = require("./models");

const TARGET_PAGE =
  process.env.TARGET_PAGE || "Universita degli Studi di Napoli Federico II";

const samplePages = [
  "Napoli",
  "Italia",
  "Europa",
  "Storia",
  "Scienza",
  "Fisica",
  "Matematica",
  "Informatica",
  "Musica",
  "Arte",
  "Letteratura",
  "Calcio",
  "Cinema",
  "Geografia",
  "Vesuvio",
  "Vesuvio",
  "Campania",
  "Pompei",
  "Universita",
  "Ricerca",
  "Didattica",
  "Biblioteca",
  "Museo",
  "Architettura",
  "Ingegneria",
];

const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

const buildPath = () => {
  const hops = Math.floor(Math.random() * 6) + 3;
  const startPage = randomItem(samplePages);
  const path = [startPage];
  for (let i = 0; i < hops; i += 1) {
    path.push(randomItem(samplePages));
  }
  path.push(TARGET_PAGE);
  return path;
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    await Game.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });

    const passwordHash = await bcrypt.hash("Password123!", 12);
    const users = Array.from({ length: 20 }, (_, index) => {
      const id = index + 1;
      return {
        username: `user${String(id).padStart(2, "0")}`,
        email: `user${String(id).padStart(2, "0")}@rtu.local`,
        passwordHash,
      };
    });

    const createdUsers = await User.bulkCreate(users, { returning: true });

    const games = Array.from({ length: 40 }, () => {
      const user = randomItem(createdUsers);
      const path = buildPath();
      const clicks = Math.max(0, path.length - 1);
      const durationSeconds = Math.floor(Math.random() * 420) + 60;
      const startedAt = new Date(Date.now() - durationSeconds * 1000);
      const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      return {
        userId: user.id,
        startPage: path[0],
        currentPage: TARGET_PAGE,
        targetPage: TARGET_PAGE,
        path,
        clicks,
        status: "completed",
        startedAt,
        endedAt,
        durationSeconds,
      };
    });

    await Game.bulkCreate(games);
    console.log("Seed completato: 20 utenti, 40 partite completate.");
  } catch (error) {
    console.error("Seed fallito:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seed();
