import type { ReactNode } from "react";
import styles from "./MainContent.module.scss";

type MainContentProps = {
    children: ReactNode;
};

export const MainContent = ({ children }: MainContentProps) => <main className={styles.mainContent}>{children}</main>;
