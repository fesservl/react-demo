import React, { useCallback, useState } from "react";
import { TimelineGrid } from "../components/table/Table.tsx";

export type Project = {
    id: number;
    assignee: string;
    startDate: Date;
    endDate: Date;
    row: number;
};

export const Settings = () => {
    const [projects, setProjects] = useState<Project[]>([
        {
            id: 1,
            assignee: "Анна Петрова",
            startDate: new Date("2025-08-21T01:00:00"),
            endDate: new Date("2025-08-21T02:00:00"),
            row: 0,
        },
        {
            id: 2,
            assignee: "Иван Сидоров",
            startDate: new Date("2025-08-22T02:00:00"),
            endDate: new Date("2025-08-22T04:00:00"),
            row: 1,
        },
        {
            id: 3,
            assignee: "Мария Козлова",
            startDate: new Date("2025-08-21T02:00:00"),
            endDate: new Date("2025-08-21T04:00:00"),
            row: 2,
        },
        {
            id: 4,
            assignee: "Петр Васильев",
            startDate: new Date("2025-08-21T02:00:00"),
            endDate: new Date("2025-08-21T04:00:00"),
            row: 3,
        },
    ]);

    const updateProjectDates = useCallback((project: Project, newStart: Date, newEnd: Date) => {
        // Проверяем, чтобы дата начала не была позже даты окончания
        if (newStart.getTime() >= newEnd.getTime()) {
            newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // Добавляем 1 час
        }

        // console.log({newStart, newEnd});

        setProjects((prev) =>
            prev.map((p) => (p.id === project.id ? { ...p, startDate: newStart, endDate: newEnd } : p)),
        );
    }, []);
    return (
        <TimelineGrid
            projects={projects}
            onCreateProject={(newStart, newEnd, row)=>setProjects(projects => [...projects,         {
                id: Math.random(),
                assignee: "",
                startDate: newStart,
                endDate: newEnd,
                row,
            }])}
            startDay={new Date("2025-08-21T00:00:00")}
            endDay={new Date("2025-08-22T00:00:00")}
            onTimeChange={updateProjectDates}
        />
    );
};
