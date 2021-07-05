export interface ILeague {
    id: string;
    title: string;
    rounds: IRound[];
}

export interface IRound {
    id: string;
    title: string;
    description: string;
    trackResults: ITrackResult[];
}

export interface IUser {
    username: string;
}

export interface ITrack {
    name: string;
    spotifyLink: string;
    artist: string;
}

export interface ITrackResult {
    track: ITrack;
    submittedBy: IUser
    votes: IVote[];
}

export interface IVote {
    user: IUser;
    points: number;
}


