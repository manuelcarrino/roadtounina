require("dotenv").config();

const app = require("./src/app");
const { sequelize } = require("./src/db");
require("./src/models");

const port = process.env.PORT || 3001;

const startServer = async () => {
	try {
		await sequelize.authenticate();
		if (process.env.DB_SYNC === "alter") {
			await sequelize.sync({ alter: true });
		} else {
			await sequelize.sync();
		}
		app.listen(port, () => {
			console.log(`Backend listening on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
};

startServer();
