import {NonIdealState} from "@blueprintjs/core";
import * as React from "react";
import {
    analyzeLeague,
    IBestRound,
    IBestTrack,
    IGlobalAnalysis,
    IUserAnalysis,
    IVoteHistory,
    IVoterAlignment
} from "../analyze";
import * as leagues from "../leagues.json";
import {LeagueSelector} from "./LeagueSelector";
import {flatten} from "../utils";

const JONS_USERNAME = "murphs87";

export const Analysis = () => {
    const [selectedLeagues, setSelectedLeagues] = React.useState(leagues)

    const allRounds = React.useMemo(() => flatten(selectedLeagues.map(league => league.rounds)), [selectedLeagues]);

    const analysis = React.useMemo(() => analyzeLeague(allRounds), [allRounds]);

    const content = allRounds.length === 0
        ? <NonIdealState title="Pick some leagues!"/>
        : (<>
            <GlobalAnalysis {...analysis.global} />
            {Object.values(analysis.user).map(userAnalysis => <UserAnalysis
                key={userAnalysis.user} {...userAnalysis} />)}
        </>)

    return (
        <>
            <LeagueSelector
                allLeagues={leagues}
                selectedLeagues={selectedLeagues}
                onSelectLeagues={setSelectedLeagues}
            />
            {content}
        </>
    );
};

const GlobalAnalysis: React.FC<IGlobalAnalysis> = (analysis) => {
    return (
        <div className="analysis">
            <div className="analysis-title">All Users</div>
            <MostPointsGiven {...analysis.mostPointsGivenTo} />
            <FewestPointsGiven {...analysis.fewestPointsGivenTo} />
            <BestPartnership {...analysis.mostPointsForEachOther} />
            <WorstPartnership {...analysis.fewestPointsForEachOther} />
            <LeastInterested {...analysis.fewestVotesForEachOther} />
            <SameWavelength {...analysis.sameWavelength} />
            <DifferentWavelength {...analysis.differentWavelength} />
        </div>
    );
};

const UserAnalysis: React.FC<IUserAnalysis> = analysis => {
    return (
        <div id={analysis.user} className="analysis">
            <div className="analysis-title">{analysis.user ? analysis.user : JONS_USERNAME}</div>
            <TotalPointsReceived {...analysis} />
            <TotalRoundsPlayed {...analysis} />
            <AveragePointsPerTrack {...analysis} />
            <BestRound {...analysis.bestRound} />
            <BestTrack {...analysis.bestTrack} />
            <MostPointsGiven {...analysis.mostPointsGivenTo} />
            <FewestPointsGiven {...analysis.fewestPointsGivenTo} />
            <MostPointsGivenByThisUser {...analysis.mostPointsGivenByThisUser} />
            <FewestPointsGivenByThisUser {...analysis.fewestPointsGivenByThisUser} />
            <BestPartnership {...analysis.mostPointsForEachOther} />
            <WorstPartnership {...analysis.fewestPointsForEachOther} />
            <LeastInterested {...analysis.fewestVotesForEachOther} />
            <SameWavelength {...analysis.sameWavelength} />
            <DifferentWavelength {...analysis.differentWavelength} />
        </div>
    );
};

const User: React.FC<{ user: string }> = ({user}) => {
    const username = user ? user : JONS_USERNAME;
    return <span className="user">{username}</span>;
};

const AnalysisLine: React.FC = ({children}) => <div className="analysis-line">{children}</div>;

const TotalPointsReceived: React.FC<IUserAnalysis> = ({totalPointsReceived}) =>
    <AnalysisLine>Total points received: {totalPointsReceived}</AnalysisLine>

const TotalRoundsPlayed: React.FC<IUserAnalysis> = ({totalRoundsPlayed}) =>
    <AnalysisLine>Total rounds played: {totalRoundsPlayed}</AnalysisLine>

const AveragePointsPerTrack: React.FC<IUserAnalysis> = ({averagePointsPerTrack}) =>
    <AnalysisLine>Average points per track: {averagePointsPerTrack.toFixed(2)}</AnalysisLine>

const BestRound: React.FC<IBestRound> = ({round, points}) =>
    <AnalysisLine>Best round: {points} points in <User user={round.title}/></AnalysisLine>

const BestTrack: React.FC<IBestTrack> = ({track, points}) =>
    <AnalysisLine>Best track: {points} points for <a href={track.track.spotifyLink}>{track.track.name}</a></AnalysisLine>

const MostPointsGiven: React.FC<IVoteHistory> = ({voter, submitter, totalPoints}) => {
    return (
        <AnalysisLine>
            Most points given: <User user={voter}/> gave <User user={submitter}/> {pluralize("point", totalPoints)}
        </AnalysisLine>
    );
};

const FewestPointsGiven: React.FC<IVoteHistory> = ({voter, submitter, totalPoints}) => {
    return (
        <AnalysisLine>
            Fewest points given: <User user={voter}/> gave <User user={submitter}/> {pluralize("point", totalPoints)}
        </AnalysisLine>
    );
};

const MostPointsGivenByThisUser: React.FC<IVoteHistory> = ({voter, submitter, totalPoints}) => {
    return (
        <AnalysisLine>
            Most points given to: <User user={voter}/> gave <User user={submitter}/> {pluralize("point", totalPoints)}
        </AnalysisLine>
    );
};

const FewestPointsGivenByThisUser: React.FC<IVoteHistory> = ({voter, submitter, totalPoints}) => {
    return (
        <AnalysisLine>
            Fewest points given to: <User user={voter}/> gave <User user={submitter}/> {pluralize("point", totalPoints)}
        </AnalysisLine>
    );
};

const BestPartnership: React.FC<IVoteHistory> = ({voter, submitter, totalPoints}) => {
    return (
        <AnalysisLine>
            Best Partnership: <User user={voter}/> and <User user={submitter}/> gave each
            other {pluralize("point", totalPoints)}
        </AnalysisLine>
    );
};

const WorstPartnership: React.FC<IVoteHistory> = ({voter, submitter, totalPoints}) => {
    return (
        <AnalysisLine>
            Worst Partnership: <User user={voter}/> and <User user={submitter}/> gave each
            other {pluralize("point", totalPoints)}
        </AnalysisLine>
    );
};

const LeastInterested: React.FC<IVoteHistory> = ({voter, submitter, totalVotes}) => {
    return (
        <AnalysisLine>
            Least Interested: <User user={voter}/> and <User user={submitter}/> only voted for each
            other {pluralize("time", totalVotes)}
        </AnalysisLine>
    );
};

const SameWavelength: React.FC<IVoterAlignment> = ({userOne, userTwo, points}) => {
    return (
        <AnalysisLine>
            Same Wavelength: <User user={userOne}/> and <User user={userTwo}/> gave {pluralize("point", points)} to the
            same track
        </AnalysisLine>
    )
}

const DifferentWavelength: React.FC<IVoterAlignment> = ({userOne, userTwo, points}) => {
    return (
        <AnalysisLine>
            Different Wavelength: <User user={userOne}/> and <User user={userTwo}/> gave {pluralize("point", points)} to
            the same track
        </AnalysisLine>
    )
}

// Happily "vote", "point" and "time" all have simple pluralizations.
function pluralize(str: string, howMany: number) {
    if (howMany === 1) {
        return `${howMany} ${str}`;
    }
    return `${howMany} ${str}s`;
}
