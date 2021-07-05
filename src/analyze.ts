import { ILeague } from "./types";

function flatten<T>(array: T[][]): T[] {
    const result: T[] = [];
    array.forEach(a => result.push(...a));
    return result;
}

/**
 * Analysis ideas:
 *
 * For each user:
 * - who gave them the most points
 * - who gave them the most downvotes
 * - who gave them the fewest points
 *
 * Global:
 * - Best friends (most points from A to B)
 * - Worst enemies (fewest points from A to B)
 * - Different wavelength (fewest votes on each-others stuff)
 */
export function analyzeLeague(league: ILeague) {
    const voteHistories: { [submitter: string]: { [voter: string]: IVoteHistory } } = {};
    league.rounds.forEach(round => {
        round.trackResults.forEach(trackResult => {
            const submitter = trackResult.submittedBy.username;
            if (voteHistories[submitter] === undefined) {
                voteHistories[submitter] = {};
            }
            const voterHistory = voteHistories[submitter];

            trackResult.votes.forEach(vote => {
                const voter = vote.user.username;
                if (voterHistory[voter] === undefined) {
                    voterHistory[voter] = {
                        submitter,
                        voter,
                        totalDownVotes: 0,
                        totalNegativePoints: 0,
                        totalPoints: 0,
                        totalVotes: 0
                    };
                }
                const pairHistory = voterHistory[voter];

                pairHistory.totalVotes++;
                pairHistory.totalPoints += vote.points;
                if (vote.points < 0) {
                    pairHistory.totalDownVotes++;
                    pairHistory.totalNegativePoints += vote.points;
                }
            });
        });
    });

    const allVoteHistories = flatten(Object.values(voteHistories).map(vh => Object.values(vh)));
    console.info("Global results");
    allVoteHistories.sort((a, b) => a.totalPoints - b.totalPoints);
    const bestVh = allVoteHistories[allVoteHistories.length - 1];
    console.info(`Best friend: ${bestVh.voter} gave ${bestVh.submitter} ${bestVh.totalPoints} points.`);
    const worstVh = allVoteHistories[0];
    console.info(`Worst enemy: ${worstVh.voter} gave ${worstVh.submitter} ${worstVh.totalPoints} points.`);
    allVoteHistories.sort((a, b) => a.totalVotes - b.totalVotes);
    const leastInterestedVh = allVoteHistories[0];
    console.info(`Least interested: ${leastInterestedVh.voter} only voted on ${leastInterestedVh.totalVotes} of ${leastInterestedVh.submitter}'s tracks`);
    console.info();

    const pairwise = generatePairwiseHistories(voteHistories);
    pairwise.sort((a, b) => a.totalPoints - b.totalPoints);
    const bestPairwiseVh = pairwise[pairwise.length - 1];
    console.info(`Best team: ${bestPairwiseVh.voter} and ${bestPairwiseVh.submitter} gave each other ${bestPairwiseVh.totalPoints} points in total.`);
    const worstPairwiseVh = pairwise[0];
    console.info(`Worst team: ${worstPairwiseVh.voter} and ${worstPairwiseVh.submitter} only gave each other ${worstPairwiseVh.totalPoints} points in total.`);
    pairwise.sort((a, b) => a.totalVotes - b.totalVotes);
    const leastInterestedPairwiseVh = pairwise[0];
    console.info(`Mutually disinterested: ${leastInterestedPairwiseVh.voter} and ${leastInterestedPairwiseVh.submitter} only voted for each other ${leastInterestedPairwiseVh.totalVotes} times.`);
    console.info();

    for (const submitter in voteHistories) {
        const submitterVoteHistories = Object.values(voteHistories[submitter]);
        console.info(submitter);
        submitterVoteHistories.sort((a, b) => a.totalPoints - b.totalPoints);
        const bestFriend = submitterVoteHistories[submitterVoteHistories.length - 1];
        console.info(`Best friend: ${bestFriend.voter} (${bestFriend.totalPoints} points)`);
        const worstEnemy = submitterVoteHistories[0];
        console.info(`Worst enemy: ${worstEnemy.voter} (${worstEnemy.totalPoints} points)`);

        submitterVoteHistories.sort((a, b) => a.totalVotes - b.totalVotes);
        const leastInterested = submitterVoteHistories[0];
        console.info(`Least interested: ${leastInterested.voter} (${leastInterested.totalVotes} votes)`);
        console.info();
    }
}

interface IVoteHistory {
    voter: string;
    submitter: string;
    totalPoints: number;
    totalVotes: number;
    totalDownVotes: number;
    totalNegativePoints: number;
}

function generatePairwiseHistories(voteHistories: { [submitter: string]: { [voter: string]: IVoteHistory } }): IVoteHistory[] {
    const pairwiseHistories: IVoteHistory[] = [];

    const doneSubmitters = new Set<string>();
    for (const submitter in voteHistories) {
        const submitterVoteHistories = Object.values(voteHistories[submitter]);
        submitterVoteHistories.forEach(voteHistory => {
            const voter = voteHistory.voter;
            if (doneSubmitters.has(voter)) {
                return;
            }
            const otherHistory = voteHistories[voter][submitter];

            pairwiseHistories.push({
                voter,
                submitter,
                totalPoints: voteHistory.totalPoints + otherHistory.totalPoints,
                totalVotes: voteHistory.totalVotes + otherHistory.totalVotes,
                totalDownVotes: voteHistory.totalDownVotes + otherHistory.totalDownVotes,
                totalNegativePoints: voteHistory.totalNegativePoints + otherHistory.totalNegativePoints
            })
        });
        doneSubmitters.add(submitter);
    }

    return pairwiseHistories;
}
