import * as React from "react";
import { ILeague } from "../types";
import {ItemRenderer, MultiSelect } from "@blueprintjs/select";
import { MenuItem, Tag } from "@blueprintjs/core";

export interface ILeagueSelectorProps {
    allLeagues: ILeague[];
    selectedLeagues: ILeague[];
    onSelectLeagues(leagues: ILeague[]): void;
}

export const LeagueSelector: React.FC<ILeagueSelectorProps> = ({ allLeagues, selectedLeagues, onSelectLeagues }) => {

    const itemRenderer: ItemRenderer<ILeague> = React.useCallback((league, {handleClick}) => (
        <MenuItem key={league.id} text={league.title} onClick={handleClick} />
    ), []);

    const tagRenderer = React.useCallback((league: ILeague) => (
        <Tag key={league.id}>{league.title}</Tag>
    ), []);

    const onSelectLeague = React.useCallback((league: ILeague) => {
        const idx = selectedLeagues.indexOf(league);
        if (idx >= 0) {
            const newLeagues = [...selectedLeagues];
            newLeagues.splice(idx, 1);
            onSelectLeagues(newLeagues);
        } else {
            onSelectLeagues([...selectedLeagues, league]);
        }
    }, [selectedLeagues, onSelectLeagues]);

    return (
        <MultiSelect<ILeague>
            items={allLeagues}
            selectedItems={selectedLeagues}
            itemRenderer={itemRenderer}
            tagRenderer={tagRenderer}
            onItemSelect={onSelectLeague}
            onRemove={onSelectLeague}
            popoverProps={{minimal: true}}
            fill={true}
        />
    )
}