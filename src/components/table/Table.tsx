import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "../../pages/Settings.tsx";
import styles from "./Table.module.scss";
import { createDateArray, formatDate } from "./helpers.ts";

type TimelineGridProps = {
    projects: Project[];
    onTimeChange: (project: Project, newStart: Date, newEnd: Date) => void;
    onCreateProject: (newStart: Date, newEnd: Date, row: number) => void;
    snapInterval?: number;
    startDay: Date;
    endDay: Date;
};

export const TimelineGrid = ({
    projects,
    onTimeChange,
    onCreateProject,
    snapInterval = 60,
    startDay,
    endDay,
}: TimelineGridProps) => {
    const [dragging, setDragging] = useState<{
        projectId: number;
        type: "move" | "resize-left" | "resize-right";
    } | null>(null);

    const days = createDateArray(startDay, endDay);

    const dragStartX = useRef<number>(0);
    const originalStart = useRef<Date | null>(null);
    const originalEnd = useRef<Date | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Функция для привязки времени к сетке
    const snapTimeToGrid = useCallback(
        (date: Date): Date => {
            const snappedDate = new Date(date);
            const minutes = snappedDate.getMinutes();
            const hours = snappedDate.getHours();

            // Округляем минуты до ближайшего интервала
            const snappedMinutes = Math.round(minutes / snapInterval) * snapInterval;

            snappedDate.setMinutes(snappedMinutes);
            snappedDate.setSeconds(0);
            snappedDate.setMilliseconds(0);

            // Если округлили до 60 минут, переходим к следующему часу
            if (snappedDate.getMinutes() === 60) {
                snappedDate.setHours(hours + 1);
                snappedDate.setMinutes(0);
            }

            console.log(snappedDate);
            return snappedDate;
        },
        [snapInterval],
    );

    // Генерация временных меток для сетки
    const timeLabels = Array.from({ length: 24 }, (_, i) => {
        const hours = i.toString().padStart(2, "0");
        return `${hours}:00`;
    });

    // Получение времени из позиции в пикселях
    const getTimeFromPosition = (e: React.MouseEvent): { startDate: Date; endDate: Date } => {
        const hours = +e.target.getAttribute("data-time").split(":")[0];
        const today = new Date(e.target.getAttribute("data-day"));
        today.setHours(hours, 0, 0, 0);

        const startDate = snapTimeToGrid(today);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Добавляем 1 час

        console.log( {startDate, endDate });
        return { startDate, endDate };
    };

    // Проверка пересечения с существующими проектами
    const hasOverlap = (newStart: Date, newEnd: Date, row: number, excludeId?: number): boolean => {
        return projects.some((project) => {
            if (excludeId && project.id === excludeId) return false;
            if ((project.row || 0) !== row) return false;

            const projectStart = project.startDate.getTime();
            const projectEnd = project.endDate.getTime();
            const newStartTime = newStart.getTime();
            const newEndTime = newEnd.getTime();

            return newStartTime < projectEnd && newEndTime > projectStart;
        });
    };

    // Получение позиции времени в пикселях
    const getTimePosition = (date: Date) => {
        const day = days.findIndex((item) => Math.floor(date.getDate()) === Math.floor(item.getDate())); // Простая логика для дней
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return day * 24 * 72 + (hours + minutes / 60) * 72; // 72px ширина ячейки
    };

    // Получение стиля для полосы проекта
    const getBarStyle = (project: Project) => {
        const startPos = getTimePosition(project.startDate);
        const endPos = getTimePosition(project.endDate);
        const width = Math.max(10, endPos - startPos);
        const top = 75 + (project.row || 0) * 32; // 32px высота строки

        return {
            left: `${startPos}px`,
            width: `${width}px`,
            top: `${top}px`,
        };
    };

    // Обработка клика по ячейке
    const handleCellClick = (e: React.MouseEvent, rowIndex: number) => {
        // Игнорируем клики во время перетаскивания
        if (dragging) return;

        // Игнорируем клики по существующим проектам
        const target = e.target as HTMLElement;
        if (target.closest(`.${styles.timelineBar}`)) return;

        const gridRect = gridRef.current?.getBoundingClientRect();
        if (!gridRect) return;

        const { startDate, endDate } = getTimeFromPosition(e);
        // Проверяем, нет ли пересечения с существующими проектами
        if (hasOverlap(startDate, endDate, rowIndex)) return;

        // Создаем новый проект
        if (onCreateProject) {
            onCreateProject(startDate, endDate, rowIndex);
        }
    };

    // Обработка начала перетаскивания
    const handleDragStart = (e: React.MouseEvent, project: Project, type: "move" | "resize-left" | "resize-right") => {
        e.preventDefault();
        setDragging({ projectId: project.id, type });
        dragStartX.current = e.clientX;
        originalStart.current = project.startDate;
        originalEnd.current = project.endDate;
    };

    // Обработка перемещения при перетаскивании
    const handleDragMove = useCallback(
        (e: MouseEvent) => {
            if (!dragging || !originalStart.current || !originalEnd.current || !gridRef.current) {
                return;
            }

            const gridRect = gridRef.current.getBoundingClientRect();
            const gridWidth = gridRect.width;
            const deltaX = e.clientX - dragStartX.current;
            const minutesPerPixel = (1440 * days.length) / gridWidth;
            const deltaMinutes = deltaX * minutesPerPixel;

            const project = projects.find((p) => p.id === dragging.projectId);
            if (!project) {
                return;
            }

            const originalStartTime = originalStart.current.getTime();
            const originalEndTime = originalEnd.current.getTime();

            let newStart: Date;
            let newEnd: Date;

            if (dragging.type === "move") {
                newStart = new Date(originalStartTime + deltaMinutes * 60000);
                const duration = originalEndTime - originalStartTime;
                newEnd = new Date(newStart.getTime() + duration);
            } else if (dragging.type === "resize-left") {
                newStart = new Date(originalStartTime + deltaMinutes * 60000);
                newEnd = originalEnd.current;
                if (newStart.getTime() >= newEnd.getTime()) {
                    newStart = new Date(newEnd.getTime() - snapInterval * 60 * 1000);
                }
            } else if (dragging.type === "resize-right") {
                newStart = originalStart.current;
                newEnd = new Date(originalEndTime + deltaMinutes * 60000);
                if (newEnd.getTime() <= newStart.getTime()) {
                    newEnd = new Date(newStart.getTime() + snapInterval * 60 * 1000);
                }
            } else {
                return;
            }

            // Привязываем к сетке
            if (dragging.type === "move" || dragging.type === "resize-left") {
                newStart = snapTimeToGrid(newStart);
            }

            if (dragging.type === "move" || dragging.type === "resize-right") {
                newEnd = snapTimeToGrid(newEnd);
            }

            // Для перемещения сохраняем длительность
            if (dragging.type === "move") {
                const duration = originalEndTime - originalStartTime;
                newEnd = new Date(newStart.getTime() + duration);
            }

            // Ограничиваем время в пределах суток
            const dayStart = new Date(project.startDate);
            dayStart.setHours(0, 0, 0, 0);

            // const dayEnd = new Date(dayStart);
            // dayEnd.setHours(23, 59, 59, 999);
            //
            if (newStart.getTime() < dayStart.getTime()) {
                newStart = new Date(dayStart);
                if (dragging.type === "move") {
                    const duration = newEnd.getTime() - newStart.getTime();
                    newEnd = new Date(newStart.getTime() + duration);
                }
            }
            //
            // if (newEnd.getTime() > dayEnd.getTime()) {
            //     newEnd = new Date(dayEnd);
            //     if (dragging.type === "move") {
            //         const duration = newEnd.getTime() - newStart.getTime();
            //         newStart = new Date(newEnd.getTime() - duration);
            //     }
            // }

            // Убеждаемся, что начало не позже окончания
            if (newStart.getTime() >= newEnd.getTime()) {
                if (dragging.type === "resize-left") {
                    newStart = new Date(newEnd.getTime() - snapInterval * 60 * 1000);
                } else {
                    newEnd = new Date(newStart.getTime() + snapInterval * 60 * 1000);
                }
            }

            // Проверяем пересечения с другими проектами (исключаем текущий)
            if (hasOverlap(newStart, newEnd, project.row || 0, project.id)) {
                return; // Не применяем изменения если есть пересечение
            }

            console.log({ newStart, newEnd });
            onTimeChange(project, newStart, newEnd);
        },
        [dragging, projects, onTimeChange, snapTimeToGrid, snapInterval],
    );

    // Обработка окончания перетаскивания
    const handleDragEnd = useCallback(() => {
        setDragging(null);
        originalStart.current = null;
        originalEnd.current = null;
    }, []);

    useEffect(() => {
        if (dragging) {
            document.addEventListener("mousemove", handleDragMove);
            document.addEventListener("mouseup", handleDragEnd);
            document.body.style.userSelect = "none";
            document.body.style.cursor = dragging.type === "move" ? "grabbing" : "col-resize";
        }

        return () => {
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("mouseup", handleDragEnd);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [dragging, handleDragMove, handleDragEnd]);

    return (
        <div className={styles.Container}>
            <div className={styles.timelineGridContainer}>
                <div className={styles.timelineHeader}>
                    {days.map((day, index) => (
                        <div key={index} className={styles.timelineDayHeader}>
                            <div className={styles.timelineDayLabel}>{formatDate(day)}</div>
                            <div className={styles.timelineDayHours}>
                                {timeLabels.map((label, index) => (
                                    <div key={index} className={styles.timelineGridCell}>
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={gridRef} className={styles.timelineGrid}>
                    {Array.from({ length: 5 }, (_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className={styles.timelineGridRow}
                            onClick={(e) => handleCellClick(e, rowIndex)}
                            style={{ cursor: dragging ? "default" : "pointer" }}
                        >
                            {days.map((day, dayIndex) => {
                                return timeLabels.map((timeLabel, timeIndex) => (
                                    <div
                                        key={`${dayIndex}-${timeIndex}`}
                                        className={styles.timelineGridCell}
                                        data-time={timeLabel}
                                        data-day={day.toString()}
                                    />
                                ));
                            })}
                        </div>
                    ))}
                </div>

                <div style={{ pointerEvents: "none" }}>
                    {projects.map((project) => {
                        const barStyle = getBarStyle(project);
                        const startTime = project.startDate.toTimeString().substring(0, 5);
                        const endTime = project.endDate.toTimeString().substring(0, 5);

                        return (
                            <div
                                key={project.id}
                                className={styles.timelineBar}
                                style={{ ...barStyle, pointerEvents: "auto" }}
                                onMouseDown={(e) => handleDragStart(e, project, "move")}
                            >
                                <div
                                    className={`${styles.timelineHandle} ${styles.timelineHandleLeft}`}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(e, project, "resize-left");
                                    }}
                                />

                                <div className={styles.timelineBarContent}>
                                    <span className={styles.timelineAssignee}>
                                        {project.assignee} {startTime} - {endTime}
                                    </span>
                                </div>

                                <div
                                    className={`${styles.timelineHandle} ${styles.timelineHandleRight}`}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(e, project, "resize-right");
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
