/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";
import { connectRedis } from "./app/config/redis.config";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

let server: Server;


const startServer = async () => {
    try {
        await mongoose.connect(envVars.DB_URL)

        console.log("Connected to DB!!");

        // Drop legacy unique indices on 'name' if they exist to prevent conflicts with compound index {name: 1, organizationId: 1}
        try {
            const collections = ['tones', 'departments', 'recognitionvalues', 'categories'];
            for (const collName of collections) {
                const collection = mongoose.connection.db.collection(collName);
                const indexes = await collection.indexes();
                const nameIndex = indexes.find(idx => {
                    const keys = Object.keys(idx.key);
                    return keys.length === 1 && keys[0] === 'name' && idx.unique;
                });
                if (nameIndex) {
                    console.log(`Found unique index on 'name' only in ${collName}: ${nameIndex.name}. Dropping it...`);
                    await collection.dropIndex(nameIndex.name);
                    console.log(`Dropped unique index on 'name' in ${collName} successfully!`);
                }
            }
        } catch (err) {
            console.error("Failed to check/drop legacy database indexes:", err);
        }

        server = app.listen(Number(envVars.PORT), () => {
            console.log(`Server is listening to port ${envVars.PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
}

(async () => {
    await connectRedis()
    await startServer()
    await seedSuperAdmin()
})()

process.on("SIGTERM", () => {
    console.log("SIGTERM signal recieved... Server shutting down..");

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})

process.on("SIGINT", () => {
    console.log("SIGINT signal recieved... Server shutting down..");

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})


process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejecttion detected... Server shutting down..", err);

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception detected... Server shutting down..", err);

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})
