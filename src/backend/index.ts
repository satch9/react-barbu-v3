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

/** Enable CORS with specific options */
app.use(cors({
    origin: true, // Allow all origins in Bolt environment
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

/** Parse the body of the request */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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