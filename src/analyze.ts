import {IRound, ITrackResult} from "./types";
import {flatten} from "./utils";

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
    totalRoundsPlayed: number;
    totalPointsReceived: number;
    averagePointsPerTrack: number;
    bestTrack: IBestTrack;
    bestRound: IBestRound;
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
export function analyzeLeague(rounds: IRound[]): IAnalysis {
    const voteHistories = getVoteHistories(rounds);
    const pairwise = generatePairwiseHistories(voteHistories);
    const alignments = getVoterAlignment(rounds);

    const allVoteHistories = flatten(Object.values(voteHistories).map(vh => Object.values(vh.voteHistory)));
    const global = analyzeHistories(allVoteHistories, pairwise, alignments);
    const user: IAnalysis["user"] = {};
    for (const userName in voteHistories) {
        const submitterData = voteHistories[userName];
        const userHistories = Object.values(submitterData.voteHistory);
        const userPairwise = pairwise.filter(p => p.voter === userName || p.submitter === userName);
        const userAlignments = alignments.filter(p => p.userOne === userName || p.userTwo === userName);

        let mostPointsGivenByThisUser: IVoteHistory | undefined;
        let fewestPointsGivenByThisUser: IVoteHistory | undefined;
        for (const otherUser in voteHistories) {
            if (otherUser === userName) {
                continue;
            }
            const history = voteHistories[otherUser].voteHistory[userName];
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
            ...analyzeHistories(userHistories, userPairwise, userAlignments),
            bestTrack: submitterData.bestTrack,
            bestRound: submitterData.bestRound,
            totalPointsReceived: submitterData.totalPoints,
            totalRoundsPlayed: submitterData.totalRounds,
            averagePointsPerTrack: submitterData.totalPoints / submitterData.totalTracks,
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
    [submitter: string]: ISubmitterData;
}

export interface IBestRound {
    round: IRound;
    points: number;
}

export interface IBestTrack {
    track: ITrackResult;
    points: number;
}

interface ISubmitterData {
    voteHistory: { [voter: string]: IVoteHistory };
    totalRounds: number;
    totalTracks: number;
    totalPoints: number;
    bestRound: IBestRound;
    bestTrack: IBestTrack;
}

function generatePairwiseHistories(voteHistories: IVoteHistories): IVoteHistory[] {
    const pairwiseHistories: IVoteHistory[] = [];

    const doneSubmitters = new Set<string>();
    for (const submitter in voteHistories) {
        const submitterVoteHistories = Object.values(voteHistories[submitter].voteHistory);
        submitterVoteHistories.forEach(voteHistory => {
            const voter = voteHistory.voter;
            if (doneSubmitters.has(voter)) {
                return;
            }
            const otherHistory = voteHistories[voter].voteHistory[submitter];

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

function getVoteHistories(rounds: IRound[]): IVoteHistories {
    const voteHistories: { [submitter: string]: ISubmitterData } = {};
    rounds.forEach(round => {
        const submittersSeenThisRound = new Set<string>();
        const tracksPerUserThisRound = new Map<string, ITrackResult[]>();
        round.trackResults.forEach(trackResult => {
            const submitter = trackResult.submittedBy.username;
            if (voteHistories[submitter] === undefined) {
                voteHistories[submitter] = { voteHistory: {}, totalRounds: 0, totalTracks: 0, totalPoints: 0 } as any;
            }
            const submitterData = voteHistories[submitter]

            submitterData.totalTracks++;
            if (!submittersSeenThisRound.has(submitter)) {
                submitterData.totalRounds++;
                submittersSeenThisRound.add(submitter);
            }

            if (tracksPerUserThisRound.get(submitter) === undefined) {
                tracksPerUserThisRound.set(submitter, []);
            }
            const thisUserTracksThisRound = tracksPerUserThisRound.get(submitter)!;
            thisUserTracksThisRound.push(trackResult);

            const voterHistory = submitterData.voteHistory;

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
                submitterData.totalPoints += vote.points;
            });

            const trackPoints = totalTrackPoints(trackResult);
            if (submitterData.bestTrack == null || trackPoints > submitterData.bestTrack.points) {
                submitterData.bestTrack = {
                    track: trackResult,
                    points: trackPoints
                }
            }
        });

        for (const submitter in voteHistories) {
            const tracksThisRound = tracksPerUserThisRound.get(submitter);
            const submitterData = voteHistories[submitter];
            if (tracksThisRound === undefined || submitterData === undefined) {
                continue;
            }
            const totalPoints = tracksThisRound.reduce((total, track) => total + totalTrackPoints(track), 0);
            if (submitterData.bestRound === undefined || totalPoints > submitterData.bestRound.points) {
                submitterData.bestRound = {
                    round,
                    points: totalPoints
                }
            }
        }
    });

    for (const submitter in voteHistories) {
        const userHistories = voteHistories[submitter];
        for (const voter in voteHistories) {
            if (submitter === voter) {
                continue;
            }
            if (userHistories.voteHistory[voter] == null) {
                userHistories.voteHistory[voter] = emptyVoteHistory(submitter, voter);
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

function totalTrackPoints(track: ITrackResult): number {
    return track.votes.reduce((total, vote) => total + vote.points, 0);
}

function getVoterAlignment(rounds: IRound[]) {
    const users = getUsers(rounds);
    const alignments: IVoterAlignment[] = [];
    for (let i = 0; i < users.length - 1; i++) {
        const userOne = users[i];
        for (let j = i + 1; j < users.length; j++) {
            const userTwo = users[j];

            let totalAlignment = 0;

            rounds.forEach(round => {
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

function getUsers(rounds: IRound[]): string[] {
    const users = new Set<string>();
    rounds.forEach(round => {
        round.trackResults.forEach(trackResult => {
            users.add(trackResult.submittedBy.username);
        });
    });
    return Array.from(users);
}
