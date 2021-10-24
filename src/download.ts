import { ILeague, ITrack, ITrackResult, IUser } from "./types";
import got from "got";
import cheerio, { Cheerio, Element } from "cheerio";
import * as fs from "fs";

const cookie = "session=.eJw9kMmOozAARP_F5yCxGey-wdAhZKEbZx0uCIwJhIDBrEmr_304za2kKj1V1Q-IGiaquGZ1Dz56MbAViCllXRf1vGQ1-AB2YM-XcMis77EcLRrNTU_P5-uh_jSDrbe2d2FH4AMfjKzoVAEFotfGbp3zi1SZn3vEM-WdZJ_Sxq_a2pE2ptRp3wQ7rH2OQ4CycB_of-9rf2241q1LtIBP_SuI56O3h9iQtmpFvoqXKqv8ma3vb4UncTKY9gxWgA5CLMWjoWNiaaooCpRl3cSquZhsbgrBuihehimGBmWEVN1cgSJdohhTDUGkSYasGJIOMZVijZmSuYzHOoPpIhaGYNmCyP9_YQWWULRJIn4uxvhRhY9Tm0fT6eUf3EJ-tps7matjiHgxvSfquWLXtASW9LrpbX_SuwARP-O4mEbECN8-8kPm3K7c4gkrrFScL_vKSS7He5nhPze3Vbx5PulpyyLmzmW9o0-CwO8_G4uPZQ.YXVqhg.EBEA9VcFdkCVZVRjNcqD6IKZ19M";

const leagueIds = [
    // "f85aed70522a418091741a64c7e18d2c", // I beleague in a thing called love
    "60a135402d18dc0022c27d4a", // Don't stop beleaguing
    "607226726c5a98003664c1f8", // I'm a beleaguer
]

function getRoundId(titleLink: Cheerio<Element>, leagueId: string) {
    const link = titleLink.attr("href");
    const match = link?.match(`/l/${leagueId}/(.+)/`);
    if (match) {
        return match[1];
    }
    throw new Error("No round id: " + link);
}

async function loadTrackResults(leagueId: string, roundId: string): Promise<ITrackResult[]> {
    const response = await got(`https://musicleague.app/l/${leagueId}/${roundId}`, { headers: { cookie } });
    const $ = cheerio.load(response.body);

    return $(".song").map((_, songElem) => {
        const nameElem = $(".name", songElem);
        const trackName = nameElem.first().text();
        const spotifyLink = nameElem.attr("href")!;
        const byArtist = $(".artist", songElem).first().text();

        const track: ITrack = {
            artist: byArtist.substring("By ".length),
            name: trackName,
            spotifyLink
        };

        const submittedBy: IUser = {
            username: $(".submitter a", songElem).first().text(),
        }

        const votes = $(".vote-breakdown .row .vote", songElem).map((_, voteElem) => ({
            user: {
                username: $(".voter", voteElem).first().text(),
            },
            points: +$(".vote-count", voteElem).first().text()
        })).toArray()

        return {
            track,
            submittedBy,
            votes,
        }
    }).toArray();
}

async function downloadLeague(leagueId: string): Promise<ILeague> {
    const response = await got(`https://musicleague.app/l/${leagueId}/`, { headers: { cookie } });
    const $ = cheerio.load(response.body);

    const title = $(".league-title").first().text();

    const roundPromises = $(".round-bar").map(async (_, roundElem) => {
        const titleLinkElem = $(".round-title", roundElem).first();
        const title = $(titleLinkElem).text();
        const roundId = getRoundId($(titleLinkElem), leagueId);
        const description = $(".status-text", roundElem).text();
        const trackResults = await loadTrackResults(leagueId, roundId);

        return {
            title,
            id: roundId,
            description,
            trackResults
        };
    });

    const rounds = await Promise.all(roundPromises.toArray());

    return { id: leagueId, title, rounds };
}

export async function downloadAndSaveAllLeagues() {
    const allLeagues = await Promise.all(leagueIds.map(downloadLeague));
    const stringified = JSON.stringify(allLeagues, null, 2);
    fs.writeFileSync("src/leagues.json", stringified);
}

downloadAndSaveAllLeagues().then(() => console.log("Done"));