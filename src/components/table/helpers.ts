export const createDateArray = (startDay: Date, endDay: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDay);

    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDay);
    endDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

export const formatDate = (date: Date) => {
    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
};
