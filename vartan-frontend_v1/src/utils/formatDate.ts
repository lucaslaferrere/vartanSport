import {parseISO, format as formatFns, isValid} from "date-fns";

export const formatDate = (date: string, format: string = "yyyy-MM-dd HH:mm:ss") => {
    if (!date || date === '' || date === '—') return '';
    try {
        const parsed = parseISO(`${date}Z`);
        if (!isValid(parsed)) return '';
        return formatFns(parsed, format);
    } catch {
        return '';
    }
}

export const formatUnixDate = (date: number, format: string = "yyyy-MM-dd hh:mm:ss.SSS") => {
    if (!date) return '';
    return formatFns(date, format);
}

export const formatFilterDate = (date: string, format: string = "yyyy-MM-dd") => {
    if (!date || date === '' || date === '—') return '';
    try {
        const d = new Date(date);
        if (!isValid(d)) return '';
        return formatFns(d, format);
    } catch {
        return '';
    }
}