import styles from "./Settings.module.scss";
import { Table } from "../components/table/Table.tsx";
import { generateDateStringArray, generateTimeArray } from "./helpers.ts";

export const Settings = () => {
    return (
        <div className={styles.settings}>
            <Table<{ date: string }>
                data={generateDateStringArray(7).map((date) => ({ date }))}
                scheme={[
                    { id:date, name: "Дата", getValue: (row) => row.date },
                    ...generateTimeArray().map((time) => ({
                        id: time,
                        getValue() {
                            return "";
                        },
                        name: time,
                    })),
                ]}
            />
        </div>
    );
};
