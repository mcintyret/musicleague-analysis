import { ILeague } from "./types";

function flatten<T>(array: T[][]): T[] {
    const result: T[] = [];
    array.forEach(a => result.push(...a));
    return result;
}

export interface IGlobalAnalysis {
    mostPointsGivenTo: IVoteHistory;
    fewestPointsGivenTo: IVoteHistory;
    mostPointsForEachOther: IVoteHistory;
    fewestPointsForEachOther: IVoteHistory;
    fewestVotesForEachOther: IVoteHistory;
    // asymmetricalPointsFor: IVoteHistory;
    // asymmetricalPointsAgainst: IVoteHistory;
    sameWavelength: IVoterAlignment;
    differentWavelength: IVoterAlignment;
}

export interface IUserAnalysis extends IGlobalAnalysis {
    user: string;
    mostPointsGivenByThisUser: IVoteHistory;
    fewestPointsGivenByThisUser: IVoteHistory;
}

export interface IAnalysis {
    global: IGlobalAnalysis;
    user: { [userName: string]: IUserAnalysis };
}

/**
 * Analysis ideas:
 *
 * For each user:
 * - who gave them the most points
 * - who gave them the most downvotes
 * - who gave them the fewest points
 *
 * - favourite tracks
 * - most successful round
 * - least successful round
 *
 * Global:
 * - Best friends (most points from A to B)
 * - Worst enemies (fewest points from A to B)
 * - Different wavelength (fewest votes on each-others stuff)
 */
export function analyzeLeague(league: ILeague) {
    const voteHistories = getVoteHistories(league);

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

    const alignments = getVoterAlignment(league);
    const leastAligned = alignments[0];
    console.info(`Least aligned: ${leastAligned.userOne} and ${leastAligned.userTwo} gave ${leastAligned.points} points to the same track`);
    const mostAligned = alignments[alignments.length - 1];
    console.info(`Most aligned: ${mostAligned.userOne} and ${mostAligned.userTwo} gave ${mostAligned.points} points to the same track`);
}

export function analyzeLeagueV2(league: ILeague): IAnalysis {
    const voteHistories = getVoteHistories(league);
    const pairwise = generatePairwiseHistories(voteHistories);
    const alignments = getVoterAlignment(league);

    const allVoteHistories = flatten(Object.values(voteHistories).map(vh => Object.values(vh)));
    const global = analyzeHistories(allVoteHistories, pairwise, alignments);
    const user: IAnalysis["user"] = {};
    for (const userName in voteHistories) {
        const userHistories = Object.values(voteHistories[userName]);
        const userPairwise = pairwise.filter(p => p.voter === userName || p.submitter === userName);
        const userAlignments = alignments.filter(p => p.userOne === userName || p.userTwo === userName);

        let mostPointsGivenByThisUser: IVoteHistory | undefined;
        let fewestPointsGivenByThisUser: IVoteHistory | undefined;
        for (const otherUser in voteHistories) {
            if (otherUser === userName) {
                continue;
            }
            const history = voteHistories[otherUser][userName];
            if (mostPointsGivenByThisUser == null || mostPointsGivenByThisUser.totalPoints < history.totalPoints) {
                mostPointsGivenByThisUser = history;
            }
            if (fewestPointsGivenByThisUser == null || fewestPointsGivenByThisUser.totalPoints > history.totalPoints) {
                fewestPointsGivenByThisUser = history;
            }
        }

        user[userName] = {
            user: userName,
            mostPointsGivenByThisUser: mostPointsGivenByThisUser!,
            fewestPointsGivenByThisUser: fewestPointsGivenByThisUser!,
            ...analyzeHistories(userHistories, userPairwise, userAlignments)

        }
    }

    return { global, user };
}

function analyzeHistories(voteHistories: IVoteHistory[], pairwiseHistories: IVoteHistory[], alignments: IVoterAlignment[]): IGlobalAnalysis {
    voteHistories.sort((a, b) => a.totalPoints - b.totalPoints);
    const mostPointsGivenTo = voteHistories[voteHistories.length - 1];
    const fewestPointsGivenTo = voteHistories[0];

    pairwiseHistories.sort((a, b) => a.totalPoints - b.totalPoints);
    const mostPointsForEachOther = pairwiseHistories[pairwiseHistories.length - 1];
    const fewestPointsForEachOther = pairwiseHistories[0];

    pairwiseHistories.sort((a, b) => a.totalVotes - b.totalVotes);
    const fewestVotesForEachOther = pairwiseHistories[0];

    alignments.sort((a, b) => a.points - b.points);
    const differentWavelength = alignments[0];
    const sameWavelength = alignments[alignments.length - 1];

    return {
        mostPointsGivenTo,
        fewestPointsGivenTo,
        mostPointsForEachOther,
        fewestPointsForEachOther,
        fewestVotesForEachOther,
        differentWavelength,
        sameWavelength,
    }
}

export interface IVoteHistory {
    voter: string;
    submitter: string;
    totalPoints: number;
    totalVotes: number;
    totalDownVotes: number;
    totalNegativePoints: number;
}

interface IVoteHistories {
    [submitter: string]: {
        [voter: string]: IVoteHistory;
    }
}

function generatePairwiseHistories(voteHistories: IVoteHistories): IVoteHistory[] {
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
            });
        });
        doneSubmitters.add(submitter);
    }

    return pairwiseHistories;
}

function emptyVoteHistory(submitter: string, voter: string) {
    return {
        submitter,
        voter,
        totalDownVotes: 0,
        totalNegativePoints: 0,
        totalPoints: 0,
        totalVotes: 0
    }
}

function getVoteHistories(league: ILeague): IVoteHistories {
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
                    voterHistory[voter] = emptyVoteHistory(submitter, voter);
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

    for (const submitter in voteHistories) {
        const userHistories = voteHistories[submitter];
        for (const voter in voteHistories) {
            if (submitter === voter) {
                continue;
            }
            if (userHistories[voter] == null) {
                userHistories[voter] = emptyVoteHistory(submitter, voter);
            }
        }
    }

    return voteHistories;
}

export interface IVoterAlignment {
    userOne: string;
    userTwo: string;
    points: number;
}

function getVoterAlignment(league: ILeague) {
    const users = getUsers(league);
    const alignments: IVoterAlignment[] = [];
    for (let i = 0; i < users.length - 1; i++) {
        const userOne = users[i];
        for (let j = i + 1; j < users.length; j++) {
            const userTwo = users[j];

            let totalAlignment = 0;

            league.rounds.forEach(round => {
                round.trackResults.forEach(track => {
                    if (track.submittedBy.username === userOne || track.submittedBy.username === userTwo) {
                        return;
                    }

                    const userOnePoints = track.votes.find(vote => vote.user.username === userOne)?.points ?? 0;
                    const userTwoPoints = track.votes.find(vote => vote.user.username === userTwo)?.points ?? 0;

                    if (Math.sign(userOnePoints) !== Math.sign(userTwoPoints)) {
                        return;
                    }

                    totalAlignment += Math.min(Math.abs(userOnePoints), Math.abs(userTwoPoints));
                });
            });

            alignments.push({ userOne, userTwo, points: totalAlignment });
        }
    }

    return alignments;
}

function getUsers(league: ILeague): string[] {
    const users = new Set<string>();
    league.rounds.forEach(round => {
        round.trackResults.forEach(trackResult => {
            users.add(trackResult.submittedBy.username);
        });
    });
    return Array.from(users);
}
