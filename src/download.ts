import { ILeague, ITrack, ITrackResult, IUser } from "./types";
import got from "got";
import cheerio, { Cheerio, Element } from "cheerio";

const cookie = "session=.eJw9kMmSmzAARP-Fs6lCYp8bAszAYJaMWeILBbKEgUFgAR7Hqfx7yCXn7up6r38L1Uz4WDPCVuFt5Rs5CDXGZFmqdRoIE94ElFpUxpcfSaCArwjIvlaEF_U4GWPnuUW0GqKbIxRnX7wRV6WrE2PyZ50WXnTLEOIPNwew5Ikd3qWGpqFXaJFWuxnGiwSlz5PYX6g6OvS7nLi_vZ7vwQnEI4m7xYrVF4_uj87OhzYmDP5K30nNApTTc7pGwkHAG-c7eLUthO-kAABVkhTdhPoekufccbJU9S4GNAiBYmiGdhC6615VCWz-eYoSNHVR0TVFbAxFEhXpinEDVVXSyL7BCd0nbv-_sFInhfPSBMYkg5my2-CHw9me2VBaVzMjw6exvXpm2rkz21tybD_0llYyOw5brlg_o_gbB2HS9OeOnkWSoiqOH2Ap5A-9KLzs9Tyajt5uCA1u78hgFPvkVF7voxmRk--VedJCV_jzF8xgi2M.YK_81w.yjQ_nNAkgsuRjRorZAntb4qdUOA";

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

export async function downloadLeague(leagueId: string): Promise<ILeague> {
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
