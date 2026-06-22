import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "ישראלפדיה — אנציקלופדיה של ישראל והעולם היהודי",
    template: "%s · ישראלפדיה",
  },
  description:
    "אנציקלופדיה מהימנה ומתועדת של ישראל, ההיסטוריה היהודית, תרבות, דת, שפה, מדע וקהילות יהודיות ברחבי העולם.",
};

export default function HebrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="he" className="he-layout">
      {children}
    </div>
  );
}
