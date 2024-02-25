import { format } from 'd3-format';

export const formatValue = format('.2');
export const formatPct = format(',.2%');

export function toLocaleString(snapshot) {
    const date = new Date(+snapshot);
    const localString = date.toLocaleString();
    return localString;
}