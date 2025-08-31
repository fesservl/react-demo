export function generateDateArray(count, direction = "forward", step = 1) {
    if (count <= 0) {
        return [];
    }

    const dates = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
        const date = new Date(today);
        const offset = direction === "forward" ? i * step : -i * step;
        date.setDate(today.getDate() + offset);
        dates.push(date);
    }

    return dates;
}

export function generateDateStringArray(count, direction = "forward", step = 1) {
    return generateDateArray(count, direction, step).map((date) => date.toISOString().split("T")[0]);
}

export function generateTimeArray(stepMinutes = 60, format = 'HH:MM') {
    const times: string[] = [];
    const totalMinutesInDay = 24 * 60; // 1440 минут в сутках

    for (let minutes = 0; minutes < totalMinutesInDay; minutes += stepMinutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        let timeString;
        if (format === 'H:MM') {
            timeString = `${hours}:${mins.toString().padStart(2, '0')}`;
        } else {
            timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }

        times.push(timeString);
    }

    return times;
}

export function generateTimeRange(startTime, endTime, stepMinutes = 60, format = 'HH:MM') {
    const times = [];

    // Парсинг начального времени
    const [startHours, startMins] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMins;

    // Парсинг конечного времени
    const [endHours, endMins] = endTime.split(':').map(Number);
    const endTotalMinutes = endHours * 60 + endMins;

    for (let minutes = startTotalMinutes; minutes <= endTotalMinutes; minutes += stepMinutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        let timeString;
        if (format === 'H:MM') {
            timeString = `${hours}:${mins.toString().padStart(2, '0')}`;
        } else {
            timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }

        times.push(timeString);
    }

    return times;
}

export function generateWorkingHours(stepMinutes = 60) {
    return generateTimeRange('09:00', '18:00', stepMinutes);
}