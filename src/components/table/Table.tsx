import styles from './Table.module.scss';

type TableProps<T extends object> = {
    scheme: {
        id: string;
        name: string;
        getValue: (value: T) => React.ReactNode;
        width?: string;
    }[];
    data: T[];
};
export const Table = <T extends object>({ scheme, data }: TableProps<T>) => {
    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    {scheme.map(({ id, name, width = "auto" }) => (
                        <th key={id} style={{ width }}>
                            {name}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((item, idx) => (
                    <tr key={idx}>
                        {scheme.map(({ id, getValue, name }) => (
                            <td key={id} data-label={name}>
                                {getValue(item)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
