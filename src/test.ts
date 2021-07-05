import { ILeague } from "./types";
import { analyzeLeague } from "./analyze";

async function analyzeMusicLeague(leagueId: string) {
    const league = require("./data.json") as ILeague;
    analyzeLeague(league);
}

analyzeMusicLeague("607226726c5a98003664c1f8")
    .then(() => console.log("done"))
    .catch(err => console.error(err));
