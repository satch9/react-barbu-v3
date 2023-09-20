import express from "express";
import http from "http";
import cors from "cors";
import { ServerSocket } from "./socket";

const app = express();

const PORT = process.env.PORT || 4003;

/** Server handling */
const httpServer = http.createServer(app);

/** Start the socket*/
new ServerSocket(httpServer);

/** Enable CORS */
app.use(cors())

/** Log the request */
app.use((req, res, next) => {
    console.info(
        `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
    );
    res.on("finish", () => {
        console.info(
            `METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`
        );
    });

    next();
});

/** Parse the body of the request */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/** Rules of our API */
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method == "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }

    next();
});

/** Healthcheck */
app.get("/ping", (_req, res) => {
    return res.status(200).json({ hello: "world!" });
});

/** Error handling */
app.use((req, res, err) => {
    // Gère toutes les autres erreurs non traitées ici
    console.error(err);

    // Autres types d'erreurs non prévues
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
